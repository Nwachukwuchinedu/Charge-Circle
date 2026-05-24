import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * HTTP controller for authentication endpoints.
 *
 * Each method delegates to AuthService and formats the result or error
 * into a standardised API response. Controllers are intentionally thin —
 * all business logic lives in the service layer for testability.
 */
export class AuthController {
  /**
   * POST /api/auth/signup
   * Registers a new operator account.
   */
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      const { email, nickname, password } = req.body;
      const result = await AuthService.signup(email, nickname, password);
      ApiResponse.created(res, 'User registered successfully', result);
    } catch (error: any) {
      ApiResponse.error(res, error.message, error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates an existing operator.
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      ApiResponse.success(res, 'Login successful', result);
    } catch (error: any) {
      ApiResponse.unauthorized(res, error.message, error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Exchanges a valid refresh token for a new token pair (rotation).
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshAccessToken(refreshToken);
      ApiResponse.success(res, 'Tokens refreshed', result);
    } catch (error: any) {
      ApiResponse.unauthorized(res, error.message, error);
    }
  }

  /**
   * POST /api/auth/logout
   * Revokes the provided refresh token (single-device logout).
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      await AuthService.revokeRefreshToken(refreshToken);
      ApiResponse.success(res, 'Logged out');
    } catch (error: any) {
      ApiResponse.error(res, error.message, error);
    }
  }

  /**
   * POST /api/auth/logout-all
   * Revokes every active refresh token for the authenticated user.
   * Requires a valid access token (Bearer auth).
   */
  static async logoutAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      await AuthService.revokeAllUserTokens(req.userId!);
      ApiResponse.success(res, 'Logged out of all devices');
    } catch (error: any) {
      ApiResponse.error(res, error.message, error);
    }
  }
}
