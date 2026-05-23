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
// Setup socket handlers here

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Charge Circle backend running on port ${PORT}`);
});
