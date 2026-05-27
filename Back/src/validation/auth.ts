import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/, 'Password must include uppercase, lowercase, number and special character'),
    name: z.string().min(1)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    avatar: z.string().url().optional()
  })
});
