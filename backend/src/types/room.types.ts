/**
 * Represents a user currently active in a room's in-memory state.
 * Tracks online status and supports lazy cleanup of stale connections.
 */
export interface ActiveUser {
  id: string;
  nickname: string;
  online: boolean;
  disconnectedAt?: number;
}

/**
 * Player summary returned to clients in room payloads.
 * Omits sensitive fields like email or password hash.
 */
export interface PlayerSummary {
  id: string;
  nickname: string;
  online: boolean;
}
