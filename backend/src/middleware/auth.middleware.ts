import { Request } from 'express';
import { verifyToken } from '../utils/jwt.js';

/** Express request extended with the authenticated user's ID. */
export interface AuthRequest extends Request {
  userId?: string;
}
