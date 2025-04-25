import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { User, SupabaseClient } from '@supabase/supabase-js';

interface AuthorizeOptions {
  allowedRoles?: Database['public']['Tables']['users']['Row']['role'][];
  allowSelf?: boolean;
  targetUserId?: string | null;
  supabaseClient?: SupabaseClient<Database>;
}

interface AuthorizeResult {
  user: User;
  isAdmin: boolean;
}

/**
 * Authorizes an API request based on user session, roles, and self-operation rules.
 * Intended for use within API Route Handlers.
 * @param request The NextRequest object.
 * @param options Authorization options (allowedRoles, allowSelf, targetUserId).
 * @returns Promise resolving to AuthorizeResult if authorized, or NextResponse if unauthorized/error.
 */
export async function authorizeRequest(
  request: NextRequest, 
  options: AuthorizeOptions = {}
): Promise<AuthorizeResult | NextResponse> {
  const { allowedRoles = [], allowSelf = false, targetUserId = null, supabaseClient } = options;

  const supabase = supabaseClient ?? createRouteHandlerClient<Database>({ cookies: () => cookies() });
  const supabaseAdmin = createAdminClient();

  // --- 1. Check Session ---
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('Authorization Error: Session retrieval failed.', sessionError);
    return NextResponse.json({ error: 'Unauthorized - Session error' }, { status: 401 });
  }
  if (!session?.user) {
    console.log('Authorization Info: No active session found.');
    return NextResponse.json({ error: 'Unauthorized - No active session' }, { status: 401 });
  }
  const requestingUser = session.user;
  const requestingUserId = requestingUser.id;

  // --- 2. Get Requesting User's Role (if needed for authorization) ---
  let userRole: Database['public']['Tables']['users']['Row']['role'] | null = null;
  let isAdmin = false;
  if (allowedRoles.length > 0 || (allowSelf && targetUserId !== requestingUserId)) {
      const { data: requestingUserData, error: roleError } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', requestingUserId)
          .single();

      if (roleError) {
          if (allowSelf && targetUserId === requestingUserId && roleError.code === 'PGRST116') {
              console.warn(`Authorization Warning: User ${requestingUserId} attempting self-operation not found in 'users' table. Proceeding without role check.`);
          } else {
              console.error(`Authorization Error: Failed to fetch role for user ${requestingUserId}.`, roleError);
              return NextResponse.json({ error: 'Internal Server Error - Failed to verify user role' }, { status: 500 });
          }
      } else if (requestingUserData) {
          userRole = requestingUserData.role;
          isAdmin = userRole === 'admin';
      } else {
          console.error(`Authorization Error: User data unexpectedly null for user ${requestingUserId} despite no roleError.`);
          return NextResponse.json({ error: 'Internal Server Error - Failed to verify user role' }, { status: 500 });
      }
  } else if (allowSelf && targetUserId === requestingUserId) {
      console.log(`Authorization Info: Performing self-operation for user ${requestingUserId}. Role check skipped.`);
  }

  // --- 3. Perform Authorization Check ---
  let authorized = false;

  if (isAdmin && allowedRoles.includes('admin')) {
      authorized = true;
      console.log(`Authorization Info: User ${requestingUserId} authorized via admin role.`);
  } else if (userRole && allowedRoles.includes(userRole)) {
    authorized = true;
    console.log(`Authorization Info: User ${requestingUserId} authorized via role '${userRole}'.`);
  }

  if (!authorized && allowSelf && requestingUserId === targetUserId) {
    authorized = true;
    console.log(`Authorization Info: User ${requestingUserId} authorized via self-operation.`);
  }

  if (!authorized) {
    console.warn(`Authorization Failed: User ${requestingUserId} (role: ${userRole ?? 'unknown/not fetched'}) attempt rejected. Allowed roles: [${allowedRoles.join(', ')}], Allow self: ${allowSelf}, Target User ID: ${targetUserId ?? 'N/A'}`);
    return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
  }

  // --- 4. Return User Info if Authorized ---
  if (authorized && !userRole && !allowedRoles.length && allowSelf && targetUserId === requestingUserId) {
      const { data: selfUserData, error: selfRoleError } = await supabaseAdmin
         .from('users')
         .select('role')
         .eq('id', requestingUserId)
         .single();
       if (!selfRoleError && selfUserData) {
           isAdmin = selfUserData.role === 'admin';
       }
  }
  
  return { user: requestingUser, isAdmin };
} 