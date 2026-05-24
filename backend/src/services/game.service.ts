import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { RoomService } from './room.service.js';

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
  scored: boolean;
}

/**
 * Core game logic for moving the shared Energy Orb and managing turn rotation.
 *
 * State is read from an in-memory cache (RoomService.roomCache) to eliminate
 * DB round trips on every move. On a cache miss the data is loaded from the
 * database and the cache is seeded.
 *
 * The actual state mutation is a single Prisma update (no transaction overhead).
 * Move history is persisted asynchronously.
 */
export class GameService {
  /**
   * Validates and executes a piece move for the given user in the given room.
   *
   * 1. Reads state from the in-memory cache (falls back to DB on miss).
   * 2. Validates turn ownership, board bounds, and adjacency.
   * 3. Computes the new state (score, target, queue rotation).
   * 4. Writes the new state with a single atomic Prisma `update`.
   * 5. Updates the in-memory cache.
   *
   * @param roomId - The room where the move occurs
   * @param userId - The player attempting the move
   * @param toX - Destination column (0-indexed)
   * @param toY - Destination row (0-indexed)
   * @returns Updated game state, previous position, and whether it scored
   * @throws AppError if validation fails (not your turn, out of bounds, etc.)
   */
  static async movePiece(roomId: string, userId: string, toX: number, toY: number): Promise<MoveResult> {
    const start = Date.now();

    // ── Load state (cache preferred; DB fallback) ──────────────────────
    const cached = RoomService.getRoomCache(roomId);
    let boardSize = cached?.boardSize;
    let gs = cached?.gameState;

    if (!boardSize || !gs) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { boardSize: true },
      });
      if (!room) throw new AppError('Room not found');
      boardSize = room.boardSize;

      const dbState = await prisma.gameState.findUnique({ where: { roomId } });
      if (!dbState) throw new AppError('Game state not found');

      gs = {
        pieceX: dbState.pieceX,
        pieceY: dbState.pieceY,
        targetX: dbState.targetX,
        targetY: dbState.targetY,
        score: dbState.score,
        turnQueue: (dbState.turnQueue as string[]) ?? [],
      };

      RoomService.setRoomCache(roomId, { boardSize, gameState: gs });
    }

    // ── Validate ───────────────────────────────────────────────────────
    const queue = gs.turnQueue;
    if (queue[0] !== userId) throw new AppError('Not your turn');

    if (toX < 0 || toX >= boardSize || toY < 0 || toY >= boardSize) {
      throw new AppError('Move out of board bounds');
    }

    const dx = Math.abs(toX - gs.pieceX);
    const dy = Math.abs(toY - gs.pieceY);
    if (dx > 1 || dy > 1) {
      throw new AppError('Invalid move — you can only move 1 tile');
    }

    // ── Compute new state ──────────────────────────────────────────────
    const scored = toX === gs.targetX && toY === gs.targetY;
    const scoreIncr = scored ? 1 : 0;

    let newTargetX = gs.targetX;
    let newTargetY = gs.targetY;

    if (scored) {
      do {
        newTargetX = Math.floor(Math.random() * boardSize);
        newTargetY = Math.floor(Math.random() * boardSize);
      } while (newTargetX === toX && newTargetY === toY);
    }

    const nextQueue = queue.length > 1 ? [...queue.slice(1), queue[0]] : queue;
    const newScore = gs.score + scoreIncr;

    // ── Single atomic write ─────────────────────────────────────────────
    const updatedState = await prisma.gameState.update({
      where: { roomId },
      data: {
        pieceX: toX,
        pieceY: toY,
        targetX: newTargetX,
        targetY: newTargetY,
        score: newScore,
        turnQueue: nextQueue,
      },
    });

    // ── Update cache ───────────────────────────────────────────────────
    RoomService.setRoomCache(roomId, {
      gameState: {
        pieceX: updatedState.pieceX,
        pieceY: updatedState.pieceY,
        targetX: updatedState.targetX,
        targetY: updatedState.targetY,
        score: updatedState.score,
        turnQueue: (updatedState.turnQueue as string[]) ?? [],
      },
    });

    // ── Fire-and-forget history ────────────────────────────────────────
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
        turnQueue: updatedState.turnQueue,
      },
      from,
      scored,
    };
  }
}
