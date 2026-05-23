import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';

interface ActiveUser {
  id: string;
  nickname: string;
  online: boolean;
  disconnectedAt?: number;
}

export class RoomService {
  static activeUsersMap = new Map<string, ActiveUser[]>();

  static async createRoom(ownerId: string, name: string) {
    const dbUser = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { nickname: true }
    });
    const nickname = dbUser?.nickname || 'Player';

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

    // Add owner to active users map
    this.activeUsersMap.set(room.id, [{ id: ownerId, nickname, online: true }]);

    return {
      ...room,
      players: [{ id: ownerId, nickname, online: true }]
    };
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
    
    if (!room) throw new AppError('Room not found');
    if (room.status === 'finished') throw new AppError('Game already finished');

    // Fetch user nickname from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true }
    });
    const nickname = dbUser?.nickname || 'Player';

    if (!this.activeUsersMap.has(roomId)) {
      this.activeUsersMap.set(roomId, []);
    }
    const users = this.activeUsersMap.get(roomId)!;
    const existing = users.find(u => u.id === userId);
    if (existing) {
      existing.online = true;
      existing.nickname = nickname; // update nickname
      existing.disconnectedAt = undefined;
    } else {
      users.push({ id: userId, nickname, online: true });
    }

    const gameState = room.gameStates[0];
    if (!gameState) throw new AppError('Game state corrupted');

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

    const updatedRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: { 
        gameStates: true, 
        owner: { select: { nickname: true } },
        chatMessages: {
          include: { user: { select: { nickname: true } } },
          take: 50,
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!updatedRoom) return null;

    return {
      ...updatedRoom,
      players: users.map(u => ({ id: u.id, nickname: u.nickname, online: u.online }))
    };
  }

  static markUserDisconnected(roomId: string, userId: string) {
    const users = this.activeUsersMap.get(roomId);
    if (!users) return;
    const user = users.find(u => u.id === userId);
    if (user) {
      user.online = false;
      user.disconnectedAt = Date.now();
    }
  }
}

// 30-second lazy cleanup sweep to remove disconnected users
setInterval(async () => {
  const now = Date.now();
  for (const [roomId, users] of RoomService.activeUsersMap.entries()) {
    let changed = false;
    for (let i = users.length - 1; i >= 0; i--) {
      const user = users[i];
      if (!user.online && user.disconnectedAt && now - user.disconnectedAt > 30000) {
        users.splice(i, 1);
        changed = true;
        
        // Remove from DB turn queue
        try {
          const room = await prisma.gameState.findUnique({ where: { roomId } });
          if (room) {
            const queue = (room.turnQueue as string[]) || [];
            const newQueue = queue.filter(u => u !== user.id);
            await prisma.gameState.update({ where: { roomId }, data: { turnQueue: newQueue } });
          }
        } catch (e) {
          console.error('[Sweep] Error removing user from DB queue', e);
        }
      }
    }
  }
}, 30000);
