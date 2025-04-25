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
        .select('id, name, email, role, company, created_at, profile_photo');

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

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { 
          role: role,
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
      company: company,
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
      return NextResponse.json({ error: 'Invitation sent, but failed to save user details to database.' }, { status: 500 });
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
