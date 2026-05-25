import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server } from 'socket.io';
import { logger } from './logger.js';

/**
 * Attaches a Redis pub/sub adapter to the Socket.io server using
 * Upstash Redis (or any TCP-compatible Redis).
 *
 * Reads `REDIS_URL` from the environment — must be a `rediss://` or
 * `redis://` URL.  The `rediss://` scheme (TLS) is required for
 * Upstash; non-TLS URLs are used for local development.
 *
 * Throws if `REDIS_URL` is missing or the connection fails — the
 * server **will not start** without Redis.
 */
export let pubClient: ReturnType<typeof createClient> | null = null;
export let subClient: ReturnType<typeof createClient> | null = null;

export const setupRedis = async (io: Server): Promise<void> => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error(
      'REDIS_URL is required. ' +
      'Set it in .env (local) or Render Dashboard (production). ' +
      'Example: rediss://default:<token>@<host>.upstash.io:6379',
    );
  }

  pubClient = createClient({ url: redisUrl });
  subClient = pubClient.duplicate();

  pubClient.on('error', (err) => logger.error('[Redis] Pub Client Error:', { error: err.message }));
  subClient.on('error', (err) => logger.error('[Redis] Sub Client Error:', { error: err.message }));

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));
  logger.info('[Redis] Socket.io Redis adapter connected');
};
