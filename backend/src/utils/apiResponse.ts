import { Response } from 'express';
import { logger } from './logger.js';
import { AppError } from './errors.js';

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
    const isOperational = error && (error.isOperational === true || error instanceof AppError);
    const isClientError = statusCode >= 400 && statusCode < 500;
    const displayMessage = (isOperational || isClientError) ? message : 'Something went wrong';

    logger.error(`[API Error] ${message}`, { 
      statusCode, 
      error: error?.stack || error?.message || error || message 
    });

    return res.status(statusCode).json({
      success: false,
      message: displayMessage,
      error: displayMessage
    });
  }

  static unauthorized(res: Response, message = 'Unauthorized', error?: any) {
    return this.error(res, message, error, 401);
  }

  static forbidden(res: Response, message = 'Forbidden', error?: any) {
    return this.error(res, message, error, 403);
  }

  static notFound(res: Response, message = 'Resource not found', error?: any) {
    return this.error(res, message, error, 404);
  }

  static internalError(res: Response, error: any, message = 'Internal Server Error') {
    return this.error(res, message, error, 500);
  }
}
