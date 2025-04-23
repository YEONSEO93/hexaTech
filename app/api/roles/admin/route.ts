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

    // Verify admin token
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an admin
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role in users table
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create collaborator with role in metadata using admin client
    const tempPassword = generateTempPassword();
    
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

    // Add to users table for additional data
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email,
        role: 'collaborator',
        must_change_password: true
      }]);

    if (insertError) {
      console.error('Failed to insert into users table:', insertError);
      return NextResponse.json({ error: 'Failed to create collaborator' }, { status: 500 });
    }

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

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an admin
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role in users table
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all collaborators from users table
    const { data: collaborators, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'collaborator');

    if (fetchError) {
      console.error('Failed to fetch collaborators:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
    }

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error('Request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 