import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { UserRole } from '@/lib/supabase/auth';

interface UseAuthReturn {
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  isCollaborator: boolean;
}

export function useAuth(): UseAuthReturn {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await getCurrentUser();
        if (response.success && response.data?.user) {
          setRole(response.data.user.role);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error in useAuth:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isViewer: role === 'viewer',
    isCollaborator: role === 'collaborator'
  };
} 