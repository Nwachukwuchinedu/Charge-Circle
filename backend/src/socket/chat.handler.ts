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
      const chatMsg = await ChatService.saveMessage(data.roomId, socket.userId!, data.message);
      io.to(data.roomId).emit('chat_message', chatMsg);
    } catch (error: any) {
      socket.emit('game_error', { message: error.message });
    }
  });
};
