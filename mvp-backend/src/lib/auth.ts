import jwt from "jsonwebtoken";
import { hash, verify } from "argon2";
import type { JWTPayload } from "../types/zodSchemas.js";
import type { Env } from "../env.js";

export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return verify(hash, password);
}

export function generateToken(payload: JWTPayload, env: Env): string {
  const expiresIn = `${env.JWT_EXPIRY_DAYS}d`;
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
    algorithm: "HS256",
  });
}

export function verifyToken(token: string, env: Env): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  }) as JWTPayload;
}

export function extractTokenFromHeader(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new Error("No authorization header");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new Error("Invalid authorization header format");
  }

  return parts[1];
}
