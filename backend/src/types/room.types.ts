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
