/** Payload shape for delta state updates sent to clients between full-state syncs. */
export interface GameStateDelta {
  piece?: { x: number; y: number };
  activePlayer?: string;
  score?: number;
  lastMove?: { userId: string; from: { x: number; y: number }; to: { x: number; y: number } };
  gridCharged?: boolean;
  turnQueue?: string[];
}

/** Result returned after a successful piece move. */
export interface MoveResult {
  state: {
    pieceX: number;
    pieceY: number;
    targetX: number;
    targetY: number;
    score: number;
    turnQueue: unknown;
  };
  from: { x: number; y: number };
  scored: boolean;
}
