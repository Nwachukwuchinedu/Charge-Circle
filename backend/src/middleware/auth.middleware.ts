import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

/** Express request extended with the authenticated user's ID. */
export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Express middleware that validates a Bearer JWT from the Authorization header.
 *
 * Attaches the decoded `userId` to the request object on success.
 * Responds with 401 and a descriptive error if the token is missing or invalid.
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }

  req.userId = decoded.userId;
  next();
};
