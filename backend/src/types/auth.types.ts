/** Shape returned by signup and login operations. */
export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    nickname: string;
  };
}

/** Shape of the JWT payload embedded in every token. */
export interface TokenPayload {
  userId: string;
  nickname?: string;
}
