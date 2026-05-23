import { Response } from 'express';
import { logger } from './logger.js';

export class ApiResponse {
  static success(res: Response, message: string, data?: any, statusCode = 200) {
    logger.info(`[API Success] ${message}`, { statusCode });
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static created(res: Response, message: string, data?: any) {
    return this.success(res, message, data, 201);
  }

  static error(res: Response, message: string, error?: any, statusCode = 400) {
    logger.error(`[API Error] ${message}`, { statusCode, error });
    return res.status(statusCode).json({
      success: false,
      message,
      error
    });
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return this.error(res, message, null, 401);
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return this.error(res, message, null, 403);
  }

  static notFound(res: Response, message = 'Resource not found') {
    return this.error(res, message, null, 404);
  }

  static internalError(res: Response, error: any, message = 'Internal Server Error') {
    return this.error(res, message, error?.message || error, 500);
  }
}
