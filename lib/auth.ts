import { supabase } from './supabase';

export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: {
    token: string;
    role: string;
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    // Attempt to sign in
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Sign in error:', signInError.message);
      return { success: false, error: signInError.message };
    }

    if (!data?.user) {
      console.error('No user data returned');
      return { success: false, error: 'No user data returned' };
    }

    // Get user role
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (roleError) {
      console.error('Role error:', roleError.message);
      return { success: false, error: 'Failed to get user role' };
    }

    if (!userData) {
      console.error('No user role found');
      return { success: false, error: 'User role not found' };
    }

    if (!data.session?.access_token) {
      console.error('No access token received');
      return { success: false, error: 'No access token received' };
    }

    // Return success with token and role
    return {
      success: true,
      data: {
        token: data.session.access_token,
        role: userData.role
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to login'
    };
  }
}

export async function checkSession(): Promise<AuthResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false };
    }

    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (roleError || !userData) {
      return { success: false, error: 'Failed to get user role' };
    }

    return {
      success: true,
      data: {
        token: session.access_token,
        role: userData.role
      }
    };
  } catch (error) {
    console.error('Session check error:', error);
    return { success: false, error: 'Failed to check session' };
  }
} 