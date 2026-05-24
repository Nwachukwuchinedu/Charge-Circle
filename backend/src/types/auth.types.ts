/** Shape returned by signup, login, and refresh operations. */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nickname: string;
  };
}

/** Shape of the JWT payload embedded in access tokens. */
export interface TokenPayload {
  userId: string;
  nickname?: string;
}
