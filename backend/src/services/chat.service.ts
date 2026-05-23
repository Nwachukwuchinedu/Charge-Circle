import { prisma } from '../utils/prisma.js';

export class ChatService {
  static async saveMessage(roomId: string, userId: string, message: string) {
    const chatMsg = await prisma.chatMessage.create({
      data: {
        roomId,
        userId,
        message
      },
      include: { user: { select: { nickname: true } } }
    });
    return chatMsg;
  }
}
