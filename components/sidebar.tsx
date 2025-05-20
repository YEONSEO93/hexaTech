"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Database } from "@/types/supabase";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

import { IconUser } from "./icon/IconUser";
import { IconSetting } from "./icon/IconSetting";
import LogoutButton from "@/components/ui/logout-button";

type NavigationItem = {
  name: string;
  href: string;
  roles: Database["public"]["Tables"]["users"]["Row"]["role"][];
};

type SidebarProps = {
  navigationItems: NavigationItem[];
};

export function Sidebar({ navigationItems }: SidebarProps) {
  const pathname = usePathname();
  const { userProfile } = useUserProfile();

  return (
    <div className="fixed left-0 top-0 flex h-screen w-[260px] flex-col border-r border-gray-200 bg-white">
      <div className="p-6 border-b border-gray-200">
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={180} height={60} priority />
        </Link>
      </div>

      <div className="flex flex-col flex-1 space-y-1">
        {/* User Profile Section */}
        <div className="px-6 py-4 mb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <IconUser
                  className="w-8 h-8"
                  profilePhoto={userProfile?.profile_photo}
                />
              </div>
              <div>
                <div className="font-medium text-sm">
                  {userProfile?.name || "Unknown User"}
                </div>
                <div className="text-xs text-gray-500">
                  {userProfile?.company || "No Company"}
                </div>
              </div>
            </div>
            <Link
              href="/setting"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <IconSetting className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Navigation Items */}
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`rounded-md px-6 py-3 text-[15px] ${
              pathname === item.href ||
              (item.href.startsWith("/users/") &&
                pathname.startsWith("/users/"))
                ? "bg-gray-100 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item.name}
          </Link>
        ))}

        <div className="mt-auto pb-4">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
