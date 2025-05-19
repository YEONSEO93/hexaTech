"use client";

import { useEffect, useState } from "react";
import { createSupabaseClientComponentClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import MainLayout from "./MainLayout";

interface DashboardLayoutProps {
  children: ReactNode;
}

const defaultNavigation = [
  { name: "Dashboard", href: "/dashboard", roles: ["admin", "viewer"] },
  {
    name: "Event Listing",
    href: "/events",
    roles: ["admin", "collaborator", "viewer"],
  },
  { name: "User Management", href: "/users", roles: ["admin"] },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = createSupabaseClientComponentClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);

        const { data: userRecord, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || !userRecord?.role) {
          console.error("❌ Failed to get user role:", error?.message);
          setUserRole(null);
        } else {
          setUserRole(userRecord.role);
        }
      }

      setIsLoading(false);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      console.log("Sidebar Auth event:", event);
      fetchUser();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  type NavigationItem = {
    name: string;
    href: string;
    roles: Database["public"]["Tables"]["users"]["Row"]["role"][];
  };
  let navigationItems: NavigationItem[] = [];

  if (!isLoading && userRole) {
    navigationItems = defaultNavigation
      .filter((item) => item.roles.includes(userRole))
      .map((item) => ({ ...item }));

    console.log("userRole:" + userRole);
    if (userRole === "collaborator" && userId) {
      navigationItems.push({
        name: "My Profile",
        href: `/users/${userId}`,
        roles: ["collaborator"],
      });
      console.log(navigationItems);
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar navigationItems={navigationItems} isLoading={isLoading} />
      <div className="flex-1 p-8 overflow-y-auto">
        <MainLayout>{children}</MainLayout>
      </div>
    </div>
  );
}
