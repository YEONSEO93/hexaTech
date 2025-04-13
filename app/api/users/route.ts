import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Get the user's token from the Authorization header
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all users
    console.log('Admin fetching users list');
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`Found ${data.length} users`);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Create or manage users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathname } = new URL(request.url);

    // Create collaborator (admin only)
    if (pathname.endsWith('/collaborator')) {
      const { email } = body;
      console.log('Creating new collaborator:', email);

      // Verify admin token
      const token = request.headers.get('Authorization')?.split('Bearer ')[1];
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: adminData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (roleError || adminData.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Create collaborator
      const tempPassword = generateTempPassword();
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true
      });

      if (createError) {
        console.error('Failed to create collaborator auth:', createError);
        return NextResponse.json({ error: 'Failed to create collaborator' }, { status: 500 });
      }

      // Add to users table
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          role: 'collaborator',
          must_change_password: true
        }]);

      if (userError) {
        console.error('Failed to set collaborator role:', userError);
        return NextResponse.json({ error: 'Failed to set collaborator role' }, { status: 500 });
      }

      console.log('Successfully created collaborator:', email);
      return NextResponse.json({
        message: 'Collaborator created successfully',
        email,
        tempPassword
      });
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
  } catch (error) {
    console.error('Request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}