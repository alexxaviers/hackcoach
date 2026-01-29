import type { FastifyInstance } from "fastify";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorResponses } from "../lib/errors.js";

export async function registerCoachesRoutes(
  fastify: FastifyInstance,
  supabase: SupabaseClient
) {
  // Get all coaches
  fastify.get("/coaches", async (request, reply) => {
    try {
      const { data: coaches, error } = await supabase
        .from("coaches")
        .select("id, name, description, is_premium");

      if (error) {
        throw errorResponses.DB_ERROR(error.message);
      }

      return {
        data: coaches,
      };
    } catch (err) {
      throw err;
    }
  });

  // Get single coach
  fastify.get<{ Params: { id: string } }>(
    "/coaches/:id",
    async (request, reply) => {
      try {
        const { id } = request.params;

        const { data: coach, error } = await supabase
          .from("coaches")
          .select("id, name, description, is_premium, system_prompt")
          .eq("id", id)
          .single();

        if (error || !coach) {
          throw errorResponses.COACH_NOT_FOUND();
        }

        return {
          data: coach,
        };
      } catch (err) {
        throw err;
      }
    }
  );
}
