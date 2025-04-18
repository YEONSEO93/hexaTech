import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to generate a secure temporary password
function generateTempPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Create Collaborator Request ===');
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Creating new collaborator:', email);

    // Verify admin token using regular Supabase client for auth check
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an admin using metadata
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    console.log('Admin role check:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Error: User is not admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create collaborator with role in metadata using admin client
    const tempPassword = generateTempPassword();
    console.log('Generated temporary password');
    
    // Create auth user first
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: 'collaborator'
      }
    });

    if (createError) {
      console.error('Failed to create collaborator auth:', createError);
      return NextResponse.json({ error: 'Failed to create collaborator' }, { status: 500 });
    }

    console.log('Auth user created:', {
      id: authData.user.id,
      email: authData.user.email,
      role: authData.user.user_metadata.role
    });

    // Add to users table for additional data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email,
        role: 'collaborator',
        must_change_password: true
      }])
      .select()
      .single();

    if (userError) {
      console.error('Failed to insert into users table:', userError);
      // Don't return error as auth user is created
      console.log('User table insert failed but auth user created successfully');
    } else {
      console.log('User record created:', userData);
    }

    console.log('Successfully created collaborator:', email);
    return NextResponse.json({
      message: 'Collaborator created successfully',
      email,
      tempPassword,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'collaborator'
      }
    });
  } catch (error) {
    console.error('Request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 