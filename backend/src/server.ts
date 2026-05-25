import { io, httpServer } from './app.js';
import { env } from './config/env.js';
import { pubClient, subClient } from './utils/redis.js';
import { stopDbKeepalive, prisma } from './utils/prisma.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT;

httpServer.listen(PORT, () => {
  logger.info(`Charge Circle backend running on port ${PORT}`);
});

const shutdown = (signal: string) => {
  logger.info(`[Shutdown] Received ${signal}. Closing servers...`);
  void io.close(() => {
    httpServer.close(() => {
      stopDbKeepalive();
      void prisma.$disconnect().finally(() => {
        void Promise.all([
          pubClient?.quit(),
          subClient?.quit(),
        ]).catch(() => {}).finally(() => {
          logger.info('[Shutdown] All connections closed. Goodbye.');
          process.exit(0);
        });
      });
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
