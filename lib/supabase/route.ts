import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from '@/types/supabase';
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client suitable for Route Handlers (API routes),
 * using the `@supabase/auth-helpers-nextjs` package.
 */

export function createSupabaseRouteHandlerClient() {
  const cookieStore = cookies()
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore })
}
