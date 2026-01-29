import { z } from "zod";

// Auth Schemas
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Survey Schemas
export const surveyAnswersSchema = z.object({
  role: z.enum(["Builder", "Creator", "Founder", "Student", "Other"]),
  primaryGoal: z.enum([
    "Ship a project",
    "Stay focused",
    "Grow an audience",
    "Reduce overwhelm",
    "Reflect weekly",
  ]),
  stuckOn: z.enum([
    "Starting",
    "Finishing",
    "Prioritizing",
    "Time management",
    "Clarity",
  ]),
  tone: z.enum(["gentle", "neutral", "direct"]),
  tools: z.array(z.string()).optional().default([]),
});

export type SurveyAnswers = z.infer<typeof surveyAnswersSchema>;

// Context Update Schema
export const contextUpdateSchema = z.object({
  role: z.string().optional(),
  goals: z.string().optional(),
  tools: z.array(z.string()).optional(),
  preferences: z.record(z.any()).optional(),
});

export type ContextUpdate = z.infer<typeof contextUpdateSchema>;

// Session Schemas
export const createSessionSchema = z.object({
  coachId: z.enum(["focus", "creator", "builder", "reflection"]),
  title: z.string().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

export type MessageInput = z.infer<typeof messageSchema>;

// Database Types
export interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Coach {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  is_premium: boolean;
}

export interface UserContext {
  user_id: string;
  role: string | null;
  goals: string | null;
  tools: string[];
  preferences: Record<string, any>;
  updated_at: string;
}

export interface Survey {
  id: string;
  user_id: string;
  answers: Record<string, any>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  coach_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  username: string;
}
