import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charge_circle_key_2026_dev';

/** Shape of the JWT payload embedded in every token. */
export interface TokenPayload {
  userId: string;
  nickname?: string;
}

/**
 * Creates a signed JWT for the given user.
 * The token expires after 7 days.
 *
 * @param userId - Unique identifier for the user
 * @param nickname - Display name embedded in the token for socket middleware
 * @returns Signed JWT string
 */
export function signToken(userId: string, nickname: string): string {
  return jwt.sign({ userId, nickname }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies and decodes a JWT.
 * Returns null (rather than throwing) when the token is invalid or expired,
 * so callers can treat authentication failure as a predictable case.
 *
 * @param token - Raw JWT string from the Authorization header or socket handshake
 * @returns Decoded payload, or null if verification fails
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
