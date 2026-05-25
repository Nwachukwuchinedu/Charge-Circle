import { z } from 'zod';

const stripHtml = (v: string) => v.replace(/<[^>]*>/g, '').trim();

/**
 * Validates room creation requests.
 * `maxPlayers` can be omitted or set to null for unlimited capacity.
 */
export const CreateRoomDto = z.object({
  name: z.string().min(1).max(50).transform(stripHtml),
  maxPlayers: z.number().int().min(2).max(20).nullable().optional(),
});
export type CreateRoomDto = z.infer<typeof CreateRoomDto>;

/**
 * Validates room join requests.
 */
export const JoinRoomDto = z.object({
  roomId: z.string(),
});
export type JoinRoomDto = z.infer<typeof JoinRoomDto>;

/**
 * Validates room update requests (edit name / maxPlayers).
 * All fields are optional; only provided fields are updated.
 */
export const UpdateRoomDto = z.object({
  roomId: z.string(),
  name: z.string().min(1).max(50).transform(stripHtml).optional(),
  maxPlayers: z.number().int().min(2).max(20).nullable().optional(),
});
export type UpdateRoomDto = z.infer<typeof UpdateRoomDto>;

/**
 * Validates room deletion requests.
 */
export const DeleteRoomDto = z.object({
  roomId: z.string(),
});
export type DeleteRoomDto = z.infer<typeof DeleteRoomDto>;

/**
 * Validates generic room-id-only requests (leave, start round, get leaderboard).
 */
export const RoomIdDto = z.object({
  roomId: z.string(),
});
export type RoomIdDto = z.infer<typeof RoomIdDto>;
