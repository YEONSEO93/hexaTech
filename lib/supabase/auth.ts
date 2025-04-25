import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export type UserRole = 'admin' | 'collaborator' | 'viewer';

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      role: UserRole;
      must_change_password: boolean;
    };
    session?: {
      user: {
        id: string;
        email: string;
        user_metadata: {
          role: UserRole;
        };
      };
    };
  };
  error?: string;
}

export const checkSession = async (): Promise<AuthResponse> => {
  try {
    const supabase = createClientComponentClient<Database>();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return { success: false, error: error?.message || 'No active session' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, must_change_password')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'Failed to fetch user data' };
    }

    return {
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email!,
          role: userData.role as UserRole,
          must_change_password: userData.must_change_password ?? false
        }
      }
    };
  } catch (error) {
    console.error('Session check error:', error);
    return { success: false, error: 'Failed to check session' };
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const supabase = createClientComponentClient<Database>();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session) {
      return { success: false, error: error?.message || 'Invalid credentials' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, must_change_password')
      .eq('id', data.session.user.id)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'Failed to fetch user data' };
    }

    return {
      success: true,
      data: {
        user: {
          id: data.session.user.id,
          email: data.session.user.email!,
          role: userData.role as UserRole,
          must_change_password: userData.must_change_password ?? false
        }
      }
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Failed to sign in' };
  }
};

export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClientComponentClient<Database>();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: 'Failed to sign out' };
  }
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const supabase = createClientComponentClient<Database>();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, error: error?.message || 'No authenticated user' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, must_change_password')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'Failed to fetch user data' };
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email!,
          role: userData.role as UserRole,
          must_change_password: userData.must_change_password ?? false
        }
      }
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return { success: false, error: 'Failed to get current user' };
  }
};
