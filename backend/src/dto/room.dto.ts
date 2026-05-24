import { z } from 'zod';

/**
 * Validates room creation requests.
 * `maxPlayers` can be omitted or set to null for unlimited capacity.
 */
export const CreateRoomDto = z.object({
  name: z.string().min(1).max(30),
  maxPlayers: z.number().int().min(1).nullable().optional(),
});
export type CreateRoomDto = z.infer<typeof CreateRoomDto>;

/**
 * Validates room join requests.
 */
export const JoinRoomDto = z.object({
  roomId: z.string(),
});
export type JoinRoomDto = z.infer<typeof JoinRoomDto>;
