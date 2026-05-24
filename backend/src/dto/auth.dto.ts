import { z } from 'zod';

const stripHtml = (v: string) => v.replace(/<[^>]*>/g, '').trim();

export const SignupDto = z.object({
  nickname: z.string().min(1).max(30).transform(stripHtml),
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8),
});
export type SignupDto = z.infer<typeof SignupDto>;

export const LoginDto = z.object({
  email: z.string().transform((v) => v.toLowerCase().trim()),
  password: z.string(),
});
export type LoginDto = z.infer<typeof LoginDto>;
