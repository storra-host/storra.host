import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

const globalForSupabase = globalThis as unknown as {
  supabase?: SupabaseClient;
};

export function getSupabase(): SupabaseClient {
  if (globalForSupabase.supabase) return globalForSupabase.supabase;
  const e = getEnv();
  const supabase = createClient(
    e.NEXT_PUBLIC_SUPABASE_URL,
    e.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  globalForSupabase.supabase = supabase;
  return supabase;
}
