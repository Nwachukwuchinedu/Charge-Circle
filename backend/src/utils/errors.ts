/**
 * Custom application error class.
 * Operational errors represent expected business rule/validation failures (e.g. "Not your turn", "Invalid credentials")
 * which are safe to expose to the frontend.
 * Non-operational errors (like DB timeouts, connection failures, syntax errors) are masked as "Something went wrong".
 */
export class AppError extends Error {
  public readonly isOperational = true;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
