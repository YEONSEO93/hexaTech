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
    console.log('=== Create Admin Request ===');
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Creating new admin:', email);

    // Verify super admin token using regular Supabase client for auth check
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is a super admin using metadata
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    console.log('Super admin role check:', userRole);
    
    if (userRole !== 'super_admin') {
      console.log('Error: User is not super admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create admin with role in metadata using admin client
    const tempPassword = generateTempPassword();
    console.log('Generated temporary password');
    
    // Create auth user first
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    });

    if (createError) {
      console.error('Failed to create admin auth:', createError);
      return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
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
        role: 'admin',
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

    console.log('Successfully created admin:', email);
    return NextResponse.json({
      message: 'Admin created successfully',
      email,
      tempPassword,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'admin'
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
    console.log('=== Get Admins Request ===');
    
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError);
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
    }

    const userRole = userData?.role;
    console.log('User role check:', {
      userId: user.id,
      userEmail: user.email,
      userRole: userRole,
      metadata: user.user_metadata
    });
    
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      console.log('Error: User is not admin or super_admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all admins from users table
    const { data: admins, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');

    if (fetchError) {
      console.error('Failed to fetch admins:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 