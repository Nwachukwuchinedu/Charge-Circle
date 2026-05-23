import { z } from 'zod';

export const SignupDto = z.object({
  nickname: z.string().min(2).max(20),
  email:    z.string().email(),
  password: z.string().min(6).max(100)
});
export type SignupDto = z.infer<typeof SignupDto>;

export const LoginDto = z.object({
  email:    z.string().email(),
  password: z.string()
});
export type LoginDto = z.infer<typeof LoginDto>;
