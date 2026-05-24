import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { TokenPayload } from '../types/auth.types.js';

/**
 * Authenticated Socket.io socket that carries the user's identity
 * obtained from the JWT in the connection handshake.
 */
export interface AuthSocket extends Socket {
  userId?: string;
  nickname?: string;
}

/**
 * Socket.io middleware that authenticates every incoming connection.
 *
 * Reads the JWT from `socket.handshake.auth.token`, verifies it,
 * and attaches `userId` and `nickname` to the socket instance.
 *
 * Connections without a valid JWT are rejected with an error.
 */
export const socketAuthMiddleware = (socket: AuthSocket, next: (err?: Error) => void): void => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  const decoded: TokenPayload | null = verifyToken(token);
  if (!decoded) {
    return next(new Error('Authentication error: Invalid token'));
  }

  socket.userId = decoded.userId;
  socket.nickname = decoded.nickname || 'Player';
  next();
};
