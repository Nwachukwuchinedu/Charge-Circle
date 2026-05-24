import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

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
      const result = await AuthService.signup(req.body as any);
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
      const result = await AuthService.login(req.body as any);
      ApiResponse.success(res, 'Login successful', result);
    } catch (error: any) {
      ApiResponse.unauthorized(res, error.message, error);
    }
  }
}
