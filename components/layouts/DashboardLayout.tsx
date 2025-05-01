"use client"

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const defaultNavigation = [
  { name: "Dashboard", href: "/dashboard", roles: ['admin', 'viewer'] },
  { name: "Event Listing", href: "/events", roles: ['admin', 'collaborator', 'viewer'] },
  { name: "User Management", href: "/users", roles: ['admin', 'viewer'] },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = createClientComponentClient<Database>();

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        setUserRole(user.user_metadata.role)
      }

      setIsLoading(false)
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Sidebar Auth event:', event);
      fetchUser();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);


  type NavigationItem = {
    name: string;
    href: string;
    roles: (Database['public']['Tables']['users']['Row']['role'])[];
  };
  let navigationItems: NavigationItem[] = [];

  if (!isLoading && userRole) {
    navigationItems = defaultNavigation
      .filter(item => item.roles.includes(userRole))
      .map(item => ({ ...item }));

    if (userRole === 'collaborator' && userId) {
      navigationItems.push({
        name: "My Profile",
        href: `/users/${userId}`,
        roles: ['collaborator']
      });
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar navigationItems={navigationItems} isLoading={isLoading} />
      <div className="flex-1 p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
} 