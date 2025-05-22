import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/supabase';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route';
import { authorizeRequest } from '@/lib/api/authUtils';
import { z } from 'zod';

const inviteUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required and cannot be empty" }),
  email: z.string().email({ message: "Invalid email address provided" }),
  role: z.enum(['admin', 'collaborator', 'viewer'], {
    errorMap: () => ({ message: "Invalid role provided. Must be 'admin', 'collaborator', or 'viewer'." }) 
  }),
  company: z.string({
    required_error: "Company name is required",
    invalid_type_error: "Company name must be a string"
  }),
  profilePhoto: z.string().optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }).optional()
});

export async function GET(request: NextRequest) {
  const supabase = createSupabaseRouteHandlerClient();

  try {
    const authResult = await authorizeRequest(request, { 
      allowedRoles: ['admin', 'viewer'],
    });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { data: users, error: fetchError } = await supabase
        .from('users')
        .select(`
          id, 
          name, 
          email, 
          role, 
          created_at, 
          profile_photo,
          company_id,
          company:company(id, name)
        `);

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
  const supabase = createSupabaseRouteHandlerClient();

  try {
    const authResult = await authorizeRequest(request, { 
        allowedRoles: ['admin'],
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

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
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
    let company_id = null; 

     // check if company exists by checking company table with company name equality 
      const { data: companyData, error: companyError } = await supabase
        .from('company')
        .select('id')
        .eq('name', company)
        .single();
      
      //if company exists, get the id and update dataToUpdate.company_id. if company does not exist, create a new company in the company table and get the id
      if (companyError) {
        if (companyError.code === 'PGRST116') {
          // company not found, create a new one
          const { data: newCompany, error: createCompanyError } = await supabase
            .from('company')
            .insert({ name: company })
            .select('id')
            .single();

          if (createCompanyError) {
            console.error('Failed to create new company:', createCompanyError);
            return NextResponse.json({ error: 'Failed to create new company' }, { status: 500 });
          }

          company_id = newCompany.id;
        }
      }
       else {
        // company found, update dataToUpdate.company_id
        if (!companyData) {
          return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }
        company_id = companyData.id;
      }
    

    const insertData: Database['public']['Tables']['users']['Insert'] = {
      id: invitedUser.id, 
      email: invitedUser.email!, 
      name: name, 
      role: role,
      company_id: company_id,
      profile_photo: profilePhoto,
      must_change_password: true 
    };

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(insertData) 
      .select() 
      .single();

    if (insertError) {
      console.error('Failed to insert invited user into users table:', insertError);
      return NextResponse.json({ error: 'Invitation sent, but failed to save user details to database.' }, { status: 500 });
    }

    if (password) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
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
