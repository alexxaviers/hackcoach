# Backend Implementation Plan - HackCoach

## Current State
- **Frontend**: React Native/Expo chat app with:
  - Multiple chat sessions
  - OpenAI chat completions integration
  - RevenueCat subscription system (Pro tier for multi-chat)
  - Questionnaire onboarding
  - Chat history and context management
  
- **Current Backend** (Python Flask POC):
  - `POST /chat` - Proxies to OpenAI with messages
  - No persistence or user data storage

---

## What We Need to Build

### 1. **Database Schema (Supabase PostgreSQL)**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User context/preferences (from questionnaire)
CREATE TABLE user_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  context_data JSONB NOT NULL, -- stores questionnaire answers
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS policies for security
```

### 2. **Required Supabase Features**

- ✅ PostgreSQL database (as above)
- ✅ JWT authentication (built-in)
- ✅ Row-Level Security (RLS) policies
- ✅ Real-time subscriptions (optional, for live chat)

### 3. **Backend API Endpoints (Node.js + Express recommended over Python)**

#### Auth
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token
- `POST /auth/refresh` - Refresh JWT token

#### Chats
- `GET /chats` - Get all user's chats
- `POST /chats` - Create new chat
- `PUT /chats/:chatId` - Rename chat
- `DELETE /chats/:chatId` - Delete chat

#### Messages
- `GET /chats/:chatId/messages` - Get messages for a chat
- `POST /chats/:chatId/messages` - Send new message (calls OpenAI, saves response)

#### User Context
- `GET /user/context` - Get user's questionnaire answers
- `POST /user/context` - Save questionnaire answers

#### Health
- `GET /health` - Health check

### 4. **Required Environment Variables**

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key  # Server-only

# OpenAI
OPENAI_API_KEY=sk-...

# JWT (optional, Supabase handles this)
JWT_SECRET=your-secret

# Server
PORT=3000
NODE_ENV=production
```

### 5. **Frontend Changes Needed**

The frontend currently:
- Uses local state only (no persistence)
- Has no user authentication
- Calls `/chat` endpoint directly

Frontend will need to:
- ✅ Add login/signup screen
- ✅ Store JWT token securely (use `expo-secure-store`)
- ✅ Add auth headers to all API calls
- ✅ Sync chat list from backend
- ✅ Load/save message history from backend

---

## Recommended Tech Stack

**Backend**:
- **Framework**: Express.js (Node.js) - easier to integrate with Supabase
- **Database Client**: `@supabase/supabase-js` (official SDK)
- **Auth**: Supabase Auth (JWT)
- **Language**: TypeScript (you already have experience from `mvp-backend/`)

Alternative: Stick with Python Flask but use `supabase-py` library

---

## Implementation Order

1. ✅ Set up Supabase project and get credentials
2. Create database schema (migrations)
3. Set up backend project structure
4. Implement auth endpoints
5. Implement chat CRUD endpoints
6. Integrate OpenAI API proxying with message persistence
7. Test with frontend
8. Update frontend to use auth + persist data

---

## Next Steps

1. **Create Supabase project** → Get `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
2. **Decide on backend language**: Continue with Python Flask (simpler for simple apps) or switch to Node.js/Express (better Supabase integration)
3. **Start building** the auth system first

Want me to set up the initial backend project structure?
