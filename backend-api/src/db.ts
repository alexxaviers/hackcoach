import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Service client with admin privileges (for server-side operations)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);
