import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  // If no session and trying to access protected routes
  if (!session && (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/users') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/setting') ||
    request.nextUrl.pathname.startsWith('/events')
  )) {
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If session exists and trying to access login page
  if (session && request.nextUrl.pathname === '/login') {
    // Get user role from session metadata
    const role = session.user.user_metadata.role || 'user';
    console.log('Session role:', role);
    
    // Redirect based on role
    if (role === 'admin') {
      const redirectUrl = new URL('/dashboard/admin', request.url);
      console.log('Redirecting admin to:', redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    } else {
      const redirectUrl = new URL('/dashboard', request.url);
      console.log('Redirecting user to:', redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Set cache control headers
  res.headers.set('Cache-Control', 'no-store, must-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/users/:path*',
    '/profile/:path*',
    '/setting/:path*',
    '/events/:path*',
    '/login',
  ],
}; 