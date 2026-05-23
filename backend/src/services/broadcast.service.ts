import { Server } from 'socket.io';
import { SocketResponse } from '../utils/socketResponse.js';

export interface GameStateDelta {
  piece?: { x: number; y: number };
  activePlayer?: string;
  score?: number;
  lastMove?: { userId: string; from: { x: number, y: number }; to: { x: number, y: number } };
  gridCharged?: boolean;
}

export class BroadcastService {
  private static io: Server;
  private static pendingDeltas = new Map<string, GameStateDelta>();
  private static interval: NodeJS.Timeout | null = null;

  static initialize(ioInstance: Server) {
    this.io = ioInstance;
    if (!this.interval) {
      this.interval = setInterval(() => this.flush(), 100);
    }
  }

  static queueDelta(roomId: string, delta: Partial<GameStateDelta>) {
    const existing = this.pendingDeltas.get(roomId) || {};
    this.pendingDeltas.set(roomId, { ...existing, ...delta });
  }

  private static flush() {
    if (this.pendingDeltas.size === 0) return;
    
    for (const [roomId, delta] of this.pendingDeltas.entries()) {
      SocketResponse.broadcast(this.io.to(roomId), roomId, 'game_state_delta', delta);
    }
    this.pendingDeltas.clear();
  }
}
