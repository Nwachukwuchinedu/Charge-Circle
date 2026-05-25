import { Server } from 'socket.io';
import { AuthSocket } from './auth.socket.js';
import { ChatService } from '../services/chat.service.js';
import { throttleSocket } from '../utils/throttle.js';
import { SocketResponse } from '../utils/socket.response.js';
import { logger } from '../utils/logger.js';
import { SendChatDto } from '../dto/chat.dto.js';

/**
 * Registers chat-related Socket.io event handlers on the given socket.
 *
 * Events:
 * - `send_chat`: Relays a message to all room members and persists it to the DB.
 *
 * Messages are broadcast optimistically (before the DB write completes) so
 * the sender and other users see the message instantly.
 *
 * @param io - The Socket.io server instance (used for broadcasting)
 * @param socket - The authenticated client socket
 */
export const setupChatHandlers = (io: Server, socket: AuthSocket): void => {
  socket.on('send_chat', (data: unknown) => {
    try {
      if (!throttleSocket(`chat_${socket.userId}`, 500)) return;

      const parsed = SendChatDto.parse(data);

      const optimisticMsg = {
        id: Date.now(),
        roomId: parsed.roomId,
        userId: socket.userId!,
        message: parsed.message,
        createdAt: new Date().toISOString(),
        user: { nickname: socket.nickname || 'Player' },
      };

      SocketResponse.broadcast(io.to(parsed.roomId), parsed.roomId, 'chat_message', optimisticMsg);

      ChatService.saveMessage(parsed.roomId, socket.userId!, parsed.message).catch((err) =>
        logger.error('[Chat] Failed to persist message:', {
          error: err.message,
          roomId: parsed.roomId,
          userId: socket.userId,
        }),
      );
    } catch (error: any) {
      SocketResponse.error(socket, error.message, 'game_error', error);
    }
  });
};
