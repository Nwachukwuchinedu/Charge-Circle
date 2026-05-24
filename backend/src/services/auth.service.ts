import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { AuthResult } from '../types/auth.types.js';

const SALT_ROUNDS = 12;

/**
 * Handles user registration and authentication.
 *
 * Passwords are hashed with bcrypt and never stored
 * or returned in plaintext. JWT tokens expire after 7 days.
 *
 * Input sanitization and format validation is handled by the DTO layer.
 * This service enforces business rules only:
 * - Email uniqueness during signup
 * - Credential matching during login
 */
export class AuthService {
  /**
   * Registers a new user account.
   *
   * @param email - Normalized email (already lowercased by DTO)
   * @param nickname - Display name (already trimmed and stripped by DTO)
   * @param password - Plaintext password (already length-checked by DTO)
   * @returns JWT token and user profile (without password hash)
   * @throws AppError if the email is already registered
   */
  static async signup(email: string, nickname: string, password: string): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already exists');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, nickname, passwordHash },
    });

    const token = signToken(user.id, user.nickname);
    logger.info(`[Auth] User registered: ${user.email}`);
    return { token, user: { id: user.id, email: user.email, nickname: user.nickname } };
  }

  /**
   * Authenticates an existing user by email and password.
   *
   * @param email - Normalized email (already lowercased by DTO)
   * @param password - Plaintext password
   * @returns JWT token and user profile
   * @throws AppError if credentials are invalid (same message for both cases
   *   to prevent email enumeration)
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

    const token = signToken(user.id, user.nickname);
    return { token, user: { id: user.id, email: user.email, nickname: user.nickname } };
  }
}
