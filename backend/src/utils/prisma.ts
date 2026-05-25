import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

/**
 * Connection strategy for Neon serverless Postgres:
 *
 * - `DATABASE_URL` — the **pooled** connection string (via Neon's built-in PgBouncer).
 *   Add `?pgbouncer=true&connection_limit=20` for production deployments so that
 *   thousands of concurrent app requests are multiplexed over at most 20 database
 *   connections.
 *
 * - `DIRECT_URL` — the **direct** (non-pooled) connection string, used internally by
 *   Prisma for migrations and `prisma.$queryRaw` calls that need a dedicated connection.
 *   Falls back to `DATABASE_URL` when not set.
 */
const connectionString = process.env.DATABASE_URL || '';

const adapter = new PrismaNeon({ connectionString });

/**
 * Singleton Prisma client configured with the Neon serverless adapter.
 *
 * Uses WebSockets for database connections (required by Neon's serverless
 * Postgres) and reads the connection string from `DATABASE_URL` in `.env`.
 */
export const prisma = new PrismaClient({ adapter });

// ── Keepalive ping ─────────────────────────────────────────────────────────
// Neon's serverless Postgres spins down after a few seconds of inactivity.
// This periodic ping keeps the connection warm so that in-game moves don't
// incur a 500ms+ cold-start penalty.

const KEEPALIVE_INTERVAL = 15_000;

let keepaliveHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the database keepalive timer. Should be called once at server startup.
 */
export function startDbKeepalive(): void {
  if (keepaliveHandle) return;

  keepaliveHandle = setInterval(() => {
    prisma.$executeRaw`SELECT 1`.catch(() => {});
  }, KEEPALIVE_INTERVAL);
}

/**
 * Stops the database keepalive timer. Useful for graceful shutdown.
 */
export function stopDbKeepalive(): void {
  if (keepaliveHandle) {
    clearInterval(keepaliveHandle);
    keepaliveHandle = null;
  }
}
