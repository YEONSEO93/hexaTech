import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role from auth.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Admin route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 