import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

// Helper function to add CORS headers
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      ));
    }

    // Sign in with Supabase using email (username)
    console.log('Attempting to sign in with:', { email: username });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    if (error) {
      console.error('Sign in error:', error.message);
      console.error('Error details:', error);
      
      // Check for rate limit error
      if (error.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Too many login attempts. Please wait a few minutes before trying again." 
          }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        );
      }

      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    console.log('Sign in successful:', { userId: data.user?.id });

    if (!data?.user) {
      return addCorsHeaders(NextResponse.json(
        { error: 'No user data returned' },
        { status: 401 }
      ));
    }

    // Get user role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (roleError) {
      console.error('Role error:', roleError.message);
      return addCorsHeaders(NextResponse.json(
        { error: 'Failed to get user role' },
        { status: 500 }
      ));
    }

    if (!userData) {
      return addCorsHeaders(NextResponse.json(
        { error: 'User role not found' },
        { status: 404 }
      ));
    }

    // Return the session and user data
    return addCorsHeaders(NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userData.role,
      },
      session: data.session,
    }));
  } catch (error) {
    console.error('Auth error:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    
    if (!token) {
      return addCorsHeaders(NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      ));
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      ));
    }

    // Get user role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError) {
      console.error('Role error:', roleError.message);
      return addCorsHeaders(NextResponse.json(
        { error: 'Failed to get user role' },
        { status: 500 }
      ));
    }

    return addCorsHeaders(NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: userData?.role,
      },
    }));
  } catch (error) {
    console.error('Auth error:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
} 