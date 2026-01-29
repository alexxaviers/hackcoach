import type { FastifyInstance } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  surveyAnswersSchema,
  contextUpdateSchema,
  type SurveyAnswers,
  type ContextUpdate,
  type JWTPayload,
} from "../types/zodSchemas.js";
import { errorResponses } from "../lib/errors.js";

declare global {
  namespace FastifyInstance {
    interface FastifyInstance {
      authenticate: any;
    }
  }
}

export async function registerSurveyRoutes(
  fastify: FastifyInstance,
  supabase: SupabaseClient
) {
  // Submit survey + update context
  fastify.post<{ Body: SurveyAnswers }>(
    "/survey",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user as JWTPayload;
        const parsed = surveyAnswersSchema.parse(request.body);

        // Store survey
        const { error: surveyError } = await supabase.from("surveys").insert({
          user_id: user.userId,
          answers: parsed,
        });

        if (surveyError) {
          throw errorResponses.DB_ERROR(surveyError.message);
        }

        // Upsert user context
        const { error: contextError } = await supabase
          .from("user_context")
          .upsert({
            user_id: user.userId,
            role: parsed.role,
            goals: parsed.primaryGoal,
            tools: parsed.tools,
            preferences: {
              stuckOn: parsed.stuckOn,
              tone: parsed.tone,
            },
          });

        if (contextError) {
          throw errorResponses.DB_ERROR(contextError.message);
        }

        return {
          data: {
            ok: true,
          },
        };
      } catch (err) {
        throw err;
      }
    }
  );

  // Get user context
  fastify.get(
    "/me/context",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user as JWTPayload;

        const { data: context, error } = await supabase
          .from("user_context")
          .select("*")
          .eq("user_id", user.userId)
          .single();

        if (error && error.code !== "PGRST116") {
          throw errorResponses.DB_ERROR(error.message);
        }

        return {
          data: context || null,
        };
      } catch (err) {
        throw err;
      }
    }
  );

  // Update user context
  fastify.put<{ Body: ContextUpdate }>(
    "/me/context",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user as JWTPayload;
        const parsed = contextUpdateSchema.parse(request.body);

        const { error } = await supabase.from("user_context").upsert({
          user_id: user.userId,
          ...parsed,
        });

        if (error) {
          throw errorResponses.DB_ERROR(error.message);
        }

        return {
          data: {
            ok: true,
          },
        };
      } catch (err) {
        throw err;
      }
    }
  );
}
