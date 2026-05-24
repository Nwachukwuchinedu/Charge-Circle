import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';
import { ActiveUser, PlayerSummary } from '../types/room.types.js';
import { Prisma } from '@prisma/client';

/** Full room payload returned to clients after a join, including players and chat. */
type RoomWithDetails = Prisma.RoomGetPayload<{
  include: {
    gameStates: true;
    owner: { select: { nickname: true } };
    chatMessages: { include: { user: { select: { nickname: true } } }; take: number; orderBy: { createdAt: 'asc' } };
  };
}> & { players: PlayerSummary[] };

/** Room shape returned to the room list. */
type RoomListItem = Prisma.RoomGetPayload<{
  include: { owner: { select: { nickname: true } } };
}>;

/** Created room with game state and players. */
type CreatedRoom = Prisma.RoomGetPayload<{
  include: { gameStates: true };
}> & { players: PlayerSummary[] };

/**
 * Manages room lifecycle: creation, joining, player tracking, and stale cleanup.
 *
 * Active players are tracked in-memory (via `activeUsersMap`) for fast lookups
 * during gameplay. The map is kept in sync with the database turn queue.
 * Disconnected players are removed after a 30-second grace period via a periodic sweep.
 */
export class RoomService {
  /** In-memory map of roomId → active users. Not persisted across server restarts. */
  static activeUsersMap = new Map<string, ActiveUser[]>();

  /**
   * Creates a new room, initialises its game state, and registers the owner
   * as the first active player.
   *
   * @param ownerId - User ID of the room creator
   * @param name - Room display name
   * @param maxPlayers - Optional player limit; null means unlimited
   * @returns The created room with its game state and initial player list
   */
  static async createRoom(ownerId: string, name: string, maxPlayers: number | null = null): Promise<CreatedRoom> {
    const dbUser = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { nickname: true },
    });
    const nickname = dbUser?.nickname || 'Player';

    const room = await prisma.room.create({
      data: {
        name,
        ownerId,
        maxPlayers,
        status: 'waiting',
        boardSize: 10,
        gameStates: {
          create: {
            pieceX: 4,
            pieceY: 4,
            targetX: 2,
            targetY: 7,
            score: 0,
            turnQueue: [ownerId],
          },
        },
      },
      include: { gameStates: true },
    });

    this.activeUsersMap.set(room.id, [{ id: ownerId, nickname, online: true }]);

    return {
      ...room,
      players: [{ id: ownerId, nickname, online: true }] as PlayerSummary[],
    };
  }

  /**
   * Returns all rooms that are currently waiting or in play,
   * ordered by most recently created first.
   */
  static async getRooms(): Promise<RoomListItem[]> {
    return prisma.room.findMany({
      where: { status: { in: ['waiting', 'playing'] } },
      include: { owner: { select: { nickname: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Adds a user to a room. If the room is at capacity (maxPlayers), rejects the join.
   * Starts the game (status → playing) when the second player joins.
   *
   * @param roomId - Target room
   * @param userId - Joining user
   * @returns Full room state including game state, players, and recent chat messages
   * @throws AppError if the room is full, finished, or not found
   */
  static async joinRoom(roomId: string, userId: string): Promise<RoomWithDetails | null> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { gameStates: true },
    });

    if (!room) throw new AppError('Room not found');
    if (room.status === 'finished') throw new AppError('Game already finished');

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true },
    });
    const nickname = dbUser?.nickname || 'Player';

    if (!this.activeUsersMap.has(roomId)) {
      this.activeUsersMap.set(roomId, []);
    }
    const users = this.activeUsersMap.get(roomId)!;

    const existing = users.find((u) => u.id === userId);
    if (existing) {
      existing.online = true;
      existing.nickname = nickname;
      existing.disconnectedAt = undefined;
    } else {
      if (room.maxPlayers !== null && users.length >= room.maxPlayers) {
        throw new AppError('Room is full');
      }
      users.push({ id: userId, nickname, online: true });
    }

    const gameState = room.gameStates[0];
    if (!gameState) throw new AppError('Game state corrupted');

    const queue = (gameState.turnQueue as string[]) || [];
    let updatedQueue = [...queue];

    if (!queue.includes(userId)) {
      updatedQueue.push(userId);
      await prisma.gameState.update({
        where: { roomId },
        data: { turnQueue: updatedQueue },
      });
    }

    if (updatedQueue.length > 1 && room.status === 'waiting') {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'playing' },
      });
    }

    const updatedRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        gameStates: true,
        owner: { select: { nickname: true } },
        chatMessages: {
          include: { user: { select: { nickname: true } } },
          take: 50,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!updatedRoom) return null;

    return {
      ...updatedRoom,
      players: users.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        online: u.online,
      })),
    };
  }

  /**
   * Marks a user as disconnected in the in-memory map.
   * The user will be removed from the room after the 30-second grace period
   * by the periodic cleanup sweep.
   */
  static markUserDisconnected(roomId: string, userId: string): void {
    const users = this.activeUsersMap.get(roomId);
    if (!users) return;
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.online = false;
      user.disconnectedAt = Date.now();
    }
  }

  /**
   * Starts the periodic cleanup sweep that removes stale disconnected users.
   * Should be called once at server startup.
   *
   * Users who have been disconnected for longer than `gracePeriodMs` are
   * removed from the in-memory map and the database turn queue.
   */
  static startCleanupSweep(gracePeriodMs = 30_000): void {
    setInterval(async () => {
      const now = Date.now();
      for (const [roomId, users] of this.activeUsersMap.entries()) {
        let changed = false;
        for (let i = users.length - 1; i >= 0; i--) {
          const user = users[i];
          if (!user.online && user.disconnectedAt && now - user.disconnectedAt > gracePeriodMs) {
            users.splice(i, 1);
            changed = true;

            try {
              const gs = await prisma.gameState.findUnique({ where: { roomId } });
              if (gs) {
                const queue = (gs.turnQueue as string[]) ?? [];
                const filtered = queue.filter((u) => u !== user.id);
                if (filtered.length !== queue.length) {
                  await prisma.gameState.update({
                    where: { roomId },
                    data: { turnQueue: filtered },
                  });
                }
              }
            } catch (e) {
              console.error('[Sweep] Error removing disconnected user from DB queue', e);
            }
          }
        }
      }
    }, 30_000);
  }
}
