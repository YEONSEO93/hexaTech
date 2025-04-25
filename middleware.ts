import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

const ROUTES = {
  AUTH: ['/login', '/set-password'],
  ADMIN_ONLY: ['/users/create'],
  ADMIN_VIEWER: ['/dashboard', '/users', '/events']
} as const;

const ROLES = {
  ADMIN: 'admin',
  COLLABORATOR: 'collaborator',
  VIEWER: 'viewer'
} as const;

const restrictedMethods = ['POST', 'PUT', 'DELETE'];

const isAdminOrViewer = (role: string) => role === ROLES.ADMIN || role === ROLES.VIEWER;

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

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req: request, res });
  const { pathname } = request.nextUrl;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      if (!isPathInRoutes(pathname, ROUTES.AUTH)) {
        return createRedirectResponse(request, '/login', { error: 'session_error' });
      }
      return res;
    }

    if (pathname.startsWith('/api/')) {
      if (!session) {
        return createErrorResponse('Unauthorized');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData) {
        return createErrorResponse('Role fetch failed', 403);
      }

      if (restrictedMethods.includes(request.method) && userData.role === ROLES.VIEWER) {
        return createErrorResponse('Viewers are not allowed to perform this action', 403);
      }

      return res;
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
      if (isAdminOrViewer(userRole)) {
        return createRedirectResponse(request, '/dashboard');
      }
      return createRedirectResponse(request, '/events');
    }

    if (isPathInRoutes(pathname, ROUTES.ADMIN_ONLY) && userRole !== ROLES.ADMIN) {
      return createRedirectResponse(request, '/events');
    }

    if (isPathInRoutes(pathname, ROUTES.ADMIN_VIEWER) && !isAdminOrViewer(userRole)) {
      return createRedirectResponse(request, '/events');
    }

    return res;

  } catch (error) {
    console.error('Middleware exception:', error);
    if (!isPathInRoutes(pathname, ROUTES.AUTH)) {
      return createRedirectResponse(request, '/login', { error: 'middleware_exception' });
    }
    return res;
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
