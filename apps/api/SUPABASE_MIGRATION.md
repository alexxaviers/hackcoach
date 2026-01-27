# Supabase Migration Guide

This backend has been migrated from Prisma to Supabase.

## Setup

1. Create a Supabase project at https://supabase.com
2. Get your project URL and service role key from the Supabase dashboard
3. Run the SQL migration file in your Supabase SQL editor:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/migration.sql`
   - Execute the migration

## Environment Variables

Update your `.env` file with Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The service role key has admin privileges and bypasses Row Level Security (RLS). Keep it secure and never expose it to client-side code.

## Database Schema

The migration creates the following tables:
- `users` - User accounts and authentication
- `user_context` - Pro user context/memory (one-to-one with users)
- `sessions` - Chat sessions with coaches
- `messages` - Messages within sessions
- `entitlement_events` - RevenueCat webhook events
- `user_daily_usage` - Daily usage tracking for free tier limits

All tables use snake_case column names (PostgreSQL convention).

## Row Level Security

RLS is enabled on all tables with permissive policies for the service role. In production, you may want to add more restrictive policies based on your security requirements.

## Differences from Prisma

- Column names are snake_case instead of camelCase
- No ORM - using Supabase client directly
- No migrations - SQL is managed directly in Supabase
- Service role key is used instead of connection string

## Testing

After running the migration, test the API endpoints to ensure everything works correctly.
