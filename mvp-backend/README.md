# MVP Backend - AI Coaching App POC

A backend-only proof-of-concept for a mobile AI coaching app with simple auth, survey intake, and AI-powered coaching sessions.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify
- **Database**: Supabase PostgreSQL
- **Validation**: Zod
- **Auth**: JWT (HS256)
- **Password**: Argon2
- **AI**: OpenAI API (gpt-4o-mini)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Then fill in your credentials:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key from Supabase
- `OPENAI_API_KEY`: OpenAI API key
- `JWT_SECRET`: Any random string (e.g., `openssl rand -base64 32`)

### 3. Set Up Supabase Database

1. Create a new Supabase project or use existing
2. In Supabase SQL Editor, run the full contents of `supabase/schema.sql`
3. Then run `supabase/seed.sql` to insert coaches

### 4. Run Locally

```bash
npm run dev
```

Server starts at `http://localhost:8080`

### 5. Type Check & Build

```bash
npm run typecheck
npm run build
npm start
```

## API Endpoints

### Health
```bash
curl http://localhost:8080/health
```

### Auth - Register
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "securepass123"
  }'
```

Response:
```json
{
  "data": {
    "userId": "uuid-here",
    "username": "john"
  }
}
```

### Auth - Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "securepass123"
  }'
```

Response:
```json
{
  "data": {
    "token": "jwt-token-here",
    "userId": "uuid-here",
    "username": "john"
  }
}
```

### Get Coaches
```bash
curl http://localhost:8080/coaches
```

### Get Coach Details
```bash
curl http://localhost:8080/coaches/focus
```

### Submit Survey (Protected)
```bash
curl -X POST http://localhost:8080/survey \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Builder",
    "primaryGoal": "Ship a project",
    "stuckOn": "Starting",
    "tone": "neutral",
    "tools": ["Twitter", "ProductHunt"]
  }'
```

### Get User Context (Protected)
```bash
curl http://localhost:8080/me/context \
  -H "Authorization: Bearer <token>"
```

### Create Chat Session (Protected)
```bash
curl -X POST http://localhost:8080/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "coachId": "focus",
    "title": "Project Planning"
  }'
```

### Get Sessions (Protected)
```bash
curl http://localhost:8080/sessions \
  -H "Authorization: Bearer <token>"
```

### Get Session Details (Protected)
```bash
curl http://localhost:8080/sessions/<sessionId> \
  -H "Authorization: Bearer <token>"
```

### Send Message to Coach (Protected)
```bash
curl -X POST http://localhost:8080/sessions/<sessionId>/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "How do I start my project?"
  }'
```

Response:
```json
{
  "data": {
    "assistant": {
      "content": "Start by defining your MVP scope..."
    }
  }
}
```

## Architecture Notes

- **Stateless JWT auth**: No sessions stored, token contains userId
- **Service role key**: Used for all DB operations for simplicity
- **Protected routes**: Check `Authorization: Bearer <token>` header
- **Error handling**: Consistent `{ error: { code, message } }` responses
- **Context-aware coaching**: Coach prompts include user's role, goals, tools, and preferences

## Deployment Notes

- Set `JWT_SECRET` to a secure random value in production
- Use environment variables for all secrets
- Configure CORS as needed
- Consider rate limiting for production
- Monitor OpenAI API costs
