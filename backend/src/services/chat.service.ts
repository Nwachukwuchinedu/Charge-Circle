import { prisma } from '../utils/prisma.js';
import { ChatMessage } from '@prisma/client';

/**
 * Persists chat messages to the database.
 *
 * Messages are written asynchronously (fire-and-forget pattern from the handler)
 * so the real-time broadcast is not blocked by DB write latency.
 */
export class ChatService {
  /**
   * Saves a chat message and returns it with the author's nickname included.
   *
   * @param roomId - The room the message belongs to
   * @param userId - The sender's user ID
   * @param message - The message body (1-500 characters, validated by DTO)
   * @returns The created message including the user's nickname
   */
  static async saveMessage(roomId: string, userId: string, message: string): Promise<ChatMessage & { user: { nickname: string } }> {
    return prisma.chatMessage.create({
      data: { roomId, userId, message },
      include: { user: { select: { nickname: true } } },
    });
  }
}
