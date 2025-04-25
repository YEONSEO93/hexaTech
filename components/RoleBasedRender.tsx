import { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { UserRole } from '@/lib/supabase/auth';

type RoleBasedRenderProps = {
  children: ReactNode;
  allowedRoles: UserRole[];
};

export function RoleBasedRender({ children, allowedRoles }: RoleBasedRenderProps) {
  const { role, loading } = useAuth();

  if (loading || !role) {
    return null;
  }

  if (!allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
} 