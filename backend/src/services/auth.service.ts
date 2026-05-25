import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import { signAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { AuthResult } from '../types/auth.types.js';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_DAYS = 7;

/**
 * Hashes a raw refresh token with SHA-256 for DB storage.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Handles user registration, authentication, and token lifecycle.
 *
 * **Access tokens** are short-lived JWTs (15 minutes) used for API and
 * Socket.io authentication. They are stateless — no DB lookup on verify.
 *
 * **Refresh tokens** are opaque 40-byte random strings stored as SHA-256
 * hashes in the database. They enable token rotation (old token revoked on
 * each refresh) and per-device revocation.
 *
 * Input sanitization and format validation is handled by the DTO layer.
 * This service enforces business rules only.
 */
export class AuthService {
  /**
   * Registers a new user account and issues an access + refresh token pair.
   *
   * @param email - User's email address (already normalized by DTO)
   * @param nickname - Display name (already sanitised by DTO)
   * @param password - Plain-text password (already validated for length by DTO)
   * @returns Access + refresh token pair and user info
   * @throws AppError if the email is already registered
   */
  static async signup(email: string, nickname: string, password: string): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already exists');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, nickname, passwordHash },
    });

    const accessToken = signAccessToken(user.id, user.nickname);
    const refreshToken = await this.createRefreshToken(user.id);

    logger.info(`[Auth] User registered: ${user.email}`);
    return { accessToken, refreshToken, user: await this.getUserData(user.id) };
  }

  /**
   * Authenticates an existing user and issues a new token pair.
   *
   * Uses the same error message for both "user not found" and "wrong password"
   * to prevent email enumeration attacks.
   *
   * @param email - User's email address
   * @param password - Plain-text password
   * @returns Access + refresh token pair and user info
   * @throws AppError if credentials are invalid
   */
  static async login(email: string, password: string): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn(`[Auth] Failed login attempt for: ${email}`);
      throw new AppError('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      logger.warn(`[Auth] Failed login attempt for: ${email}`);
      throw new AppError('Invalid credentials');
    }

    const accessToken = signAccessToken(user.id, user.nickname);
    const refreshToken = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken, user: await this.getUserData(user.id) };
  }

  /**
   * Exchanges a valid refresh token for a new access + refresh token pair.
   *
   * Implements **token rotation**: the old refresh token is revoked and a new
   * one is issued. If a compromised refresh token is presented after being
   * used by the legitimate client, it will already be revoked and the request
   * will fail — limiting the window for token theft.
   *
   * @param rawToken - The opaque refresh token string from the client
   * @returns A new access + refresh token pair and user info
   * @throws AppError if the token is invalid, expired, or already revoked
   */
  static async refreshAccessToken(rawToken: string): Promise<AuthResult> {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new AppError('User not found');

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = signAccessToken(user.id, user.nickname);
    const refreshToken = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken, user: await this.getUserData(user.id) };
  }

  /**
   * Revokes a single refresh token (logout from one device).
   *
   * @param rawToken - The opaque refresh token string to revoke
   */
  static async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes every active refresh token for a user (logout from all devices).
   *
   * @param userId - The user whose tokens should be revoked
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Creates and persists a new opaque refresh token.
   * The raw token is returned to the caller; only the SHA-256 hash is stored.
   *
   * @param userId - The user this token belongs to
   * @returns The raw (unhashed) refresh token string
   */
  private static async createRefreshToken(userId: string): Promise<string> {
    const raw = generateRefreshToken();
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { tokenHash, userId, expiresAt },
    });

    return raw;
  }

  /**
   * Builds the user payload for auth responses, including total cumulative score.
   *
   * @param userId - The user to fetch data for
   * @returns User object with id, email, nickname, and totalScore
   */
  static async getUserData(userId: string): Promise<AuthResult['user']> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nickname: true, totalScore: true },
    });

    if (!user) throw new AppError('User not found');

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      totalScore: user.totalScore,
    };
  }
}
