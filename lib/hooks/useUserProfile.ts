import { useEffect, useState } from 'react';
import { createSupabaseClientComponentClient } from '@/lib/supabase/client';

// Define type for actual use
type UserProfile = {
  name: string | null;
  company: string | null;
  profile_photo: string | null;
};

export function useUserProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClientComponentClient();

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Execute join query
        const { data } = await supabase
          .from('users')
          .select(`
            name,
            profile_photo,
            company:company_id (
              name
            )
          `)
          .eq('id', user.id)
          .single();

        // Transform data
        setUserProfile({
          name: data?.name ?? null,
          company: data?.company?.name ?? null,
          profile_photo: data?.profile_photo ?? null
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [supabase]);

  return { userProfile, loading };
}