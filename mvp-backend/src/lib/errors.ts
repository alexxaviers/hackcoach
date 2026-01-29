export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorResponses = {
  INVALID_CREDENTIALS: () =>
    new AppError("INVALID_CREDENTIALS", "Invalid username or password", 401),
  USER_EXISTS: () =>
    new AppError(
      "USER_ALREADY_EXISTS",
      "Username already taken",
      409
    ),
  USER_NOT_FOUND: () =>
    new AppError("USER_NOT_FOUND", "User not found", 404),
  UNAUTHORIZED: () =>
    new AppError("UNAUTHORIZED", "Unauthorized", 401),
  SESSION_NOT_FOUND: () =>
    new AppError("SESSION_NOT_FOUND", "Session not found", 404),
  SESSION_FORBIDDEN: () =>
    new AppError("SESSION_FORBIDDEN", "Access denied to this session", 403),
  COACH_NOT_FOUND: () =>
    new AppError("COACH_NOT_FOUND", "Coach not found", 404),
  INVALID_TOKEN: () =>
    new AppError("INVALID_TOKEN", "Invalid token", 401),
  EXPIRED_TOKEN: () =>
    new AppError("EXPIRED_TOKEN", "Token expired", 401),
  VALIDATION_ERROR: (message: string) =>
    new AppError("VALIDATION_ERROR", message, 400),
  DB_ERROR: (message: string) =>
    new AppError("DB_ERROR", `Database error: ${message}`, 500),
  OPENAI_ERROR: (message: string) =>
    new AppError("OPENAI_ERROR", `AI service error: ${message}`, 500),
};
