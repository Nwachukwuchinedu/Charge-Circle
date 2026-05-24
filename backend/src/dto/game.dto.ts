import { z } from 'zod';

/**
 * Validates move_piece requests from the client.
 * Expects the room identifier alongside destination coordinates.
 */
export const MovePieceDto = z.object({
  roomId: z.string(),
  toX: z.number().int().min(0),
  toY: z.number().int().min(0),
});
export type MovePieceDto = z.infer<typeof MovePieceDto>;
