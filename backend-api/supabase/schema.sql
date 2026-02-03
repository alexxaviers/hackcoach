-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Users table is managed by Supabase Auth (auth.users)

-- Chats table
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User context table (for questionnaire answers)
create table if not exists user_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid references chats(id) on delete cascade,
  context_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure required columns exist if tables were previously created
alter table messages add column if not exists chat_id uuid references chats(id) on delete cascade;
alter table user_context add column if not exists chat_id uuid references chats(id) on delete cascade;

-- Create indexes
create index if not exists chats_user_id_idx on chats(user_id);
create index if not exists messages_chat_id_idx on messages(chat_id);
create index if not exists user_context_user_id_idx on user_context(user_id);
create index if not exists user_context_chat_id_idx on user_context(chat_id);

-- Enable RLS (Row Level Security)
alter table chats enable row level security;
alter table messages enable row level security;
alter table user_context enable row level security;
-- Note: auth.users has its own security model; we do not enable RLS here.

-- RLS Policies for chats
create policy "Users can view their own chats" on chats
  for select using (auth.uid() = user_id);

create policy "Users can create chats" on chats
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own chats" on chats
  for update using (auth.uid() = user_id);

create policy "Users can delete their own chats" on chats
  for delete using (auth.uid() = user_id);

-- RLS Policies for messages
create policy "Users can view messages from their chats" on messages
  for select using (
    chat_id in (
      select id from chats where user_id = auth.uid()
    )
  );

create policy "Users can insert messages into their chats" on messages
  for insert with check (
    chat_id in (
      select id from chats where user_id = auth.uid()
    )
  );

-- RLS Policies for user_context
create policy "Users can view their own context" on user_context
  for select using (auth.uid() = user_id);

create policy "Users can create context" on user_context
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own context" on user_context
  for update using (auth.uid() = user_id);

-- If you still want a public users table, create it separately with uuid id
-- and backfill from auth.users, then update FKs accordingly.
