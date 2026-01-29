import "dotenv/config";
import Fastify, { FastifyError, FastifyInstance } from "fastify";
import type { FastifyRequest } from "fastify";
import { loadEnv } from "./env.js";
import { initSupabase } from "./db/supabase.js";
import { extractTokenFromHeader, verifyToken } from "./lib/auth.js";
import { AppError, errorResponses } from "./lib/errors.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerCoachesRoutes } from "./routes/coaches.js";
import { registerSurveyRoutes } from "./routes/survey.js";
import { registerSessionsRoutes } from "./routes/sessions.js";
import type { JWTPayload } from "./types/zodSchemas.js";

const env = loadEnv();
const supabase = initSupabase(env);

const fastify = Fastify({
  logger: true,
});

// Authentication hook
fastify.decorate("authenticate", async function (
  request: FastifyRequest & { user?: JWTPayload }
) {
  try {
    const token = extractTokenFromHeader(request.headers.authorization);
    const payload = verifyToken(token, env);
    request.user = payload;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      throw errorResponses.EXPIRED_TOKEN();
    }
    if (err.name === "JsonWebTokenError") {
      throw errorResponses.INVALID_TOKEN();
    }
    throw errorResponses.UNAUTHORIZED();
  }
});

// Error handler
fastify.setErrorHandler((error: FastifyError | AppError, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Zod validation errors
  if (error.statusCode === 400 && error.message.includes("validation")) {
    return reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: error.message,
      },
    });
  }

  // Generic error
  request.log.error(error);
  return reply.status(error.statusCode || 500).send({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
});

// Register routes
async function registerRoutes() {
  await registerHealthRoutes(fastify);
  await registerAuthRoutes(fastify, env, supabase);
  await registerCoachesRoutes(fastify, supabase);
  await registerSurveyRoutes(fastify, supabase);
  await registerSessionsRoutes(fastify, supabase, env);
}

// Start server
async function start() {
  try {
    await registerRoutes();
    await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Server running at http://localhost:${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
