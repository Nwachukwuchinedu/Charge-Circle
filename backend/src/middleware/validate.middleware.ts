import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Express middleware factory that validates the request body against a Zod schema.
 *
 * Returns a 400 response with structured validation errors if validation fails.
 * Otherwise calls `next()` with the validated (and potentially transformed) body.
 *
 * @param schema - A Zod schema (e.g. `SignupDto`, `LoginDto`)
 *
 * @example
 * router.post('/signup', validate(SignupDto), AuthController.signup);
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => issue.message).join('. ');
        ApiResponse.error(res, errorMessages, error.issues, 400);
      } else {
        ApiResponse.error(res, 'Validation error', error, 400);
      }
    }
  };
};
