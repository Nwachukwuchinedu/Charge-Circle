import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server } from 'socket.io';

/**
 * Attaches a Redis pub/sub adapter to the Socket.io server.
 *
 * Enables horizontal scaling by forwarding events between multiple
 * Node.js instances. Falls back gracefully to in-memory mode when
 * `REDIS_URL` is not set or unreachable.
 *
 * @param io - The Socket.io server instance
 */
export const setupRedis = async (io: Server): Promise<void> => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('[Redis] No REDIS_URL found in .env. Falling back to in-memory mode for Socket.io.');
    return;
  }

  try {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => console.error('[Redis] Pub Client Error:', err.message));
    subClient.on('error', (err) => console.error('[Redis] Sub Client Error:', err.message));

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Redis] Socket.io Redis Adapter successfully connected');
  } catch (err: any) {
    console.error(`[Redis] Failed to connect to Redis (${err.message}). Falling back to in-memory mode.`);
  }
};
