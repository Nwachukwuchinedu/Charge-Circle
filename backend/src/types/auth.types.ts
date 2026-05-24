/** Shape returned by signup and login operations. */
export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    nickname: string;
  };
}
