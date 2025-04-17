import { supabase } from './client';

// Check current session
export const checkSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('Session error:', error);
    return { session, error };
  } catch (error) {
    console.error('Error checking session:', error);
    return { session: null, error };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null, error };
  }
}; 