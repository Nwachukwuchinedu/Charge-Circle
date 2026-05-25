import { Prisma } from '@prisma/client';

export type ChatMessageWithUser = Prisma.ChatMessageGetPayload<{
  include: { user: { select: { nickname: true } } };
}>;
