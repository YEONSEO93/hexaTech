import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export function createSupabaseAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }
  if (!process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!,
    /**
     * Admin client auth options:
     * - persistSession: false - Don't store admin sessions in storage (security risk)
     * - autoRefreshToken: false - Don't auto-refresh tokens (not needed for server-side admin operations)
     * - detectSessionInUrl: false - No need to check URL for tokens in server context
     */
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
