import { Prisma } from '@prisma/client';

/** Public player summary sent to clients in room payloads. */
export interface PlayerSummary {
  id: string;
  nickname: string;
}

/** Full room payload returned to clients after a join, including players and chat. */
export type RoomWithDetails = Prisma.RoomGetPayload<{
  include: {
    gameStates: true;
    owner: { select: { nickname: true } };
    chatMessages: { include: { user: { select: { nickname: true } } }; take: number; orderBy: { createdAt: 'asc' } };
  };
}> & { players: PlayerSummary[] };

/** Room shape returned to the room list. */
export type RoomListItem = Prisma.RoomGetPayload<{
  include: { owner: { select: { nickname: true } } };
}> & { players: PlayerSummary[]; activePlayers: number };
