import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/api/:path*',
  ],
};

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    // Check session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Handle API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return res;
    }

    // Handle page routes
    if (!session) {
      // Allow access to login page
      if (request.nextUrl.pathname === '/login') {
        return res;
      }
      // Redirect to login for all other pages
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const role = userData.role;

    const dashboardRedirects = ['/', '/login', '/dashboard']

    // Handle role-based routing
    if (dashboardRedirects.includes(request.nextUrl.pathname)) {
      // Redirect root to role-specific dashboard
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/collaborator', request.url));
      }
    } else if (request.nextUrl.pathname.startsWith('/dashboard/collaborator')) {
      if (role !== 'collaborator') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // return NextResponse.redirect(new URL('/login', request.url));
    return NextResponse.json({ error: 'Sorry, something went wrong' }, { status: 500 });
  }
} 