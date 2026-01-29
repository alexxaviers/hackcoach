import type { FastifyInstance } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import {
  createSessionSchema,
  messageSchema,
  type CreateSessionInput,
  type MessageInput,
  type JWTPayload,
} from "../types/zodSchemas.js";
import { errorResponses } from "../lib/errors.js";
import { buildSystemPrompt, buildMessagesForOpenAI } from "../lib/prompt.js";
import type { Env } from "../env.js";

declare global {
  namespace FastifyInstance {
    interface FastifyInstance {
      authenticate: any;
    }
  }
}

export async function registerSessionsRoutes(
  fastify: FastifyInstance,
  supabase: SupabaseClient,
  env: Env
) {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  // Create session
  fastify.post<{ Body: CreateSessionInput }>(
    "/sessions",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user as JWTPayload;
        const parsed = createSessionSchema.parse(request.body);

        const { data: session, error } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: user.userId,
            coach_id: parsed.coachId,
            title: parsed.title || `Chat with ${parsed.coachId}`,
          })
          .select("id")
          .single();

        if (error) {
          throw errorResponses.DB_ERROR(error.message);
        }

        return {
          data: {
            sessionId: session.id,
          },
        };
      } catch (err) {
        throw err;
      }
    }
  );

  // List sessions
  fastify.get(
    "/sessions",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user as JWTPayload;

        const { data: sessions, error } = await supabase
          .from("chat_sessions")
          .select("id, coach_id, title, created_at, updated_at")
          .eq("user_id", user.userId)
          .order("updated_at", { ascending: false });

        if (error) {
          throw errorResponses.DB_ERROR(error.message);
        }

        return {
          data: sessions,
        };
      } catch (err) {
        throw err;
      }
    }
  );

  // Get session with messages
  fastify.get<{ Params: { id: string } }>(
    "/sessions/:id",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user as JWTPayload;
        const { id } = request.params;

        // Check ownership
        const { data: session, error: sessionError } = await supabase
          .from("chat_sessions")
          .select("id, coach_id, title, created_at, updated_at")
          .eq("id", id)
          .eq("user_id", user.userId)
          .single();

        if (sessionError || !session) {
          throw errorResponses.SESSION_NOT_FOUND();
        }

        // Get messages
        const { data: messages, error: messagesError } = await supabase
          .from("chat_messages")
          .select("id, role, content, created_at")
          .eq("session_id", id)
          .order("created_at", { ascending: true });

        if (messagesError) {
          throw errorResponses.DB_ERROR(messagesError.message);
        }

        return {
          data: {
            session,
            messages,
          },
        };
      } catch (err) {
        throw err;
      }
    }
  );

  // Send message
  fastify.post<{ Params: { id: string }; Body: MessageInput }>(
    "/sessions/:id/messages",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user as JWTPayload;
        const { id: sessionId } = request.params;
        const parsed = messageSchema.parse(request.body);

        // Check session ownership
        const { data: session, error: sessionError } = await supabase
          .from("chat_sessions")
          .select("coach_id")
          .eq("id", sessionId)
          .eq("user_id", user.userId)
          .single();

        if (sessionError || !session) {
          throw errorResponses.SESSION_NOT_FOUND();
        }

        // Store user message
        const { error: userMsgError } = await supabase
          .from("chat_messages")
          .insert({
            session_id: sessionId,
            role: "user",
            content: parsed.content,
          });

        if (userMsgError) {
          throw errorResponses.DB_ERROR(userMsgError.message);
        }

        // Get coach details
        const { data: coach, error: coachError } = await supabase
          .from("coaches")
          .select("id, system_prompt")
          .eq("id", session.coach_id)
          .single();

        if (coachError || !coach) {
          throw errorResponses.COACH_NOT_FOUND();
        }

        // Get user context
        const { data: userContext } = await supabase
          .from("user_context")
          .select("*")
          .eq("user_id", user.userId)
          .single();

        // Get recent messages
        const { data: recentMessages, error: messagesError } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (messagesError) {
          throw errorResponses.DB_ERROR(messagesError.message);
        }

        // Build system prompt with context
        const systemPrompt = buildSystemPrompt(
          coach as any,
          userContext as any,
          recentMessages as any
        );

        // Build OpenAI messages
        const messages = buildMessagesForOpenAI(
          systemPrompt,
          recentMessages as any
        );

        // Call OpenAI
        let assistantContent: string;
        try {
          const response = await openai.chat.completions.create({
            model: env.OPENAI_MODEL,
            messages,
            max_tokens: 1024,
            temperature: 0.7,
          });

          assistantContent =
            response.choices[0]?.message?.content ||
            "I encountered an error generating a response.";
        } catch (openaiError: any) {
          throw errorResponses.OPENAI_ERROR(openaiError.message);
        }

        // Store assistant message
        const { error: assistantMsgError } = await supabase
          .from("chat_messages")
          .insert({
            session_id: sessionId,
            role: "assistant",
            content: assistantContent,
          });

        if (assistantMsgError) {
          throw errorResponses.DB_ERROR(assistantMsgError.message);
        }

        // Update session timestamp
        await supabase
          .from("chat_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", sessionId);

        return {
          data: {
            assistant: {
              content: assistantContent,
            },
          },
        };
      } catch (err) {
        throw err;
      }
    }
  );
}
