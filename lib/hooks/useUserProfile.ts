import { useCallback, useEffect, useState } from 'react';
import { createSupabaseClientComponentClient } from '@/lib/supabase/client';

// Define type for actual use
type UserProfile = {
  id: string;
  name: string | null;
  company: string | null;
  profile_photo: string | null;
  email: string | null;
};

export function useUserProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClientComponentClient();

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select(`
          id,
          name,
          profile_photo,
          company:company_id (
            name
          ), 
          email
        `)
        .eq('id', user.id)
        .single();

      setUserProfile({
        id: user.id,
        name: data?.name ?? null,
        company: data?.company?.name ?? null,
        profile_photo: data?.profile_photo ?? null,
        email: data?.email ?? null
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return { userProfile, loading, refetch: fetchUserProfile };
}