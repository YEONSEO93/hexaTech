import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Change Password Request ===');
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Error: No bearer token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Initialize admin client
    const supabase = createAdminClient();
    
    // Get user from token
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current status from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('must_change_password, role')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.error('Error fetching user data:', dbError);
      return NextResponse.json({ error: 'Failed to verify user status' }, { status: 500 });
    }

    // Only allow password change if:
    // 1. User is a collaborator AND must_change_password is true (first login)
    // 2. User is providing their current password correctly
    if (userData.role === 'admin' || (userData.role === 'collaborator' && !userData.must_change_password)) {
      console.log('Error: Regular password changes not implemented');
      return NextResponse.json(
        { error: 'Regular password changes not implemented yet' },
        { status: 400 }
      );
    }

    // For collaborators with must_change_password flag
    if (userData.role === 'collaborator' && userData.must_change_password) {
      // Update password using admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Password update failed:', updateError);
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        );
      }

      // Update must_change_password flag
      const { error: flagError } = await supabase
        .from('users')
        .update({ must_change_password: false })
        .eq('id', user.id);

      if (flagError) {
        console.error('Failed to update user record:', flagError);
        // Don't return error as password was successfully changed
      }

      console.log('First-time password successfully updated for collaborator:', user.email);
      return NextResponse.json({ 
        message: 'Password updated successfully',
        must_change_password: false
      });
    }

    return NextResponse.json({ error: 'Invalid password change request' }, { status: 400 });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
} 