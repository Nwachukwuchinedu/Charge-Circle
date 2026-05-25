import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { MoveResult } from '../types/game.types.js';
import { randomizeTarget } from '../utils/helpers.js';

/**
 * Core game logic for moving a player's personal Energy Orb.
 *
 * Each player has their own piece, target, and score on a shared board size.
 * Players move independently and simultaneously — no turn queue.
 * Every move is a single atomic Prisma update on the player's row.
 * Move history is persisted asynchronously.
 */
export class GameService {
  /**
   * Validates and executes a piece move for the given user in the given room.
   *
   * 1. Reads the player's GameState from DB.
   * 2. Validates board bounds and adjacency.
   * 3. Computes new state (score, target randomisation).
   * 4. Writes with a single atomic Prisma `update`.
   *
   * @param roomId - The room where the move occurs
   * @param userId - The player making the move
   * @param toX - Destination column (0-indexed)
   * @param toY - Destination row (0-indexed)
   * @returns Updated game state, previous position, and whether it scored
   * @throws AppError if validation fails (out of bounds, etc.)
   */
  static async movePiece(roomId: string, userId: string, toX: number, toY: number): Promise<MoveResult> {
    const start = Date.now();

    // ── Load room for board size ─────────────────────────────
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { boardSize: true, status: true },
    });
    if (!room) throw new AppError('Room not found');
    if (room.status !== 'active') throw new AppError('Round is not active');

    // ── Load player's game state ────────────────────────────
    const gs = await prisma.gameState.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!gs) throw new AppError('Game state not found');

    // ── Validate ────────────────────────────────────────────
    if (toX < 0 || toX >= room.boardSize || toY < 0 || toY >= room.boardSize) {
      throw new AppError('Move out of board bounds');
    }

    const dx = Math.abs(toX - gs.pieceX);
    const dy = Math.abs(toY - gs.pieceY);
    if (dx > 1 || dy > 1) {
      throw new AppError('Invalid move — you can only move 1 tile');
    }

    // ── Compute new state ───────────────────────────────────
    const scored = toX === gs.targetX && toY === gs.targetY;
    const scoreIncr = scored ? 1 : 0;

    let newTargetX = gs.targetX;
    let newTargetY = gs.targetY;

    if (scored) {
      const target = randomizeTarget(room.boardSize, toX, toY);
      newTargetX = target.x;
      newTargetY = target.y;
    }

    const newScore = gs.score + scoreIncr;

    // ── Single atomic write ─────────────────────────────────
    const [updatedState] = await prisma.$transaction([
      prisma.gameState.update({
        where: { roomId_userId: { roomId, userId } },
        data: {
          pieceX: toX,
          pieceY: toY,
          targetX: newTargetX,
          targetY: newTargetY,
          score: newScore,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { totalScore: { increment: scoreIncr } },
      }),
    ]);

    // ── Fire-and-forget history ─────────────────────────────
    const from = { x: gs.pieceX, y: gs.pieceY };

    prisma.moveHistory
      .create({
        data: { roomId, userId, toX, toY, fromX: from.x, fromY: from.y, scored },
      })
      .catch((err) => logger.error('[MoveHistory] Failed to log move:', { error: err.message }));

    const elapsed = Date.now() - start;
    if (elapsed > 100) {
      logger.warn('[MovePiece] Slow move detected', {
        roomId,
        userId,
        elapsedMs: elapsed,
      });
    }

    return {
      state: {
        pieceX: updatedState.pieceX,
        pieceY: updatedState.pieceY,
        targetX: updatedState.targetX,
        targetY: updatedState.targetY,
        score: updatedState.score,
      },
      from,
      scored,
    };
  }
}
