import { Response } from 'express';
import { logger } from './logger.js';
import { AppError } from './errors.js';

/**
 * Standardised HTTP response helpers for Express controllers.
 *
 * Every response follows the shape `{ success: boolean, message: string, data?: any }`.
 * Operational errors (`AppError`) and client errors (4xx) expose their message to the client.
 * Internal errors (5xx) are masked as "Something went wrong" to avoid leaking implementation details.
 */
export class ApiResponse {
  /**
   * Sends a 200 OK response.
   *
   * @param res - Express response object
   * @param message - Human-readable summary
   * @param data - Optional payload body
   */
  static success(res: Response, message: string, data?: any): void {
    logger.info(`[API Success] ${message}`, { statusCode: 200 });
    res.status(200).json({ success: true, message, data });
  }

  /**
   * Sends a 201 Created response (typically after resource creation).
   */
  static created(res: Response, message: string, data?: any): void {
    logger.info(`[API Created] ${message}`, { statusCode: 201 });
    res.status(201).json({ success: true, message, data });
  }

  /**
   * Sends a generic error response.
   * Masks non-operational errors to prevent internal details from leaking.
   *
   * @param statusCode - HTTP status (default 400)
   */
  static error(res: Response, message: string, error?: any, statusCode = 400): void {
    const isOperational = error && (error.isOperational === true || error instanceof AppError);
    const isClientError = statusCode >= 400 && statusCode < 500;
    const displayMessage = isOperational || isClientError ? message : 'Something went wrong';

    logger.error(`[API Error] ${message}`, {
      statusCode,
      error: error?.stack || error?.message || error || message,
    });

    res.status(statusCode).json({ success: false, message: displayMessage, error: displayMessage });
  }

  static unauthorized(res: Response, message = 'Unauthorized', error?: any): void {
    this.error(res, message, error, 401);
  }
}
