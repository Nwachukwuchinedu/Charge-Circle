import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

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

app.use('/api/auth', authRoutes);

setupRedis(io);
startDbKeepalive();
BroadcastService.initialize(io);
RoomService.startCleanupSweep();

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
        RoomService.markUserDisconnected(roomId, authedSocket.userId!);
      }
    }
  });

  socket.on('disconnect', () => {
    logger.info(`[Socket Disconnected] User: ${authedSocket.userId || 'Guest'} (socketId: ${socket.id})`);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  logger.info(`Charge Circle backend running on port ${PORT}`);
});
