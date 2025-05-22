import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

const ROUTES = {
  //remove set-password from the list of auth routes, as following invite link will log user in but they should not be redirected to home page yet 
  AUTH: ['/login'],
  ADMIN_ONLY: ['/users/create'],
  ADMIN_VIEWER: ['/dashboard', '/users']
} as const;

const ROLES = {
  ADMIN: 'admin',
  COLLABORATOR: 'collaborator',
  VIEWER: 'viewer'
} as const;

const restrictedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

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
    //To check if user is logged in, we can use getUser() method directly, as it only returns a user if there is a valid session token. This way, we can also check the role with user.role without a database query

    //Also refer to Supabase Auth docs (Hook up middleware section): https://supabase.com/docs/guides/auth/server-side/nextjs 
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      if (!isPathInRoutes(pathname, ROUTES.AUTH)) {
        return createRedirectResponse(request, '/login');
      }
      return res;
    }

    const userRole = user.user_metadata.role;

    if (!userRole) {
      return createErrorResponse("Role not found", 404);
    }

    /* -----------Add check for page routes ---------*/

    //Add check to handle root URL redirect
    if (pathname === "/" || isPathInRoutes(pathname, ROUTES.AUTH)) {
      if (isAdminOrViewer(userRole)) {
        return createRedirectResponse(request, '/dashboard');
      }
      return createRedirectResponse(request, '/events');
    }

    if (pathname.startsWith('/users/')) {
      const pathParts = pathname.split('/');
      const userIdFromPath = pathParts[2];
      if (userIdFromPath === user.id) {
        return res;
      }
    }

    if (isPathInRoutes(pathname, ROUTES.ADMIN_ONLY) && userRole !== ROLES.ADMIN) {
      //Let it go to the root and redirect based on our role check above (user roles could be either Viewer or Collaborator)
      return createRedirectResponse(request, '/');
    }

    if (isPathInRoutes(pathname, ROUTES.ADMIN_VIEWER) && !isAdminOrViewer(userRole)) {
      return createRedirectResponse(request, '/events');
    }


    /* -----------Add check for API routes ---------*/
    if (pathname.startsWith('/api/')) {
    
      // Block viewers from any restricted method across all APIs
      if (restrictedMethods.includes(request.method) && userRole === ROLES.VIEWER) {
        return createErrorResponse('Viewers are not allowed to perform this action', 403);
      }
      
      // Block collaborators from accessing non-events APIs
      if (!pathname.startsWith('/api/events') && userRole === ROLES.COLLABORATOR) {
        return createErrorResponse('Collaborators can only access events API', 403);
      }
      
      // Admin has full access, so we don't need additional checks
      return res;
    }

    return res;

  } catch (error) {
    console.error('Middleware exception:', error);
    //This is a general error handler, so we can return an error code to prevent infinite redirects if the cause of the error is not related to path access 
    return createErrorResponse('Something went wrong', 500)
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/set-password',
    '/dashboard/:path*',
    '/users/:path*',
    '/events/:path*',
    '/api/:path*',
  ],
};
