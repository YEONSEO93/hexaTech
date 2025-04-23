"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { IconUser } from "./icon/IconUser";
import { IconSetting } from "./icon/IconSetting";
import { IconNotification } from "./icon/IconNotification";
import LogoutButton from "@/components/ui/logout-button";

const navigation = [
  { name: "Dashboard", href: "/dashboard/admin" },
  { name: "Event Listing", href: "/events" },
  { name: "User Management", href: "/dashboard/admin/collaborators" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 flex h-screen w-[260px] flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6 mb-8">
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={180} height={60} priority />
        </Link>
      </div>

      <div className="flex flex-1 flex-col space-y-1">
        <div className="flex items-center justify-center gap-6 mb-8">
          <button className="rounded-full p-2.5 hover:bg-gray-100">
            <IconUser className="h-6 w-6 text-gray-600" />
          </button>
          <Link
            href="/setting"
            className="rounded-full p-2.5 hover:bg-gray-100"
          >
            <IconSetting className="h-6 w-6 text-gray-600" />
          </Link>
          <button className="rounded-full p-2.5 hover:bg-gray-100 relative">
            <div className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              1
            </div>
            <IconNotification className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`rounded-md px-6 py-3 text-[15px] ${
              pathname.startsWith(item.href)
                ? "bg-gray-100 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item.name}
          </Link>
        ))}
        <LogoutButton />
      </div>
    </div>
  );
}
