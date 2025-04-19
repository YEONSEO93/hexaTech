import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/',
    '/login',
    '/set-password',
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
    
    const pathname = request.nextUrl.pathname;

    // Handle API routes
    if (pathname.startsWith('/api/')) {
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return res;
    }

    // Handle page routes
    if (!session) {
      // Allow access to login and set-password pages without session
      if (pathname === '/login' || pathname === '/set-password') {
        return res;
      }
      // Redirect all other pages to login if no session
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      console.error('Middleware: Session exists but failed to get user data', userError);
      // Clear potentially invalid session? Might be too aggressive.
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const role = userData.role;

    // Handle role-based routing
    if (pathname === '/') {
      // Redirect root to role-specific dashboard
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    if (pathname === '/login') {
      // Redirect authenticated users away from login to their dashboard
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    if (pathname.startsWith('/dashboard/admin')) {
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/collaborator', request.url));
      }
    } else if (pathname.startsWith('/dashboard/collaborator')) {
      if (role !== 'collaborator') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
} 