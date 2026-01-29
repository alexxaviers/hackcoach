import type { FastifyInstance } from "fastify";
import type { Env } from "../env.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from "../types/zodSchemas.js";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth.js";
import { errorResponses } from "../lib/errors.js";

export async function registerAuthRoutes(
  fastify: FastifyInstance,
  env: Env,
  supabase: SupabaseClient
) {
  fastify.post<{ Body: RegisterInput }>("/auth/register", async (req) => {
    try {
      const parsed = registerSchema.parse(req.body);

      // Check if username exists
      const { data: existing, error: selectError } = await supabase
        .from("users")
        .select("id")
        .eq("username", parsed.username)
        .single();

      if (existing) {
        throw errorResponses.USER_EXISTS();
      }

      if (selectError && selectError.code !== "PGRST116") {
        throw errorResponses.DB_ERROR(selectError.message);
      }

      // Hash password
      const passwordHash = await hashPassword(parsed.password);

      // Insert user
      const { data, error } = await supabase
        .from("users")
        .insert({
          username: parsed.username,
          password_hash: passwordHash,
        })
        .select("id, username")
        .single();

      if (error) {
        throw errorResponses.DB_ERROR(error.message);
      }

      return {
        data: {
          userId: data.id,
          username: data.username,
        },
      };
    } catch (err) {
      throw err;
    }
  });

  fastify.post<{ Body: LoginInput }>("/auth/login", async (req) => {
    try {
      const parsed = loginSchema.parse(req.body);

      // Find user
      const { data: user, error } = await supabase
        .from("users")
        .select("id, username, password_hash")
        .eq("username", parsed.username)
        .single();

      if (error || !user) {
        throw errorResponses.INVALID_CREDENTIALS();
      }

      // Verify password
      const isValid = await verifyPassword(
        parsed.password,
        user.password_hash
      );

      if (!isValid) {
        throw errorResponses.INVALID_CREDENTIALS();
      }

      // Generate token
      const token = generateToken(
        { userId: user.id, username: user.username },
        env
      );

      return {
        data: {
          token,
          userId: user.id,
          username: user.username,
        },
      };
    } catch (err) {
      throw err;
    }
  });
}
