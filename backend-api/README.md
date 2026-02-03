# HackCoach Backend API

Node.js/Express backend with Supabase and OpenAI integration.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend-api
   npm install
   ```

2. **Create `.env.local` and configure:**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Public anon key from Supabase
   - `SUPABASE_SERVICE_KEY` - Service role key (keep this secret!)
   - `OPENAI_API_KEY` - Your OpenAI API key

3. **Run in development:**
   ```bash
   npm run dev
   ```
   
   Server runs at `http://localhost:3000`

## API Endpoints

### Health
- `GET /health` - Health check

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token
- `POST /auth/refresh` - Refresh JWT token

### Chats
- `GET /chats` - Get all user's chats
- `POST /chats` - Create new chat
- `PUT /chats/:chatId` - Rename chat
- `DELETE /chats/:chatId` - Delete chat

### Messages
- `GET /chats/:chatId/messages` - Get messages for a chat
- `POST /chats/:chatId/messages/send` - Send message (calls OpenAI + saves)

### User Context
- `GET /user/context` - Get user's questionnaire answers
- `POST /user/context` - Save user context

## Authentication

All protected endpoints require an `Authorization` header with a Bearer token:

```
Authorization: Bearer <jwt_token>
```

Get tokens from the `/auth/login` or `/auth/signup` endpoints.

## Database Setup

You need to create these tables in Supabase. See `supabase/schema.sql` for the full schema.

## Building

```bash
npm run build
npm start
```

The compiled output goes to `dist/`.
