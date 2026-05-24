import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';

/** Shape returned by signup and login operations. */
export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    nickname: string;
  };
}

/**
 * Handles user registration and authentication.
 *
 * Passwords are hashed with bcrypt (cost factor 10) and never stored
 * or returned in plaintext. JWT tokens expire after 7 days.
 */
export class AuthService {
  /**
   * Registers a new user account.
   *
   * @param email - User's email address (must be unique)
   * @param nickname - Display name shown in-game
   * @param password - Plaintext password (hashed before storage)
   * @returns JWT token and user profile (without password hash)
   * @throws AppError if the email is already registered
   */
  static async signup(email: string, nickname: string, password: string): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, nickname, passwordHash },
    });

    const token = signToken(user.id, user.nickname);
    return { token, user: { id: user.id, email: user.email, nickname: user.nickname } };
  }

  /**
   * Authenticates an existing user by email and password.
   *
   * @param email - User's email address
   * @param password - Plaintext password
   * @returns JWT token and user profile
   * @throws AppError if credentials are invalid (same message for both cases
   *   to prevent email enumeration)
   */
  static async login(email: string, password: string): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials');

    const token = signToken(user.id, user.nickname);
    return { token, user: { id: user.id, email: user.email, nickname: user.nickname } };
  }
}
