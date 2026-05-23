import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';

export interface AuthSocket extends Socket {
  userId?: string;
}

export const socketAuthMiddleware = (socket: AuthSocket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Authentication error: Invalid token'));
  }

  socket.userId = decoded.userId;
  next();
};
