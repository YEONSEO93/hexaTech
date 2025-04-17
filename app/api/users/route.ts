import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

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
export async function GET() {
  try {
    console.log('=== List Users Request ===');
    
    const supabase = createAdminClient();
    
    // Fetch all users
    console.log('Fetching users list...');
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    // Add debug logging
    console.log('Query result:', {
      hasData: !!data,
      count: data?.length || 0,
      users: data
    });

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
      
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      console.log('Creating new collaborator:', email);
      const supabase = createAdminClient();

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        );
      }

      // Create collaborator with role in metadata
      const tempPassword = generateTempPassword();
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
        return NextResponse.json(
          { error: 'Failed to create collaborator' },
          { status: 500 }
        );
      }

      // Add to users table for additional data
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
        // Clean up auth user if database insert fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        );
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