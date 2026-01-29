import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRY_DAYS: z.coerce.number().default(7),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const env = {
    PORT: process.env.PORT,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY_DAYS: process.env.JWT_EXPIRY_DAYS,
  };

  return envSchema.parse(env);
}
