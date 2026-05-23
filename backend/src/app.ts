import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

import authRoutes from './routes/auth.routes.js';

// Setup routes here
app.use('/api/auth', authRoutes);
import { socketAuthMiddleware, AuthSocket } from './socket/auth.socket.js';
import { setupRoomHandlers } from './socket/room.handler.js';
import { setupGameHandlers } from './socket/game.handler.js';
import { setupChatHandlers } from './socket/chat.handler.js';

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  console.log(`User connected: ${(socket as AuthSocket).userId}`);
  
  setupRoomHandlers(io, socket as AuthSocket);
  setupGameHandlers(io, socket as AuthSocket);
  setupChatHandlers(io, socket as AuthSocket);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${(socket as AuthSocket).userId}`);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Charge Circle backend running on port ${PORT}`);
});
