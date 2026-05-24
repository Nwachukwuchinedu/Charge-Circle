import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { ActiveUser, PlayerSummary, RoomCacheEntry, RoomWithDetails, RoomListItem, CreatedRoom } from '../types/room.types.js';
import { BroadcastService } from './broadcast.service.js';

/**
 * Manages room lifecycle: creation, joining, player tracking, and stale cleanup.
 *
 * Active players are tracked via `activeUsersMap` for fast lookups during
 * gameplay. The map is kept in sync with the database turn queue.
 * Disconnected players are removed after a 30-second grace period via a periodic sweep.
 */
export class RoomService {
  /** In-memory map of roomId → active users. Not persisted across server restarts. */
  static activeUsersMap = new Map<string, ActiveUser[]>();

  /**
   * Cache of hot room data (boardSize, game state).
   *
   * Eliminates DB round trips for the most frequently accessed fields.
   * Populated on room creation/join and updated after every move.
   * On a multi-instance deployment each server maintains its own cache;
   * a cache miss loads from the database, so correctness is never compromised.
   */
  private static roomCache = new Map<string, RoomCacheEntry>();

  /**
   * Returns the cached entry for a room, or `undefined` on a miss.
   */
  static getRoomCache(roomId: string): RoomCacheEntry | undefined {
    return this.roomCache.get(roomId);
  }

  /**
   * Seeds or updates the room cache. Called after any state-changing operation.
   */
  static setRoomCache(roomId: string, entry: Partial<RoomCacheEntry>): void {
    const existing = this.roomCache.get(roomId) ?? { boardSize: 10, gameState: null };
    this.roomCache.set(roomId, { ...existing, ...entry });
  }

