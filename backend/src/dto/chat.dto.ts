import { z } from 'zod';

const stripHtml = (v: string) => v.replace(/<[^>]*>/g, '').trim();

export const SendChatDto = z.object({
  roomId: z.string(),
  message: z.string().min(1).max(500).transform(stripHtml),
});
export type SendChatDto = z.infer<typeof SendChatDto>;
