import { prisma } from '../utils/prisma.js';

export class GameService {
  static async movePiece(roomId: string, userId: string, toX: number, toY: number) {
    // Single blocking query: read current state + update in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const gameState = await tx.gameState.findUnique({ where: { roomId } });
      if (!gameState) throw new Error('Game state not found');

      const queue = (gameState.turnQueue as string[]) || [];
      if (queue[0] !== userId) throw new Error('Not your turn');

      const isTarget = (toX === gameState.targetX && toY === gameState.targetY);
      const scoreIncr = isTarget ? 1 : 0;
      
      let newTargetX = gameState.targetX;
      let newTargetY = gameState.targetY;
      
      if (isTarget) {
        newTargetX = Math.floor(Math.random() * 10);
        newTargetY = Math.floor(Math.random() * 10);
      }

      const nextQueue = queue.length > 1 ? [...queue.slice(1), queue[0]] : queue;

      const updatedState = await tx.gameState.update({
        where: { roomId },
        data: {
          pieceX: toX,
          pieceY: toY,
          targetX: newTargetX,
          targetY: newTargetY,
          score: gameState.score + scoreIncr,
          turnQueue: nextQueue
        }
      });

      return { state: updatedState, from: { x: gameState.pieceX, y: gameState.pieceY } };
    });

    // Fire-and-forget: log move history without blocking the response
    prisma.moveHistory.create({
      data: {
        roomId,
        userId,
        toX,
        toY,
        fromX: result.from.x,
        fromY: result.from.y,
        scored: false
      }
    }).catch(err => console.error('[MoveHistory] Failed to log move:', err.message));

    return result;
  }
}
