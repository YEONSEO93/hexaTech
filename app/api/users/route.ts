import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/supabase';
import { createAdminClient } from '@/lib/supabase/client';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { authorizeRequest } from '@/lib/api/authUtils';
import { z } from 'zod';

const inviteUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required and cannot be empty" }),
  email: z.string().email({ message: "Invalid email address provided" }),
  role: z.enum(['admin', 'collaborator', 'viewer'], {
    errorMap: () => ({ message: "Invalid role provided. Must be 'admin', 'collaborator', or 'viewer'." }) 
  }),
  company: z.string().min(1, { message: "Company is required and cannot be empty" }),
  profilePhoto: z.string().optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }).optional()
});

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  const supabaseAdmin = createAdminClient();

  try {
    const authResult = await authorizeRequest(request, { 
      allowedRoles: ['admin', 'viewer'],
      supabaseClient: supabase
    });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { data: users, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, company, company_id, created_at, profile_photo');

    if (fetchError) {
        console.error("Error fetching users:", fetchError);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Request failed in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  try {
    const authResult = await authorizeRequest(request, { 
        allowedRoles: ['admin'],
        supabaseClient: supabase
    });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    let parsedBody;
    try {
        const body = await request.json();
        const validationResult = inviteUserSchema.safeParse(body);

        if (!validationResult.success) {
            const errors = validationResult.error.flatten().fieldErrors;
            const firstError = Object.values(errors).flat()[0] || 'Invalid input data.';
            console.warn("User input validation failed:", errors);
            return NextResponse.json({ error: firstError }, { status: 400 });
        }
        parsedBody = validationResult.data;
    } catch (parseError) {
      console.error("POST /api/users: JSON Parsing Error", parseError);
      return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 });
    }

    const { name, email, role, company, profilePhoto, password } = parsedBody;

    const { data: existingCompany, error: findError } = await supabaseAdmin
      .from('company')
      .select('id')
      .eq('name', company)
      .single();

    let companyId;
    if (findError) {
      const { data: newCompany, error: createError } = await supabaseAdmin
        .from('company')
        .insert({ name: company })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create company:', createError);
        return NextResponse.json({ error: 'Failed to create company.' }, { status: 500 });
      }

      companyId = Number(newCompany.id);
    } else {
      companyId = Number(existingCompany.id);
    }

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { 
          role: role,
          email_confirm: true
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/set-password`
      }
    );

    if (inviteError) {
      console.error('Failed to invite user:', inviteError);
      if (inviteError.message.includes('already registered') || inviteError.message.includes('registered user')) {
         return NextResponse.json({ error: `User with email ${email} is already registered or invited.` }, { status: 409 });
      }
      if (inviteError.message.includes('invitation per hour')) { 
         return NextResponse.json({ error: 'Invitation rate limit reached. Please try again later.'}, { status: 429 });
      }
      if (inviteError.message.includes('expired')) {
         return NextResponse.json({ error: 'Invitation link expired. Please try inviting the user again.'}, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to send invitation email.' }, { status: 500 });
    }
    
    if (!inviteData || !inviteData.user) {
        console.error('No user data returned from inviteUserByEmail');
        return NextResponse.json({ error: 'Failed to get user data after invitation' }, { status: 500 });
    }
    const invitedUser = inviteData.user;

    const insertData: Database['public']['Tables']['users']['Insert'] = {
      id: invitedUser.id, 
      email: invitedUser.email!, 
      name: name, 
      role: role,
      company_id: companyId,
      profile_photo: profilePhoto,
      must_change_password: true 
    };

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(insertData) 
      .select() 
      .single();

    if (insertError) {
      console.error('Failed to insert invited user into users table:', insertError);
      // Delete the invited user from auth if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(invitedUser.id);
      return NextResponse.json({ 
        error: 'Failed to save user details to database. Please try again.',
        details: insertError.message 
      }, { status: 500 });
    }

    if (password) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        invitedUser.id,
        { password }
      );

      if (passwordError) {
        console.error('Failed to set initial password:', passwordError);
        return NextResponse.json({ error: 'Invitation sent, but failed to set initial password.' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: `Invitation email sent successfully to ${email}.`,
      user: newUser 
    }, { status: 201 });

  } catch (error) {
    console.error('Request failed in POST /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabaseAdmin = createAdminClient();
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  try {
    const authResult = await authorizeRequest(request, { 
      allowedRoles: ['admin'],
      supabaseClient: supabase
    });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: userToDelete, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
    }

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userToDelete.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 });
    }

    // Delete user from auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error('Error deleting user from auth:', deleteAuthError);
      return NextResponse.json({ error: 'Failed to delete user from authentication' }, { status: 500 });
    }

    // Delete user from users table
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteUserError) {
      console.error('Error deleting user from database:', deleteUserError);
      return NextResponse.json({ error: 'Failed to delete user from database' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Request failed in DELETE /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
