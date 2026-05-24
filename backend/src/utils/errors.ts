/**
 * Custom application error class for expected business rule failures.
 *
 * Operational errors represent predictable failures such as
 * "Not your turn", "Invalid credentials", or "Room not found".
 * These are safe to expose to the frontend because they convey
 * meaningful information about the user's action.
 *
 * Non-operational errors (DB timeouts, connection failures, syntax errors)
 * are masked as "Something went wrong" before reaching the client.
 *
 * @example throw new AppError('Not your turn');
 */
export class AppError extends Error {
  public readonly isOperational = true;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
