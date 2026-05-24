import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';

/** Result returned after a successful piece move. */
export interface MoveResult {
  state: {
    pieceX: number;
    pieceY: number;
    targetX: number;
    targetY: number;
    score: number;
    turnQueue: unknown;
  };
  from: { x: number; y: number };
}

/**
 * Core game logic for moving the shared Energy Orb and managing turn rotation.
 *
 * All state mutations happen inside a Prisma transaction to guarantee atomicity.
 * Move history is logged asynchronously (fire-and-forget) to avoid blocking the response.
 */
export class GameService {
  /**
   * Validates and executes a piece move for the given user in the given room.
   *
   * 1. Checks the user is at the front of the turn queue.
   * 2. Validates the destination is within board bounds and adjacent to the current position.
   * 3. If the destination matches the target, increments the score and spawns a new target.
   * 4. Rotates the queue (active player moves to the back).
   *
   * @param roomId - The room where the move occurs
   * @param userId - The player attempting the move
   * @param toX - Destination column (0-indexed)
   * @param toY - Destination row (0-indexed)
   * @returns Updated game state and the previous piece position (for delta broadcasting)
   * @throws AppError if validation fails (not your turn, out of bounds, etc.)
   */
  static async movePiece(roomId: string, userId: string, toX: number, toY: number): Promise<MoveResult> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { boardSize: true },
    });
    if (!room) throw new AppError('Room not found');

    const boardSize = room.boardSize;

    const result = await prisma.$transaction(
      async (tx) => {
        const gameState = await tx.gameState.findUnique({ where: { roomId } });
        if (!gameState) throw new AppError('Game state not found');

        const queue = (gameState.turnQueue as string[]) ?? [];
        if (queue[0] !== userId) throw new AppError('Not your turn');

        if (toX < 0 || toX >= boardSize || toY < 0 || toY >= boardSize) {
          throw new AppError('Move out of board bounds');
        }

        const dx = Math.abs(toX - gameState.pieceX);
        const dy = Math.abs(toY - gameState.pieceY);
        if (dx > 1 || dy > 1) {
          throw new AppError('Invalid move — you can only move 1 tile');
        }

        const scored = toX === gameState.targetX && toY === gameState.targetY;
        const scoreIncr = scored ? 1 : 0;

        let newTargetX = gameState.targetX;
        let newTargetY = gameState.targetY;

        if (scored) {
          do {
            newTargetX = Math.floor(Math.random() * boardSize);
            newTargetY = Math.floor(Math.random() * boardSize);
          } while (newTargetX === toX && newTargetY === toY);
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
            turnQueue: nextQueue,
          },
        });

        return {
          state: updatedState,
          from: { x: gameState.pieceX, y: gameState.pieceY },
          scored,
        };
      },
      { maxWait: 15000, timeout: 30000 },
    );

    prisma.moveHistory
      .create({
        data: {
          roomId,
          userId,
          toX,
          toY,
          fromX: result.from.x,
          fromY: result.from.y,
          scored: result.scored,
        },
      })
      .catch((err) => console.error('[MoveHistory] Failed to log move:', err.message));

    return result;
  }
}
