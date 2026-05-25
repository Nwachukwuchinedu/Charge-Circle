import { Room, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { RoomWithDetails, RoomListItem } from '../types/room.types.js';
import { LeaderboardEntry } from '../types/game.types.js';
import { BroadcastService } from './broadcast.service.js';
import { randomizeTarget, getRoomLeaderboard } from './helpers.js';

const ROUND_DURATION_MS = 60_000;

/**
 * Manages room lifecycle: creation, joining, round management, and leaderboard.
 *
 * Each player has their own independent GameState (piece, target, score).
 * All players in an active room play simultaneously — no turn queue.
 * Rounds are timed (60s), after which a leaderboard is broadcast.
 */
export class RoomService {
  /**
   * Creates a new room. No game state is created — players
   * receive their own GameState when they join.
   *
   * @param ownerId - The user creating the room
   * @param name - Display name for the room
   * @param maxPlayers - Optional cap on concurrent players (null = unlimited)
   * @returns The newly created room
   * @throws AppError if the room name is invalid (Prisma constraint)
   */
  static async createRoom(ownerId: string, name: string, maxPlayers: number | null = null): Promise<Room> {
    const room = await prisma.room.create({
      data: {
        name,
        ownerId,
        maxPlayers,
        status: 'lobby',
        boardSize: 10,
      },
    });

    return room;
  }

  /**
   * Returns all non-idle rooms ordered by newest first,
   * with the count of active players (GameState rows).
   *
   * @returns Array of rooms with player counts
   */
  static async getRooms(): Promise<RoomListItem[]> {
    const rooms = await prisma.room.findMany({
      where: { status: { in: ['lobby', 'active'] } },
      include: { owner: { select: { nickname: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const counts = await prisma.gameState.groupBy({
      by: ['roomId'],
      _count: { userId: true },
    });
    const countMap = new Map(counts.map((c) => [c.roomId, c._count.userId]));

    return rooms.map((room) => ({
      ...room,
      players: [],
      activePlayers: countMap.get(room.id) ?? 0,
    }));
  }

  /**
   * Fetches room details including players, chat messages, and game states.
   *
   * @param roomId - The room to fetch
   * @returns Room details with players and chat, or null if not found
   * @throws AppError if the Prisma query fails
   */
  static async getRoomDetails(roomId: string): Promise<RoomWithDetails | null> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        gameStates: {
          include: { user: { select: { nickname: true } } },
        },
        owner: { select: { nickname: true } },
        chatMessages: {
          include: { user: { select: { nickname: true } } },
          take: 50,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!room) return null;

    return {
      ...room,
      players: room.gameStates.map((gs) => ({
        id: gs.userId,
        nickname: gs.user.nickname,
      })),
    };
  }

  /**
   * Adds a user to a room and creates their personal GameState.
   *
   * @param roomId - Target room
   * @param userId - The joining user
   * @returns Room details including the new player, or null if room not found
   * @throws AppError if the room is full
   */
  static async joinRoom(roomId: string, userId: string): Promise<RoomWithDetails> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, maxPlayers: true, status: true, boardSize: true },
    });
    if (!room) throw new AppError('Room not found');

    // Check if user already has a GameState (rejoining) — must be before
    // the capacity check so refreshing the page doesn't kick the user out.
    const existing = await prisma.gameState.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!existing) {
      // Count current players (excludes this user since they have no GameState yet)
      const playerCount = await prisma.gameState.count({ where: { roomId } });
      if (room.maxPlayers !== null && playerCount >= room.maxPlayers) {
        throw new AppError('Room is full');
      }
      const { x: targetX, y: targetY } = randomizeTarget(room.boardSize, 4, 4);

      await prisma.gameState.create({
        data: {
          roomId,
          userId,
          pieceX: Math.floor(room.boardSize / 2),
          pieceY: Math.floor(room.boardSize / 2),
          targetX,
          targetY,
          score: 0,
        },
      });
    }

    const details = await this.getRoomDetails(roomId);
    if (!details) throw new AppError('Failed to join room');
    return details;
  }

  /**
   * Removes a user from a room and deletes their GameState.
   *
   * @param roomId - The room to leave
   * @param userId - The leaving user
   */
  static async leaveRoom(roomId: string, userId: string): Promise<void> {
    try {
      await prisma.gameState.delete({
        where: { roomId_userId: { roomId, userId } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return;
      }
      throw error;
    }
  }

  /**
   * Returns the top-N players in a room sorted by score descending,
   * plus the requesting user's own entry.
   *
   * @param roomId - Target room
   * @param userId - The requesting user (to find their rank)
   * @param topN - How many top players to include (default 20)
   * @returns Top players and requesting user's entry
   */
  static async getLeaderboard(roomId: string, userId: string, topN = 20): Promise<{ top: LeaderboardEntry[]; me: LeaderboardEntry | null }> {
    const leaderboard = await getRoomLeaderboard(roomId);

    const top = leaderboard.slice(0, topN);
    const myEntry = leaderboard.find((e) => e.userId === userId);

    return { top, me: myEntry ?? null };
  }

  /**
   * Starts a timed round in the room.
   * Seeds a GameState for every player currently in the room who doesn't have one.
   * Transitions room status to `active` and schedules automatic round end.
   *
   * @param roomId - Target room
   * @param requestingUserId - The user requesting to start (must be owner)
   * @throws AppError if the room is not found or the requester is not the owner
   */
  static async startRound(roomId: string, requestingUserId: string): Promise<void> {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError('Room not found');
    if (room.ownerId !== requestingUserId) throw new AppError('Only the room owner can start a round');

    const roundEndsAt = new Date(Date.now() + ROUND_DURATION_MS);

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'active', roundEndsAt },
    });

    logger.info(`[Round] Round started in room "${room.name}" (${roomId}), ends at ${roundEndsAt.toISOString()}`);

    // Schedule round end
    setTimeout(() => {
      this.endRound(roomId).catch((err: any) => {
        logger.error(`[Round] Error ending round for room ${roomId}:`, { error: err.message });
      });
    }, ROUND_DURATION_MS);
  }

  /**
   * Ends the current round: broadcasts final leaderboard, transitions back to lobby.
   * No-op if the room is not found or not in `active` status.
   *
   * @param roomId - The room whose round is ending
   */
  static async endRound(roomId: string): Promise<void> {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== 'active') return;

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'lobby', roundEndsAt: null },
    });

    const leaderboard = await getRoomLeaderboard(roomId);

    BroadcastService.broadcast(roomId, 'round_end', { leaderboard });
    BroadcastService.broadcast(null, 'rooms_updated', null);

    logger.info(`[Round] Round ended for room ${roomId}`);
  }

  /**
   * Updates room name and/or max player count.
   * Only the room owner may edit the room.
   *
   * @param roomId - The room to update
   * @param requestingUserId - The requesting user (must be owner)
   * @param data - Fields to update
   * @returns Updated room details
   * @throws AppError if the room is not found or the requester is not the owner
   */
  static async updateRoom(
    roomId: string,
    requestingUserId: string,
    data: { name?: string; maxPlayers?: number | null },
  ): Promise<RoomWithDetails | null> {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError('Room not found');
    if (room.ownerId !== requestingUserId) throw new AppError('Only the room owner can edit this room');

    const updateData: Partial<Pick<Room, 'name' | 'maxPlayers'>> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.maxPlayers !== undefined) updateData.maxPlayers = data.maxPlayers;

    if (Object.keys(updateData).length > 0) {
      await prisma.room.update({ where: { id: roomId }, data: updateData });
    }

    return this.getRoomDetails(roomId);
  }

  /**
   * Deletes a room and all associated records (cascade).
   *
   * @param roomId - The room to delete
   * @param requestingUserId - The requesting user (must be owner)
   * @throws AppError if the room is not found or the requester is not the owner
   */
  static async deleteRoom(roomId: string, requestingUserId: string): Promise<void> {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError('Room not found');
    if (room.ownerId !== requestingUserId) throw new AppError('Only the room owner can delete this room');

    await prisma.room.delete({ where: { id: roomId } });

    BroadcastService.clearPendingDeltas(roomId);
  }
}
