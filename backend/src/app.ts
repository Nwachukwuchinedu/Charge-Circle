import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { setupRedis } from './utils/redis.js';
import { BroadcastService } from './services/broadcast.service.js';
import { logger } from './utils/logger.js';


const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

import authRoutes from './routes/auth.routes.js';

// Setup routes here
app.use('/api/auth', authRoutes);

// Setup Socket.io and Redis Adapter
setupRedis(io);
BroadcastService.initialize(io);
import { socketAuthMiddleware, AuthSocket } from './socket/auth.socket.js';
import { setupRoomHandlers } from './socket/room.handler.js';
import { setupGameHandlers } from './socket/game.handler.js';
import { setupChatHandlers } from './socket/chat.handler.js';

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  logger.info(`[Socket Connected] User: ${(socket as AuthSocket).userId || 'Guest'} (socketId: ${socket.id})`);
  
  setupRoomHandlers(io, socket as AuthSocket);
  setupGameHandlers(io, socket as AuthSocket);
  setupChatHandlers(io, socket as AuthSocket);

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        import('./services/room.service.js').then(({ RoomService }) => {
          RoomService.markUserDisconnected(roomId, (socket as AuthSocket).userId!);
        });
      }
    }
  });

  socket.on('disconnect', () => {
    logger.info(`[Socket Disconnected] User: ${(socket as AuthSocket).userId || 'Guest'} (socketId: ${socket.id})`);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Charge Circle backend running on port ${PORT}`);
});
