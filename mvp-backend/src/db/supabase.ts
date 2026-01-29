import { createClient } from "@supabase/supabase-js";
import type { Env } from "../env.js";

export function initSupabase(env: Env) {
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return supabase;
}
