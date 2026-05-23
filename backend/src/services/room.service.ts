import { prisma } from '../utils/prisma.js';

export class RoomService {
  static async createRoom(ownerId: string, name: string) {
    const room = await prisma.room.create({
      data: {
        name,
        ownerId,
        status: 'waiting',
        boardSize: 10,
        gameStates: {
          create: {
            pieceX: 4,
            pieceY: 4,
            targetX: 2,
            targetY: 7,
            score: 0,
            turnQueue: [ownerId]
          }
        }
      },
      include: { gameStates: true }
    });
    return room;
  }

  static async getRooms() {
    return prisma.room.findMany({
      where: { status: { in: ['waiting', 'playing'] } },
      include: { owner: { select: { nickname: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async joinRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { gameStates: true }
    });
    
    if (!room) throw new Error('Room not found');
    if (room.status === 'finished') throw new Error('Game already finished');

    const gameState = room.gameStates[0];
    if (!gameState) throw new Error('Game state corrupted');

    const queue = (gameState.turnQueue as string[]) || [];
    let updatedQueue = [...queue];

    if (!queue.includes(userId)) {
      updatedQueue.push(userId);
      await prisma.gameState.update({
        where: { roomId },
        data: { turnQueue: updatedQueue }
      });
    }

    if (updatedQueue.length > 1 && room.status === 'waiting') {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'playing' }
      });
    }

    return await prisma.room.findUnique({
      where: { id: roomId },
      include: { gameStates: true, owner: { select: { nickname: true } } }
    });
  }
}
