export interface User {
  id: string;
  nickname: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface GameState {
  roomId: string;
  userId: string;
  pieceX: number;
  pieceY: number;
  targetX: number;
  targetY: number;
  score: number;
}

export interface RoomPlayer {
  id: string;
  nickname: string;
}

export interface Room {
  id: string;
  name: string;
  ownerId: string;
  status: string;
  boardSize: number;
  maxPlayers?: number | null;
  roundEndsAt?: string | null;
  createdAt: string;
  owner: { nickname: string };
  gameStates: GameState[];
  players?: RoomPlayer[];
  activePlayers?: number;
  chatMessages?: ChatMessage[];
}

export interface GameStateDelta {
  piece?: { x: number; y: number };
  target?: { x: number; y: number };
  score?: number;
  lastMove?: { userId: string; from: { x: number; y: number }; to: { x: number; y: number } };
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  score: number;
}

export interface ChatMessage {
  id: number;
  roomId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: { nickname: string };
}
