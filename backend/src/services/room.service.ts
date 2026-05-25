import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { RoomWithDetails, RoomListItem } from '../types/room.types.js';
import { LeaderboardEntry } from '../types/game.types.js';
import { BroadcastService } from './broadcast.service.js';

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
   */
  static async createRoom(ownerId: string, name: string, maxPlayers: number | null = null) {
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
   */
  static async joinRoom(roomId: string, userId: string): Promise<RoomWithDetails | null> {
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
      // Create personal GameState with random target different from start position
      let targetX = Math.floor(Math.random() * room.boardSize);
      let targetY = Math.floor(Math.random() * room.boardSize);
      while (targetX === 4 && targetY === 4) {
        targetX = Math.floor(Math.random() * room.boardSize);
        targetY = Math.floor(Math.random() * room.boardSize);
      }

      await prisma.gameState.create({
        data: {
          roomId,
          userId,
          pieceX: 4,
          pieceY: 4,
          targetX,
          targetY,
          score: 0,
        },
      });
    }

    return this.getRoomDetails(roomId);
  }

  /**
   * Removes a user from a room and deletes their GameState.
   */
  static async leaveRoom(roomId: string, userId: string): Promise<void> {
    try {
      await prisma.gameState.delete({
        where: { roomId_userId: { roomId, userId } },
      });
    } catch {
      // User may already have been cleaned up
    }
  }

  /**
   * Returns the top-N players in a room sorted by score descending,
   * plus the requesting user's own entry.
   */
  static async getLeaderboard(roomId: string, userId: string, topN = 20): Promise<{ top: LeaderboardEntry[]; me: LeaderboardEntry | null }> {
    const gameStates = await prisma.gameState.findMany({
      where: { roomId },
      include: { user: { select: { nickname: true } } },
      orderBy: { score: 'desc' },
    });

    const top = gameStates.slice(0, topN).map((gs) => ({
      userId: gs.userId,
      nickname: gs.user.nickname,
      score: gs.score,
    }));

    const myGs = gameStates.find((gs) => gs.userId === userId);
    const me = myGs
      ? { userId: myGs.userId, nickname: myGs.user.nickname, score: myGs.score }
      : null;

    return { top, me };
  }

  /**
   * Starts a timed round in the room.
   * Seeds a GameState for every player currently in the room who doesn't have one.
   * Transitions room status to `active`.
   *
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
    setTimeout(async () => {
      try {
        await this.endRound(roomId);
      } catch (err: any) {
        logger.error(`[Round] Error ending round for room ${roomId}:`, err.message);
      }
    }, ROUND_DURATION_MS);
  }

  /**
   * Ends the current round: broadcasts final leaderboard, transitions back to lobby.
   */
  static async endRound(roomId: string): Promise<void> {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== 'active') return;

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'lobby', roundEndsAt: null },
    });

    // Broadcast final leaderboard
    const gameStates = await prisma.gameState.findMany({
      where: { roomId },
      include: { user: { select: { nickname: true } } },
      orderBy: { score: 'desc' },
    });

    const leaderboard = gameStates.map((gs) => ({
      userId: gs.userId,
      nickname: gs.user.nickname,
      score: gs.score,
    }));

    BroadcastService.broadcast(roomId, 'round_end', { leaderboard });
    BroadcastService.broadcast(null, 'rooms_updated', null);

    logger.info(`[Round] Round ended for room ${roomId}`);
  }

  /**
   * Updates room metadata (name, maxPlayers).
   * Only the room owner may edit the room.
   */
  static async updateRoom(
    roomId: string,
    requestingUserId: string,
    data: { name?: string; maxPlayers?: number | null },
  ) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError('Room not found');
    if (room.ownerId !== requestingUserId) throw new AppError('Only the room owner can edit this room');

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.maxPlayers !== undefined) updateData.maxPlayers = data.maxPlayers;

    if (Object.keys(updateData).length > 0) {
      await prisma.room.update({ where: { id: roomId }, data: updateData });
    }

    return this.getRoomDetails(roomId);
  }

  /**
   * Deletes a room and all associated records (cascade).
   */
  static async deleteRoom(roomId: string, requestingUserId: string): Promise<void> {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError('Room not found');
    if (room.ownerId !== requestingUserId) throw new AppError('Only the room owner can delete this room');

    await prisma.room.delete({ where: { id: roomId } });

    BroadcastService.clearPendingDeltas(roomId);
  }
}
