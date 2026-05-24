import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { ApiResponse } from '../utils/apiResponse.js';

/** Express request extended with the authenticated user's ID. */
export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Express middleware that validates a Bearer JWT from the Authorization header.
 *
 * Attaches the decoded `userId` to the request object on success.
 * Responds with 401 if the token is missing, malformed, or expired.
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    ApiResponse.unauthorized(res, 'Authentication required');
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    ApiResponse.unauthorized(res, 'Invalid or expired token');
    return;
  }

  req.userId = decoded.userId;
  next();
};
