import { Server } from 'socket.io';
import { SocketResponse } from '../utils/socketResponse.js';
import { GameStateDelta } from '../types/game.types.js';
import { logger } from '../utils/logger.js';

/**
 * Throttled broadcast service that batches state updates per room.
 *
 * Instead of emitting a Socket.io event on every single move, deltas are
 * queued in a Map and flushed at a fixed 50ms interval. This reduces
 * broadcast overhead from O(moves/second) to a constant 20 broadcasts/second,
 * which is critical when scaling to thousands of concurrent players.
 */
export class BroadcastService {
  private static io: Server;
  private static pendingDeltas = new Map<string, GameStateDelta>();
  private static interval: NodeJS.Timeout | null = null;

  /**
   * Initialises the service with the Socket.io server instance and starts
   * the flush interval. Should be called once at server startup.
   */
  static initialize(ioInstance: Server): void {
    this.io = ioInstance;
    if (!this.interval) {
      this.interval = setInterval(() => this.flush(), 50);
    }
  }

  /**
   * Queues a delta update for the given room.
   * Subsequent calls within the same tick merge into a single payload.
   *
   * @param roomId - Target room identifier
   * @param delta - Partial state delta to merge
   */
  static queueDelta(roomId: string, delta: Partial<GameStateDelta>): void {
    const existing = this.pendingDeltas.get(roomId) || {};
    this.pendingDeltas.set(roomId, { ...existing, ...delta });
  }

  /**
   * Immediately broadcasts an event to all sockets in a room, or globally if roomId is null/empty.
   */
  static broadcast(roomId: string | null, event: string, payload: any): void {
    if (this.io) {
      const target = roomId ? this.io.to(roomId) : this.io;
      SocketResponse.broadcast(target, roomId, event, payload);
    } else {
      logger.warn(`[BroadcastService] Attempted to broadcast to room ${roomId || 'Global'} before initialisation`);
    }
  }

  /**
   * Flushes all queued deltas by broadcasting each room's latest delta.
   * Called automatically every 50ms by the interval timer.
   */
  private static flush(): void {
    if (this.pendingDeltas.size === 0) return;

    for (const [roomId, delta] of this.pendingDeltas.entries()) {
      SocketResponse.broadcast(this.io.to(roomId), roomId, 'game_state_delta', delta);
    }
    this.pendingDeltas.clear();
  }
}
