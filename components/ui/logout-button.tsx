"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      router.push("/login");
    } else {
      alert("Logout failed: " + result.error);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      className="rounded-none w-full from-gray-100 to-gray-200 text-[15px] text-gray-700 hover:from-gray-200 hover:to-gray-300 px-6 py-2.5 flex items-center justify-center shadow-sm"
    >
      Logout
    </Button>
  );
}
