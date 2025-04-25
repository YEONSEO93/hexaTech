import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

const ROUTES = {
  AUTH: ['/login', '/set-password'],
  ADMIN_ONLY: ['/dashboard'],
  ADMIN_COLLABORATOR: ['/users', '/events']
} as const;

const ROLES = {
  ADMIN: 'admin',
  COLLABORATOR: 'collaborator'
} as const;

const isPathInRoutes = (pathname: string, routes: readonly string[]) => 
  routes.some(route => pathname.startsWith(route));

const createRedirectResponse = (request: NextRequest, path: string, params?: Record<string, string>) => {
  const url = new URL(path, request.url);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return NextResponse.redirect(url);
};

const createErrorResponse = (message: string, status: number = 401) => 
  NextResponse.json({ error: message }, { status });

const getRoleBasedRedirect = (userRole: string) => 
  userRole === ROLES.ADMIN ? '/dashboard' : '/events';

// Main middleware function
export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req: request, res });
  const { pathname } = request.nextUrl;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return createRedirectResponse(request, '/login', { error: 'session_error' });
    }

    if (pathname.startsWith('/api/')) {
      return session ? res : createErrorResponse('Unauthorized');
    }

    if (!session) {
      if (isPathInRoutes(pathname, ROUTES.AUTH)) {
        return res;
      }
      return createRedirectResponse(request, '/login', { redirectedFrom: pathname });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return createRedirectResponse(request, '/login', { error: 'role_fetch_failed' });
    }

    const userRole = userData.role;

    if (isPathInRoutes(pathname, ROUTES.AUTH)) {
      return createRedirectResponse(request, getRoleBasedRedirect(userRole));
    }

    if (isPathInRoutes(pathname, ROUTES.ADMIN_ONLY) && userRole !== ROLES.ADMIN) {
      return createRedirectResponse(request, '/events');
    }

    if (isPathInRoutes(pathname, ROUTES.ADMIN_COLLABORATOR) && 
        userRole !== ROLES.ADMIN && 
        userRole !== ROLES.COLLABORATOR) {
      return createRedirectResponse(request, '/login', { error: 'access_denied' });
    }

    return res;

  } catch {
    return createRedirectResponse(request, '/login', { error: 'middleware_exception' });
  }
}

export const config = {
  matcher: [
    '/login',
    '/set-password',
    '/dashboard/:path*',
    '/users/:path*',
    '/events/:path*',
    '/api/:path*',
  ],
};
