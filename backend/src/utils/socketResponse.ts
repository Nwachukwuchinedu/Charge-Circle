import { Server } from 'socket.io';
import { logger } from './logger.js';
import { AuthSocket } from '../socket/auth.socket.js';

export class SocketResponse {
  /**
   * Logs and emits a socket event to a single client socket.
   */
  static emit(socket: AuthSocket, event: string, payload: any) {
    logger.info(`[Socket Emit] [User: ${socket.userId || 'Guest'}] [Event: ${event}]`, {
      userId: socket.userId,
      socketId: socket.id,
      event,
      payload: this.sanitizePayload(payload),
    });
    return socket.emit(event, payload);
  }

  /**
   * Logs and broadcasts an event to a room or to all connected clients.
   * Accepts both a Server instance and BroadcastOperator (like io.to(roomId)).
   */
  static broadcast(io: Server | ReturnType<Server['to']>, roomId: string | null, event: string, payload: any) {
    logger.info(`[Socket Broadcast] [Room: ${roomId || 'Global'}] [Event: ${event}]`, {
      roomId,
      event,
      payload: this.sanitizePayload(payload),
    });
    return io.emit(event, payload);
  }

  /**
   * Logs and invokes an acknowledgement callback.
   */
  static acknowledge(
    socket: AuthSocket,
    callback: ((res: any) => void) | undefined,
    response: { success: boolean; error?: string; [key: string]: any }
  ) {
    const level = response.success ? 'info' : 'error';
    logger.log(level, `[Socket Ack] [User: ${socket.userId || 'Guest'}] [Success: ${response.success}]`, {
      userId: socket.userId,
      socketId: socket.id,
      success: response.success,
      error: response.error,
      response: this.sanitizePayload(response),
    });
    if (callback) {
      callback(response);
    }
  }

  /**
   * Logs and emits a socket error event back to the socket.
   */
  static error(socket: AuthSocket, message: string, event = 'game_error', error?: any) {
    logger.error(`[Socket Error] [User: ${socket.userId || 'Guest'}] [Event: ${event}] ${message}`, {
      userId: socket.userId,
      socketId: socket.id,
      event,
      error: error?.message || error || message,
    });
    return socket.emit(event, { success: false, message, error: error?.message || error });
  }

  /**
   * Sanitizes payloads to keep logs readable and avoid storing massive dataset payloads (e.g. room list).
   */
  private static sanitizePayload(payload: any): any {
    if (!payload) return null;
    
    // Support string/number/boolean payloads
    if (typeof payload !== 'object') return payload;

    // Handle array response
    if (Array.isArray(payload)) {
      return `[Array of ${payload.length} items]`;
    }

    const copy = { ...payload };
    
    // Check specific fields that might hold massive arrays
    if (Array.isArray(copy.rooms)) {
      copy.rooms = `[Array of ${copy.rooms.length} rooms]`;
    }
    if (Array.isArray(copy.users)) {
      copy.users = `[Array of ${copy.users.length} users]`;
    }
    if (copy.room && Array.isArray(copy.room.users)) {
      copy.room = {
        ...copy.room,
        users: `[Array of ${copy.room.users.length} users]`,
      };
    }
    if (copy.state && Array.isArray(copy.state.turnQueue)) {
      copy.state = {
        ...copy.state,
        turnQueue: `[Array of ${copy.state.turnQueue.length} turnQueue]`,
      };
    }

    return copy;
  }
}
