import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const result = await AuthService.signup(req.body);
      ApiResponse.created(res, 'User registered successfully', result);
    } catch (error: any) {
      ApiResponse.error(res, error.message, error);
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);
      ApiResponse.success(res, 'Login successful', result);
    } catch (error: any) {
      ApiResponse.unauthorized(res, error.message, error);
    }
  }
}
