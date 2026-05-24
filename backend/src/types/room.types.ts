import { Prisma } from '@prisma/client';

/** A player currently active in a room (in-memory tracking). */
export interface ActiveUser {
  id: string;
  nickname: string;
  online: boolean;
  disconnectedAt?: number;
}

/** Public player summary sent to clients in room payloads. */
export interface PlayerSummary {
  id: string;
  nickname: string;
  online: boolean;
}

/** In-memory cache entry for a room's constant data and hot game state. */
export interface RoomCacheEntry {
  boardSize: number;
  gameState: {
    pieceX: number;
    pieceY: number;
    targetX: number;
    targetY: number;
    score: number;
    turnQueue: string[];
  } | null;
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
}>;

/** Created room with game state and players. */
export type CreatedRoom = Prisma.RoomGetPayload<{
  include: { gameStates: true };
}> & { players: PlayerSummary[] };
