import { z } from 'zod';

export const MovePieceDto = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0)
});
export type MovePieceDto = z.infer<typeof MovePieceDto>;
