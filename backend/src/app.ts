import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import './config/env.js';
import { setupRedis } from './utils/redis.js';
import { startDbKeepalive } from './utils/prisma.js';
import { BroadcastService } from './services/broadcast.service.js';
import { RoomService } from './services/room.service.js';
import { logger } from './utils/logger.js';
import { socketAuthMiddleware, AuthSocket } from './socket/auth.socket.js';
import { setupRoomHandlers } from './socket/room.handler.js';
import { setupGameHandlers } from './socket/game.handler.js';
import { setupChatHandlers } from './socket/chat.handler.js';
import authRoutes from './routes/auth.routes.js';
import { ApiResponse } from './utils/api.response.js';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Global error handler ────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  ApiResponse.error(res, err.message || 'Internal server error', err, err.statusCode || 500);
});

// ── Redis + Socket.io ───────────────────────────────────────────────────────
try {
  await setupRedis(io);
} catch (err) {
  logger.error(`[Startup] ${(err as Error).message}`);
  process.exit(1);
}
startDbKeepalive();
BroadcastService.initialize(io);

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  const authedSocket = socket as AuthSocket;
  logger.info(`[Socket Connected] User: ${authedSocket.userId || 'Guest'} (socketId: ${socket.id})`);

  setupRoomHandlers(io, authedSocket);
  setupGameHandlers(io, authedSocket);
  setupChatHandlers(io, authedSocket);

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        RoomService.leaveRoom(roomId, authedSocket.userId!).catch((err) =>
          logger.error(`[Disconnect] Failed to leave room ${roomId}:`, { error: err.message }),
        );
      }
    }
  });

  socket.on('disconnect', () => {
    logger.info(`[Socket Disconnected] User: ${authedSocket.userId || 'Guest'} (socketId: ${socket.id})`);
  });
});

export { app, io, httpServer };
