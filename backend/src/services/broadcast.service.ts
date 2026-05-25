import { Server } from 'socket.io';
import { SocketResponse } from '../utils/socketResponse.js';
import { GameStateDelta, LeaderboardEntry } from '../types/game.types.js';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Throttled broadcast service that batches per-player state updates.
 *
 * Deltas are keyed per player (`roomId:userId`) and flushed at a fixed
 * 50ms interval. This keeps broadcast overhead constant regardless of
 * how many moves are happening simultaneously.
 *
 * Also manages periodic leaderboard broadcasts for active rooms.
 */
export class BroadcastService {
  private static io: Server;
  private static pendingDeltas = new Map<string, GameStateDelta>();
  private static flushInterval: NodeJS.Timeout | null = null;
  private static leaderboardInterval: NodeJS.Timeout | null = null;

  /**
   * Initialises the service with the Socket.io server instance and starts
   * the flush and leaderboard intervals.
   */
  static initialize(ioInstance: Server): void {
    this.io = ioInstance;
    if (!this.flushInterval) {
      this.flushInterval = setInterval(() => this.flush(), 50);
    }
    if (!this.leaderboardInterval) {
      this.leaderboardInterval = setInterval(() => this.broadcastAllLeaderboards(), 5000);
    }
  }

  /**
   * Queues a per-player delta update.
   * Key: `roomId:userId` — so each player's state is independent.
   */
  static queueDelta(roomId: string, userId: string, delta: Partial<GameStateDelta>): void {
    const key = `${roomId}:${userId}`;
    const existing = this.pendingDeltas.get(key) || {};
    this.pendingDeltas.set(key, { ...existing, ...delta });
  }

  /**
   * Immediately broadcasts an event to all sockets in a room, or globally.
   */
  static broadcast(roomId: string | null, event: string, payload: any): void {
    if (this.io) {
      const target = roomId ? this.io.to(roomId) : this.io;
      SocketResponse.broadcast(target, roomId, event, payload);
    } else {
      logger.warn(`[BroadcastService] Broadcast before initialisation`);
    }
  }

  /**
   * Removes any pending deltas for a room being deleted.
   */
  static clearPendingDeltas(roomId: string): void {
    for (const key of this.pendingDeltas.keys()) {
      if (key.startsWith(`${roomId}:`)) {
        this.pendingDeltas.delete(key);
      }
    }
  }

  /**
   * Flushes all queued deltas — each delta is sent to the specific player.
   */
  private static flush(): void {
    if (this.pendingDeltas.size === 0) return;

    for (const [key, delta] of this.pendingDeltas.entries()) {
      const [roomId, userId] = key.split(':');
      // Send the delta only to the specific player who made the move
      SocketResponse.broadcast(this.io.to(roomId), roomId, `player_delta:${userId}`, delta);
    }
    this.pendingDeltas.clear();
  }

  /**
   * Periodically broadcasts the leaderboard for all active rooms.
   */
  private static async broadcastAllLeaderboards(): Promise<void> {
    if (!this.io) return;

    const activeRooms = await prisma.room.findMany({
      where: { status: 'active' },
      select: { id: true },
    });

    for (const room of activeRooms) {
      const gameStates = await prisma.gameState.findMany({
        where: { roomId: room.id },
        include: { user: { select: { nickname: true } } },
        orderBy: { score: 'desc' },
      });

      const leaderboard: LeaderboardEntry[] = gameStates.map((gs) => ({
        userId: gs.userId,
        nickname: gs.user.nickname,
        score: gs.score,
      }));

      SocketResponse.broadcast(this.io.to(room.id), room.id, 'leaderboard_update', { leaderboard });
    }
  }
}
