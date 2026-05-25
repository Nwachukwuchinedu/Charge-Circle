import 'dotenv/config';
import { logger } from '../utils/logger.js';

function requireEnv(name: string, hint?: string): string {
  const value = process.env[name];
  if (!value) {
    logger.error(`[env] MISSING REQUIRED ENV: ${name}${hint ? ` — ${hint}` : ''}`);
    process.exit(1);
  }
  return value;
}

function validateEnv(): void {
  requireEnv('DATABASE_URL', 'Set in .env or Render Dashboard');
  requireEnv('DIRECT_URL', 'Set in .env or Render Dashboard');
  requireEnv('REDIS_URL', 'rediss://default:<token>@<host>.upstash.io:6379');

  const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!accessSecret) {
    logger.error('[env] MISSING REQUIRED ENV: JWT_ACCESS_SECRET (or JWT_SECRET as fallback)');
    process.exit(1);
  }

  logger.info('[env] All required variables present');
}

validateEnv();

export const env = {
  get DATABASE_URL(): string { return process.env.DATABASE_URL!; },
  get DIRECT_URL(): string { return process.env.DIRECT_URL!; },
  get JWT_ACCESS_SECRET(): string { return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET!; },
  get REDIS_URL(): string { return process.env.REDIS_URL!; },
  get PORT(): string { return process.env.PORT || '4000'; },
} as const;

export function getJwtSecret(): string {
  return env.JWT_ACCESS_SECRET;
}
