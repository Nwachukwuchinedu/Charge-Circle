import { Server } from 'socket.io';
import { SocketResponse } from '../utils/socket.response.js';
import { GameStateDelta } from '../types/game.types.js';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { getRoomLeaderboard } from './helpers.js';

/**
 * Throttled broadcast service that batches per-player state updates.
 *
 * Deltas are keyed per player (`roomId:userId`) and flushed at a fixed
 * 50ms interval. This keeps broadcast overhead constant regardless of
 * how many moves are happening simultaneously.
 *
 * Also manages periodic leaderboard broadcasts for active rooms (every 5s).
 *
 * Must be initialised with a Socket.io `Server` instance before use.
 */
export class BroadcastService {
  private static io: Server;
  private static pendingDeltas = new Map<string, GameStateDelta>();
  private static flushInterval: NodeJS.Timeout | null = null;
  private static leaderboardInterval: NodeJS.Timeout | null = null;

  /**
   * Initialises the service with the Socket.io server instance and starts
   * the flush and leaderboard intervals.
   *
   * @param ioInstance - The Socket.io server used for all broadcasts
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
   *
   * @param roomId - The room the player is in
   * @param userId - The player whose state changed
   * @param delta - Partial state fields to send to the client
   */
  static queueDelta(roomId: string, userId: string, delta: Partial<GameStateDelta>): void {
    const key = `${roomId}:${userId}`;
    const existing = this.pendingDeltas.get(key) || {};
    this.pendingDeltas.set(key, { ...existing, ...delta });
  }

  /**
   * Immediately broadcasts an event to all sockets in a room, or globally if roomId is null.
   *
   * @param roomId - Target room, or null for global broadcast
   * @param event - Event name (e.g. `leaderboard_update`, `round_end`)
   * @param payload - Data to send with the event
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
   *
   * @param roomId - The room whose deltas should be cleared
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
   * Called every 50ms by the flush interval.
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
   * Called every 5 seconds by the leaderboard interval.
   * Skips rooms that have no active state (no-op for rooms without active status).
   */
  private static async broadcastAllLeaderboards(): Promise<void> {
    if (!this.io) return;

    const activeRooms = await prisma.room.findMany({
      where: { status: 'active' },
      select: { id: true },
    });

    for (const room of activeRooms) {
      const leaderboard = await getRoomLeaderboard(room.id);
      SocketResponse.broadcast(this.io.to(room.id), room.id, 'leaderboard_update', { leaderboard });
    }
  }
}
