import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Create admin client for database operations
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function middleware(request: NextRequest) {
  try {
    console.log('=== Middleware Check ===');
    console.log('Path:', request.nextUrl.pathname);
    console.log('Method:', request.method);
    
    // For API routes, check Authorization header
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const authHeader = request.headers.get('authorization');
      console.log('Auth header:', authHeader ? 'Present' : 'Missing');
      
      if (!authHeader?.startsWith('Bearer ')) {
        console.log('Error: No bearer token');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const res = NextResponse.next();
      const supabase = createMiddlewareClient({ req: request, res });
      
      // Verify the token
      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.log('Error: Invalid token');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      console.log('Auth user:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      });

      // Get user role from users table using admin client
      const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.log('Error fetching user role:', userError);
        // If user doesn't exist in users table, check their metadata
        if (userError.code === 'PGRST116') {
          const role = user.user_metadata?.role;
          
          if (!role || !['admin', 'collaborator'].includes(role)) {
            console.log('Error: Invalid or missing role in metadata');
            return NextResponse.json({ 
              error: 'User role not properly configured. Please contact an administrator.' 
            }, { status: 403 });
          }

          // Create user in users table using admin client
          const { error: insertError } = await adminClient
            .from('users')
            .insert([{
              id: user.id,
              email: user.email,
              role: role,
              must_change_password: false
            }]);

          if (insertError) {
            console.log('Error creating user:', insertError);
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
          }

          // Retry getting user role
          const { data: newUserData, error: retryError } = await adminClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (retryError) {
            console.log('Error fetching user role after creation:', retryError);
            return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
          }

          console.log('User created and role verified:', newUserData?.role);
          
          // Check admin role for protected routes
          if (request.nextUrl.pathname.startsWith('/api/users')) {
            if (newUserData?.role !== 'admin') {
              console.log('Error: User is not admin');
              return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
          }

          return res;
        }
        return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
      }

      console.log('User role:', userData?.role);
      
      // Check admin role for protected routes
      if (request.nextUrl.pathname.startsWith('/api/users')) {
        if (userData?.role !== 'admin') {
          console.log('Error: User is not admin');
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      return res;
    }

    // For page routes, check session cookie
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    // If accessing admin routes, verify admin role
    if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
      if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Get user role from users table using admin client
      const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        console.log('Error fetching user role:', userError);
        // If user doesn't exist in users table, check their metadata
        if (userError.code === 'PGRST116') {
          const role = session.user.user_metadata?.role;
          
          if (!role || !['admin', 'collaborator'].includes(role)) {
            console.log('Error: Invalid or missing role in metadata');
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }

          // Create user in users table using admin client
          const { error: insertError } = await adminClient
            .from('users')
            .insert([{
              id: session.user.id,
              email: session.user.email,
              role: role,
              must_change_password: false
            }]);

          if (insertError) {
            console.log('Error creating user:', insertError);
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }

          // Retry getting user role
          const { data: newUserData, error: retryError } = await adminClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (retryError || newUserData?.role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        } else {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      if (userData?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  matcher: [
    '/api/users/:path*',
    '/dashboard/admin/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/users/:path*',
    '/profile/:path*',
    '/setting/:path*',
    '/events/:path*',
    '/login',
  ],
}; 