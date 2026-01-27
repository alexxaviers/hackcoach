-- Supabase migration file
-- Run this in your Supabase SQL editor to create the schema

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  refresh_token_hash TEXT,
  revenuecat_id TEXT UNIQUE,
  entitlement TEXT DEFAULT 'FREE',
  pro_expires_at TIMESTAMPTZ
);

-- User context table
CREATE TABLE IF NOT EXISTS user_context (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  tools TEXT NOT NULL,
  goals TEXT NOT NULL,
  prefs TEXT NOT NULL
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entitlement events table
CREATE TABLE IF NOT EXISTS entitlement_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- User daily usage table
CREATE TABLE IF NOT EXISTS user_daily_usage (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  assistant_replies INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_revenuecat_id ON users(revenuecat_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_usage_user_date ON user_daily_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entitlement_events_user_id ON entitlement_events(user_id);

-- Enable Row Level Security (RLS) - optional, adjust based on your security needs
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (adjust as needed)
-- These policies allow service role to access all data
-- In production, you may want more restrictive policies
CREATE POLICY "Service role can access all users" ON users
  FOR ALL USING (true);

CREATE POLICY "Service role can access all user_context" ON user_context
  FOR ALL USING (true);

CREATE POLICY "Service role can access all sessions" ON sessions
  FOR ALL USING (true);

CREATE POLICY "Service role can access all messages" ON messages
  FOR ALL USING (true);

CREATE POLICY "Service role can access all entitlement_events" ON entitlement_events
  FOR ALL USING (true);

CREATE POLICY "Service role can access all user_daily_usage" ON user_daily_usage
  FOR ALL USING (true);
