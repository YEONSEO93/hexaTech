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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Inviting collaborator with email:', email);

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
    const { data: { user: requestingUser }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !requestingUser) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = requestingUser.user_metadata?.role;
    console.log('Admin role check:', userRole);
    
    if (userRole !== 'admin') {
      console.log('Error: User is not admin');
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    // 1. Invite User via Email
    console.log(`Attempting to invite user: ${email}`);
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: { role: 'collaborator' },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/set-password`
      }
    );

    if (inviteError) {
      console.error('Failed to invite collaborator:', inviteError);
      if (inviteError.message.includes('already registered') || inviteError.message.includes('registered user')) {
         return NextResponse.json({ error: 'Email already registered or invited' }, { status: 409 });
      }
      if (inviteError.message.includes('For security purposes, you can only send 1 invitation per hour')) {
         return NextResponse.json({ error: 'Invitation limit reached. Please try again later.'}, { status: 429 });
      }
      return NextResponse.json({ error: 'Failed to invite collaborator' }, { status: 500 });
    }

    if (!inviteData || !inviteData.user) {
        console.error('No user data returned from inviteUserByEmail');
        return NextResponse.json({ error: 'Failed to get user data after invitation' }, { status: 500 });
    }
    const invitedUser = inviteData.user;
    console.log('User invited successfully:', invitedUser.id, invitedUser.email);

    // 2. Add user details to the 'users' table
    console.log(`Inserting invited user details into users table for ${invitedUser.id}`);
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ 
        id: invitedUser.id, 
        email: invitedUser.email,
        role: 'collaborator',
        must_change_password: true 
      }]);

    if (insertError) {
      console.error('Failed to insert invited user into users table:', insertError);
      return NextResponse.json({ error: 'Invitation sent, but failed to save user details.' }, { status: 500 });
    }
    console.log('Invited user details saved to users table.');

    // 3. No need to trigger resetPasswordForEmail anymore, invite handles it.

    // Respond to the admin
    return NextResponse.json({
      message: 'Collaborator invited successfully. They will receive an email to set their password.',
      user: {
        id: invitedUser.id,
        email: invitedUser.email,
        role: 'collaborator'
      }
    });

  } catch (error) {
    console.error('POST Request failed:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== Get Collaborator List Request ===');

    // Verify admin token using helper client
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user making the request
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error verifying token:', authError);
      return NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });
    }

    // IMPORTANT: Check the requesting user's role from the 'users' table using the admin client
    const { data: requestingUserData, error: roleError } = await supabase // Use the admin client (service role)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError) {
      console.error('Error fetching requesting user role:', roleError);
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }
    
    if (requestingUserData?.role !== 'admin') {
      console.log(`User ${user.id} is not an admin, role: ${requestingUserData?.role}`);
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    console.log(`Admin user ${user.id} verified. Fetching collaborators...`);

    // Get all collaborators from users table using the admin client
    const { data: collaborators, error: fetchError } = await supabase
      .from('users')
      .select('*') // Select all columns or specify needed ones
      .eq('role', 'collaborator');

    if (fetchError) {
      console.error('Failed to fetch collaborators:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
    }

    console.log(`Successfully fetched ${collaborators.length} collaborators.`);
    return NextResponse.json({ collaborators });

  } catch (error) {
    console.error('GET Request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 