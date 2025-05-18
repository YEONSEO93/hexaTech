import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from '@/types/supabase';

/**
 * Creates a Supabase client suitable for Client Components,
 * using the `@supabase/auth-helpers-nextjs` package.
 */

export function createSupabaseClientComponentClient() {
  return createClientComponentClient<Database>();
}
