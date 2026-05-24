import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(30, 'Nickname must be at most 30 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Room name is required')
    .max(50, 'Room name must be at most 50 characters'),
  maxPlayers: z
    .union([z.number().int().min(2).max(20), z.null()])
    .optional()
    .default(null),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type CreateRoomFormData = z.infer<typeof createRoomSchema>;
