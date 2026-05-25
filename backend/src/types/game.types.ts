/** Leaderboard entry sent to clients. */
export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  score: number;
}

/** Payload shape for delta state updates sent to clients between full-state syncs. */
export interface GameStateDelta {
  piece?: { x: number; y: number };
  target?: { x: number; y: number };
  score?: number;
  lastMove?: { userId: string; from: { x: number; y: number }; to: { x: number; y: number } };
}

/** Result returned after a successful piece move. */
export interface MoveResult {
  state: {
    pieceX: number;
    pieceY: number;
    targetX: number;
    targetY: number;
    score: number;
  };
  from: { x: number; y: number };
  scored: boolean;
}
