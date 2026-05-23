import { z } from 'zod';

export const SendChatDto = z.object({
  roomId:  z.string(),
  message: z.string().min(1).max(500)
});
export type SendChatDto = z.infer<typeof SendChatDto>;
