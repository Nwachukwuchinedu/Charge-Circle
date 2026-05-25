import { prisma } from '../utils/prisma.js';

/**
 * Generates a random board position, optionally avoiding a specific coordinate.
 *
 * @param boardSize - The board is 0..boardSize-1 in both axes
 * @param avoidX - If set, the result will not have this X (combined with avoidY)
 * @param avoidY - If set, the result will not have this Y (combined with avoidX)
 * @returns A random { x, y } position within board bounds
 */
export function randomizeTarget(boardSize: number, avoidX?: number, avoidY?: number): { x: number; y: number } {
  let x: number;
  let y: number;
  do {
    x = Math.floor(Math.random() * boardSize);
    y = Math.floor(Math.random() * boardSize);
  } while (x === avoidX && y === avoidY);
  return { x, y };
}

/**
 * Fetches all game states for a room, ordered by score descending.
 *
 * @param roomId - The room to fetch the leaderboard for
 * @returns Array of { userId, nickname, score } sorted by score
 */
export async function getRoomLeaderboard(roomId: string): Promise<{ userId: string; nickname: string; score: number }[]> {
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
