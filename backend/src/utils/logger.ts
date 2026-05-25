import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Automatically detect environment.
// In local development, we run typescript files directly via tsx (e.g. tsx watch).
// In production/Render, we run the compiled javascript files (node dist/server.js).
const isDevelopment =
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'test' ||
  import.meta.url.endsWith('.ts') ||
  process.argv.some(arg => arg.includes('tsx') || arg.includes('ts') || arg.includes('watch'));

const isProduction = !isDevelopment;

const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ''
  }`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: isProduction ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
];

if (!isProduction) {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    transports.push(
      new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    );
  } catch (err: any) {
    console.warn('[Logger] Failed to initialize file transport, falling back to console:', err.message);
  }
}

/**
 * Application-wide structured logger.
 *
 * - **Production**: `info`-level logs to console (Render captures stdout).
 *   File transport is disabled (no persistent disk on Render free tier).
 * - **Development**: `debug`-level logs to console + rolling files (error.log, combined.log).
 * - Automatically includes stack traces for Error objects.
 */
export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    customFormat,
  ),
  transports,
});