  /**
   * Creates a new room, initialises its game state, seeds the room cache,
   * and registers the owner as the first active player.
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

    const gs = room.gameStates[0];
    this.roomCache.set(room.id, {
      boardSize: room.boardSize,
      gameState: gs
        ? {
            pieceX: gs.pieceX,
            pieceY: gs.pieceY,
            targetX: gs.targetX,
            targetY: gs.targetY,
            score: gs.score,
            turnQueue: (gs.turnQueue as string[]) ?? [],
          }
        : null,
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
    const rooms = await prisma.room.findMany({
      where: { status: { in: ['waiting', 'playing', 'idle'] } },
      include: { owner: { select: { nickname: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return rooms.map((room) => {
      const activeUsers = this.activeUsersMap.get(room.id) || [];
      return {
        ...room,
        players: activeUsers.map((u) => ({
          id: u.id,
          nickname: u.nickname,
          online: u.online,
        })),
      };
    });
  }

  /**
   * Fetches room details including players list, chat messages, and game status.
   */
  static async getRoomDetails(roomId: string): Promise<RoomWithDetails | null> {
    const room = await prisma.room.findUnique({
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

    if (!room) return null;

    const users = this.activeUsersMap.get(roomId) || [];

    return {
      ...room,
      players: users.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        online: u.online,
      })),
    };
  }

  /**
   * Adds a user to a room. Seeds the room cache on first access.
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

    const gs = room.gameStates[0];
    if (!this.roomCache.has(room.id) && gs) {
      this.roomCache.set(room.id, {
        boardSize: room.boardSize,
        gameState: {
          pieceX: gs.pieceX,
          pieceY: gs.pieceY,
          targetX: gs.targetX,
          targetY: gs.targetY,
          score: gs.score,
          turnQueue: (gs.turnQueue as string[]) ?? [],
        },
      });
    }

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

    // Determine the new status based on player count
    let newStatus = room.status;
    if (updatedQueue.length === 0) {
      newStatus = 'idle';
    } else if (updatedQueue.length === 1) {
      newStatus = 'waiting';
    } else {
      newStatus = 'playing';
    }

    if (newStatus !== room.status) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: newStatus },
      });
    }

    // Ensure room cache is fully updated with the new turnQueue
    this.roomCache.set(roomId, {
      boardSize: room.boardSize,
      gameState: {
        pieceX: gameState.pieceX,
        pieceY: gameState.pieceY,
        targetX: gameState.targetX,
        targetY: gameState.targetY,
        score: gameState.score,
        turnQueue: updatedQueue,
      },
    });

    return this.getRoomDetails(roomId);
  }

  /**
   * Removes a user from the room's active users list and turn queue.
   */
  static async leaveRoom(roomId: string, userId: string): Promise<void> {
    const users = this.activeUsersMap.get(roomId);
    if (users) {
      const idx = users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        users.splice(idx, 1);
      }
    }

    try {
      const gs = await prisma.gameState.findUnique({ where: { roomId } });
      if (gs) {
        const queue = (gs.turnQueue as string[]) ?? [];
        const filtered = queue.filter((u) => u !== userId);
        if (filtered.length !== queue.length) {
          const updated = await prisma.gameState.update({
            where: { roomId },
            data: { turnQueue: filtered },
          });

          // Sync cache
          const cached = this.roomCache.get(roomId);
          this.roomCache.set(roomId, {
            boardSize: cached?.boardSize ?? 10,
            gameState: {
              pieceX: updated.pieceX,
              pieceY: updated.pieceY,
              targetX: updated.targetX,
              targetY: updated.targetY,
              score: updated.score,
              turnQueue: filtered,
            },
          });

          // Determine and update room status
          const roomRecord = await prisma.room.findUnique({
            where: { id: roomId },
            select: { status: true },
          });
          if (roomRecord) {
            let newStatus = roomRecord.status;
            if (filtered.length === 0) {
              newStatus = 'idle';
            } else if (filtered.length === 1) {
              newStatus = 'waiting';
            } else {
              newStatus = 'playing';
            }

            if (newStatus !== roomRecord.status) {
              await prisma.room.update({
                where: { id: roomId },
                data: { status: newStatus },
              });
            }
          }

          // Broadcast delta because turnQueue changed!
          BroadcastService.queueDelta(roomId, {
            turnQueue: filtered,
            activePlayer: filtered[0] || '',
          });
        }
      }
    } catch (e: any) {
      logger.error('[LeaveRoom] Error removing user from turnQueue:', {
        userId,
        roomId,
        error: e.message,
      });
    }
  }

  /**
   * Updates room metadata (name, maxPlayers).
   * Only the room owner may edit the room.
   *
   * @returns The updated room details
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

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.maxPlayers !== undefined) updateData.maxPlayers = data.maxPlayers;

    if (Object.keys(updateData).length > 0) {
      await prisma.room.update({ where: { id: roomId }, data: updateData });
      // Invalidate cache so next read hits DB
      this.roomCache.delete(roomId);
    }

    return this.getRoomDetails(roomId);
  }

  /**
   * Deletes a room and all associated records (game state, chat messages, move history).
   * Only the room owner may delete the room.
   *
   * Cleans up in-memory caches (roomCache, activeUsersMap) and clears pending
   * broadcast deltas so stale state is never emitted.
   *
   * @throws AppError if the room is not found or the requester is not the owner
   */
  static async deleteRoom(roomId: string, requestingUserId: string): Promise<void> {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError('Room not found');
    if (room.ownerId !== requestingUserId) throw new AppError('Only the room owner can delete this room');

    await prisma.room.delete({ where: { id: roomId } });

    // Clean up in-memory state
    this.roomCache.delete(roomId);
    this.activeUsersMap.delete(roomId);
    BroadcastService.clearPendingDeltas(roomId);
  }

  /**
   * Marks a user as disconnected in the active-users map.
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
   * Scans all rooms in the database and heals their statuses/turnQueues
   * to be consistent with current active user map states.
   */
  static async healRoomStatuses(): Promise<void> {
    try {
      const activeDbRooms = await prisma.room.findMany({
        where: { status: { in: ['waiting', 'playing'] } },
        include: { gameStates: true }
      });

      for (const room of activeDbRooms) {
        const activeUsers = this.activeUsersMap.get(room.id) || [];
        const onlineCount = activeUsers.filter(u => u.online).length;
        
        let targetStatus = room.status;
        if (onlineCount === 0) {
          targetStatus = 'idle';
        } else if (onlineCount === 1) {
          targetStatus = 'waiting';
        } else {
          targetStatus = 'playing';
        }

        if (targetStatus !== room.status) {
          logger.info(`[Healer] Healing room "${room.name}" (${room.id}) status from ${room.status} to ${targetStatus}`);
          await prisma.room.update({
            where: { id: room.id },
            data: { status: targetStatus }
          });
          
          const gs = room.gameStates[0];
          if (gs && (gs.turnQueue as string[]).length > 0 && onlineCount === 0) {
            await prisma.gameState.update({
              where: { roomId: room.id },
              data: { turnQueue: [] }
            });
            // Sync cache
            const cached = this.roomCache.get(room.id);
            this.roomCache.set(room.id, {
              boardSize: cached?.boardSize ?? 10,
              gameState: {
                pieceX: gs.pieceX,
                pieceY: gs.pieceY,
                targetX: gs.targetX,
                targetY: gs.targetY,
                score: gs.score,
                turnQueue: [],
              }
            });
          }
        }
      }
    } catch (err: any) {
      logger.error('[Healer] Error during room status healing:', err.message);
    }
  }

  /**
   * Starts the periodic cleanup sweep that removes stale disconnected users.
   * Should be called once at server startup.
   */
  static startCleanupSweep(gracePeriodMs = 30_000): void {
    // Run initial self-healing check on boot
    this.healRoomStatuses().then(() => {
      // Trigger a global rooms list update just in case any room got healed on startup
      BroadcastService.broadcast(null, 'rooms_updated', null);
    }).catch((err) => logger.error('[Healer Startup] Failed to run startup status healer:', err));

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
                  const updated = await prisma.gameState.update({
                    where: { roomId },
                    data: { turnQueue: filtered },
                  });
                  // Update cache too!
                  const cached = this.roomCache.get(roomId);
                  this.roomCache.set(roomId, {
                    boardSize: cached?.boardSize ?? 10,
                    gameState: {
                      pieceX: updated.pieceX,
                      pieceY: updated.pieceY,
                      targetX: updated.targetX,
                      targetY: updated.targetY,
                      score: updated.score,
                      turnQueue: filtered,
                    },
                  });

                  // Determine and update room status
                  const roomRecord = await prisma.room.findUnique({
                    where: { id: roomId },
                    select: { status: true },
                  });
                  if (roomRecord) {
                    let newStatus = roomRecord.status;
                    if (filtered.length === 0) {
                      newStatus = 'idle';
                    } else if (filtered.length === 1) {
                      newStatus = 'waiting';
                    } else {
                      newStatus = 'playing';
                    }

                    if (newStatus !== roomRecord.status) {
                      await prisma.room.update({
                        where: { id: roomId },
                        data: { status: newStatus },
                      });
                    }
                  }

                  // Broadcast delta update because turnQueue changed!
                  BroadcastService.queueDelta(roomId, {
                    turnQueue: filtered,
                    activePlayer: filtered[0] || '',
                  });
                }
              }
            } catch (e: any) {
              logger.error('[Sweep] Error removing disconnected user:', {
                userId: user.id,
                roomId,
                error: e.message,
              });
            }
          }
        }

        if (changed) {
          try {
            const details = await RoomService.getRoomDetails(roomId);
            if (details) {
              BroadcastService.broadcast(roomId, 'room_state_update', details);
            }
          } catch (err: any) {
            logger.error('[Sweep Broadcast] Failed to broadcast room state update:', err.message);
          }
        }
      }

      // Run self-healing check on every sweep interval
      await this.healRoomStatuses();
      // Broadcast global update in case statuses changed
      BroadcastService.broadcast(null, 'rooms_updated', null);
    }, 30_000);
  }
}
