import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TokenPayload } from '../types/auth.types.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

/**
 * Signs a short-lived access JWT (15 minutes).
 *
 * Used for API authentication (`Authorization: Bearer <token>`)
 * and Socket.io handshake. Short expiry minimises the window for
 * token theft; clients refresh via the long-lived refresh token.
 */
export function signAccessToken(userId: string, nickname: string): string {
  return jwt.sign({ userId, nickname }, ACCESS_SECRET, { expiresIn: '15m' });
}

/**
 * Verifies and decodes an access JWT.
 * Returns null (rather than throwing) on expiry or invalid signature.
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Generates a cryptographically random opaque refresh token.
 *
 * These are stored hashed in the database (SHA-256) so a database
 * breach does not expose active tokens. Each token is 40 bytes of
 * randomness (80 hex chars), making brute-force infeasible.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}
