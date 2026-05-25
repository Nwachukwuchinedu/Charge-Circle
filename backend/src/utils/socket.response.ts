import { Server } from 'socket.io';
import { logger } from './logger.js';
import { AuthSocket } from '../socket/auth.socket.js';
import { AppError } from './errors.js';

type BroadcastTarget = Server | ReturnType<Server['to']>;

/**
 * Standardised Socket.io response helpers.
 *
 * Provides consistent logging, error masking, and payload sanitisation
 * for all server-to-client socket events.
 */
export class SocketResponse {
  /**
   * Emits an event directly to a single authenticated socket.
   */
  static emit(socket: AuthSocket, event: string, payload: any): void {
    logger.info(`[Socket Emit] [User: ${socket.userId || 'Guest'}] [Event: ${event}]`, {
      userId: socket.userId,
      socketId: socket.id,
      event,
      payload: sanitise(payload),
    });
    socket.emit(event, payload);
  }

  /**
   * Broadcasts an event to every connected client.
   * When `io` is scoped via `.to(roomId)`, only members of that room receive the event.
   *
   * @param io - Server instance or scoped broadcaster (e.g. `io.to('room_1')`)
   * @param roomId - Room identifier for logging; may be null for global broadcasts
   * @param event - Event name
   * @param payload - Data to send
   */
  static broadcast(io: BroadcastTarget, roomId: string | null, event: string, payload: any): void {
    logger.info(`[Socket Broadcast] [Room: ${roomId || 'Global'}] [Event: ${event}]`, {
      roomId,
      event,
      payload: sanitise(payload),
    });
    io.emit(event, payload);
  }

  /**
   * Sends an acknowledgement callback response.
   * Masks non-operational errors to prevent internal details from leaking to the client.
   *
   * @param socket - The requesting socket (used for logging)
   * @param callback - The client-provided acknowledgement function
   * @param response - Payload; `errorObj` is stripped before sending to the client
   */
  static acknowledge(
    socket: AuthSocket,
    callback: ((res: any) => void) | undefined,
    response: { success: boolean; error?: string; errorObj?: any; [key: string]: any },
  ): void {
    const level = response.success ? 'info' : 'error';

    let displayError: string | undefined = response.error;
    if (!response.success && response.error) {
      const isOperational =
        response.errorObj &&
        (response.errorObj.isOperational === true || response.errorObj instanceof AppError);
      if (!isOperational) {
        displayError = 'Something went wrong';
      }
    }

    logger.log(level, `[Socket Ack] [User: ${socket.userId || 'Guest'}] [Success: ${response.success}]`, {
      userId: socket.userId,
      socketId: socket.id,
      success: response.success,
      error: response.error,
      response: sanitise(response),
    });

    if (callback) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
const { errorObj, ...clientResponse } = response;
      if (!clientResponse.success) {
        clientResponse.error = displayError;
      }
      callback(clientResponse);
    }
  }

  /**
   * Emits an error event back to a single socket.
   * Non-operational errors are masked to avoid leaking internals.
   *
   * @param socket - The target socket
   * @param message - Error description
   * @param event - Socket event name (default: `game_error`)
   * @param error - Optional error object for stack trace logging
   */
  static error(socket: AuthSocket, message: string, event = 'game_error', error?: any): void {
    const isOperational =
      error && (error.isOperational === true || error instanceof AppError);
    const displayMessage = isOperational ? message : 'Something went wrong';

    logger.error(`[Socket Error] [User: ${socket.userId || 'Guest'}] [Event: ${event}] ${message}`, {
      userId: socket.userId,
      socketId: socket.id,
      event,
      error: error?.stack || error?.message || error || message,
    });

    socket.emit(event, { success: false, message: displayMessage, error: displayMessage });
  }
}

/**
 * Truncates large arrays in payloads before logging to keep log output readable.
 */
function sanitise(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return `[Array of ${payload.length} items]`;

  const copy = { ...payload };

  if (Array.isArray(copy.rooms)) copy.rooms = `[Array of ${copy.rooms.length} rooms]`;
  if (Array.isArray(copy.users)) copy.users = `[Array of ${copy.users.length} users]`;
  if (Array.isArray(copy.players)) copy.players = `[Array of ${copy.players.length} players]`;

  return copy;
}
