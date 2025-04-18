import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

type UserRole = 'admin' | 'collaborator';

export async function GET(request: NextRequest) {
  try {
    // Extract role from URL path
    const role = request.nextUrl.pathname.split('/').pop() as UserRole;
    
    // Initialize Supabase client
    const res = NextResponse.next();
    const supabase = createMiddlewareClient<Database>({ req: request, res });

    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role and check password change requirement
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, must_change_password')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check role access
    if (role === 'admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (role === 'collaborator' && user.role !== 'collaborator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check password change requirement
    if (user.must_change_password) {
      return NextResponse.json(
        { error: 'Password change required' },
        { status: 403 }
      );
    }

    // Return role-specific response
    if (role === 'admin') {
      return NextResponse.json({
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: user.role
        }
      });
    } else {
      // For collaborator, return full user data
      const { data: fullUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      return NextResponse.json({ user: fullUser });
    }
  } catch (error) {
    console.error(`Error in auth route:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 