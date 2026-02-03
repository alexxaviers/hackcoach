# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in (or create account)
3. Click **"New Project"**
4. Fill in:
   - **Name**: `hackcoach`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Pick closest to you
5. Click **"Create New Project"** and wait 1-2 minutes

## Step 2: Get Your Credentials

Once your project is ready:

1. Go to **Settings → API** (left sidebar)
2. Copy these values to your `.env.local`:

```
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJhbG...  (the one under "anon (public)")
SUPABASE_SERVICE_KEY=eyJhbG...  (the one under "service_role (secret)")
```

⚠️ **IMPORTANT**: Keep `SUPABASE_SERVICE_KEY` secret! Never commit it or share publicly.

## Step 3: Create Database Tables

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `backend-api/supabase/schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** button

You should see 10-15 green checkmarks ✓

## Step 4: Verify Tables Were Created

Go to **Table Editor** and you should see:
- `users`
- `chats`
- `messages`
- `user_context`

If you see these, you're ready to go! 🎉

## Troubleshooting

**Error: "relation already exists"**
- Your tables might already exist. That's fine, just run the next steps.

**Missing SUPABASE_SERVICE_KEY**
- Go to Settings → API → scroll down to "service_role" and copy that key

**RLS policies not working**
- Make sure RLS is enabled on each table (Table Editor → select table → "Policies" tab)

## Next Steps

Once you have credentials in `.env.local`:

```bash
cd backend-api
npm install
npm run dev
```

Your API will run at `http://localhost:3000`
