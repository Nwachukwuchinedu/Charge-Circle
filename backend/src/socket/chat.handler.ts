import { Server } from 'socket.io';
import { AuthSocket } from './auth.socket.js';
import { ChatService } from '../services/chat.service.js';
import { throttleSocket } from '../utils/throttle.js';

export const setupChatHandlers = (io: Server, socket: AuthSocket) => {
  socket.on('send_chat', async (data: { roomId: string, message: string }) => {
    try {
      if (!throttleSocket(`chat_${socket.userId}`, 500)) {
        return; // Max 2 messages per second
      }

      // Emit optimistically — don't wait for DB
      const optimisticMsg = {
        id: Date.now(),
        roomId: data.roomId,
        userId: socket.userId,
        message: data.message,
        createdAt: new Date().toISOString(),
        user: { nickname: socket.nickname || 'Player' }
      };
      io.to(data.roomId).emit('chat_message', optimisticMsg);

      // Persist in background (fire-and-forget)
      ChatService.saveMessage(data.roomId, socket.userId!, data.message)
        .catch(err => console.error('[Chat] Failed to persist message:', err.message));
    } catch (error: any) {
      socket.emit('game_error', { message: error.message });
    }
  });
};
