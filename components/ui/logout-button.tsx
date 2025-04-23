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
      size="sm"
      className="bg-red-500 hover:bg-red-600 w-auto"
    >
      Logout
    </Button>
  );
}
