import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charge_circle_key_2026_dev';

export function signToken(userId: string, nickname: string): string {
  return jwt.sign({ userId, nickname }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; nickname?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; nickname?: string };
  } catch (error) {
    return null;
  }
}
