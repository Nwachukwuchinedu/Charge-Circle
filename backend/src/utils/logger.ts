import winston from 'winston';
import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ''
  }`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: isProduction ? 'warn' : 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
];

if (!isProduction) {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  transports.push(
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
  );
}

/**
 * Application-wide structured logger.
 *
 * - **Production**: only `error`-level logs to console (Render captures stdout).
 *   File transport is disabled (no persistent disk on Render free tier).
 * - **Development**: `debug`-level logs to console + rolling files (error.log, combined.log).
 * - Automatically includes stack traces for Error objects.
 */
export const logger = winston.createLogger({
  level: isProduction ? 'error' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    customFormat,
  ),
  transports,
});
