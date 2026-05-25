import { prisma } from './prisma.js';
import { LeaderboardEntry } from '../types/game.types.js';

export function randomizeTarget(boardSize: number, avoidX?: number, avoidY?: number): { x: number; y: number } {
  let x: number;
  let y: number;
  do {
    x = Math.floor(Math.random() * boardSize);
    y = Math.floor(Math.random() * boardSize);
  } while (x === avoidX && y === avoidY);
  return { x, y };
}

export async function getRoomLeaderboard(roomId: string): Promise<LeaderboardEntry[]> {
  const gameStates = await prisma.gameState.findMany({
    where: { roomId },
    include: { user: { select: { nickname: true } } },
    orderBy: { score: 'desc' },
  });

  return gameStates.map((gs) => ({
    userId: gs.userId,
    nickname: gs.user.nickname,
    score: gs.score,
  }));
}
