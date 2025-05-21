import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/api/authUtils';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: Database['public']['Tables']['users']['Row']['role'];
  company: { id: number; name: string; } | null;
  createdAt: string;
  profile_photo: string | null;
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userIdToFetch = params.id;
    const supabase = createSupabaseRouteHandlerClient();

    const authResult = await authorizeRequest(request, { 
      allowedRoles: ['admin', 'viewer'], 
      allowSelf: true, 
      targetUserId: userIdToFetch,
    });
    if (authResult instanceof NextResponse) return authResult;

    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select(`
        id, 
        name, 
        email, 
        role, 
        company_id,
        company:company(id, name),
        created_at, 
        profile_photo
      `) 
      .eq('id', userIdToFetch)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { 
        return NextResponse.json({ error: `User with id ${userIdToFetch} not found` }, { status: 404 });
      }
      console.error('Failed to fetch user data:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (!userData.name) {
      console.error('Invalid user data: name is required');
      return NextResponse.json({ error: 'Invalid user data: name is required' }, { status: 500 });
    }

    const responseUser: UserResponse = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      company: userData.company,
      createdAt: userData.created_at,
      profile_photo: userData.profile_photo
    };
    return NextResponse.json({ user: responseUser });

  } catch (error) {
    console.error('Error in GET /api/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userIdToUpdate = params.id;
  const supabase = createSupabaseRouteHandlerClient(); 

  try {
    const authResult = await authorizeRequest(request, { 
      allowedRoles: ['admin'], 
      allowSelf: true,
      targetUserId: userIdToUpdate,
    });
    if (authResult instanceof NextResponse) return authResult;

    let updateData;
    try {
      updateData = await request.json();
    } catch (parseError) {
      console.error('Invalid JSON in PATCH /api/users/[id]:', parseError);
      return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 });
    }

    const { name, email, role, company, profilePhoto, password } = updateData;
    const dataToUpdate: Partial<Database['public']['Tables']['users']['Update']> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
      }
      dataToUpdate.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }
      dataToUpdate.email = email.trim();
    }

    if (role !== undefined) {
      const allowedRoles: Database['public']['Tables']['users']['Row']['role'][] = ['admin', 'collaborator'];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
      }
      dataToUpdate.role = role;
    }

    if (company !== undefined) {
      if (typeof company !== 'string') {
        return NextResponse.json({ error: 'Company must be a string' }, { status: 400 });
      }

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

          dataToUpdate.company_id = newCompany.id;
        }
      }
      else {
        // company found, update dataToUpdate.company_id
        if (!companyData) {
          return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }
        dataToUpdate.company_id = companyData.id;
      }
    }

    if (profilePhoto !== undefined) {
      if (typeof profilePhoto !== 'string') {
        return NextResponse.json({ error: 'Profile photo must be a string' }, { status: 400 });
      }
      dataToUpdate.profile_photo = profilePhoto;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(dataToUpdate)
      .eq('id', userIdToUpdate)
      .select('id, name, email, role, company_id, profile_photo, updated_at')
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: `User with id ${userIdToUpdate} not found for update` }, { status: 404 });
      }
      console.error('Failed to update user data:', updateError);
      return NextResponse.json({ error: 'Failed to update user data' }, { status: 500 });
    }

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }

      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        userIdToUpdate,
        { password }
      );

      if (passwordError) {
        console.error('Failed to update password:', passwordError);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser });

  } catch (error) {
    console.error('Error in PATCH /api/users/[id]:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

//DELETE
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userIdToDelete = params.id;
  const supabase = createSupabaseRouteHandlerClient();

  try {
    const authResult = await authorizeRequest(request, { 
      allowedRoles: ['admin'], 
      allowSelf: true,
      targetUserId: userIdToDelete,
    });
    if (authResult instanceof NextResponse) return authResult;

    const { data: userToDelete, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userIdToDelete)
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
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userIdToDelete);
    if (deleteAuthError) {
      console.error('Error deleting user from auth:', deleteAuthError);
      return NextResponse.json({ error: 'Failed to delete user from authentication' }, { status: 500 });
    }
      
    // Delete user from users table
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userIdToDelete);

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