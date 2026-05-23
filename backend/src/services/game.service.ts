import { prisma } from '../utils/prisma.js';

export class GameService {
  static async movePiece(roomId: string, userId: string, toX: number, toY: number) {
    const gameState = await prisma.gameState.findUnique({ where: { roomId } });
    if (!gameState) throw new Error('Game state not found');

    const queue = (gameState.turnQueue as string[]) || [];
    if (queue[0] !== userId) throw new Error('Not your turn');

    // Simple game logic: Move piece to (toX, toY)
    const isTarget = (toX === gameState.targetX && toY === gameState.targetY);
    const scoreIncr = isTarget ? 1 : 0;
    
    let newTargetX = gameState.targetX;
    let newTargetY = gameState.targetY;
    
    if (isTarget) {
      newTargetX = Math.floor(Math.random() * 10);
      newTargetY = Math.floor(Math.random() * 10);
    }

    // Shift turn to the next player
    const nextQueue = queue.length > 1 ? [...queue.slice(1), queue[0]] : queue;

    const updatedState = await prisma.gameState.update({
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

    await prisma.moveHistory.create({
      data: {
        roomId,
        userId,
        toX,
        toY,
        fromX: gameState.pieceX,
        fromY: gameState.pieceY,
        scored: isTarget
      }
    });

    return {
      state: updatedState,
      from: { x: gameState.pieceX, y: gameState.pieceY }
    };
  }
}
