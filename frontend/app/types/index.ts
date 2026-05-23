export interface User {
  id: string;
  nickname: string;
  email: string;
}

export interface GameState {
  roomId: string;
  pieceX: number;
  pieceY: number;
  targetX: number;
  targetY: number;
  score: number;
  turnQueue: string[];
}

export interface Room {
  id: string;
  name: string;
  ownerId: string;
  status: string;
  boardSize: number;
  createdAt: string;
  owner: { nickname: string };
  gameStates: GameState[];
}

export interface GameStateDelta {
  piece?: { x: number; y: number };
  activePlayer?: string;
  score?: number;
  lastMove?: { userId: string; from: { x: number, y: number }; to: { x: number, y: number } };
  gridCharged?: boolean;
}

export interface ChatMessage {
  id: number;
  roomId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: { nickname: string };
}
