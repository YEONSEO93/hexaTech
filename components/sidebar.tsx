"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

import { IconUser } from "./icon/IconUser";
import { IconSetting } from "./icon/IconSetting";
import { IconNotification } from "./icon/IconNotification";
import LogoutButton from "@/components/ui/logout-button";

const defaultNavigation = [
  { name: "Dashboard", href: "/dashboard", roles: ['admin'] },
  { name: "Event Listing", href: "/events", roles: ['admin', 'collaborator'] },
  { name: "User Management", href: "/users", roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClientComponentClient<Database>();

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Database['public']['Tables']['users']['Row']['role'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (user) {
          setUserId(user.id);
          const { data: userData, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (roleError) {
             console.error('Sidebar: Error fetching user role:', roleError);
             setUserRole(null); 
          } else if (userData) {
            setUserRole(userData.role);
          }
        } else {
          setUserId(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Sidebar: Error fetching user session or role:', error);
        setUserId(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
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
    <div className="fixed left-0 top-0 flex h-screen w-[260px] flex-col border-r border-gray-200 bg-white">
      <div className="p-6 mb-8 border-b border-gray-200">
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={180} height={60} priority />
        </Link>
      </div>

      <div className="flex flex-col flex-1 space-y-1">
        <div className="flex items-center justify-center gap-6 mb-8">
          <button className="rounded-full p-2.5 hover:bg-gray-100">
            <IconUser className="w-6 h-6 text-gray-600" />
          </button>
          <Link
            href="/setting"
            className="rounded-full p-2.5 hover:bg-gray-100"
          >
            <IconSetting className="w-6 h-6 text-gray-600" />
          </Link>
          <button className="rounded-full p-2.5 hover:bg-gray-100 relative">
            <div className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              1
            </div>
            <IconNotification className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        {isLoading ? (
          <div className="px-6 py-3 text-gray-400">Loading...</div>
        ) : (
          navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`rounded-md px-6 py-3 text-[15px] ${
                (pathname === item.href || (item.href.startsWith('/users/') && pathname.startsWith('/users/')))
                  ? "bg-gray-100 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.name}
            </Link>
          ))
        )}
        <LogoutButton />
      </div>
    </div>
  );
}
