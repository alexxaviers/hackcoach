import { z } from 'zod';

export const AuthSignup = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const AuthLogin = AuthSignup;

export const Coach = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isPremium: z.boolean(),
  systemPrompt: z.string()
});

export const Message = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: z.enum(['user','assistant','system']),
  content: z.string(),
  createdAt: z.string()
});

export type Coach = z.infer<typeof Coach>;
export type Message = z.infer<typeof Message>;
