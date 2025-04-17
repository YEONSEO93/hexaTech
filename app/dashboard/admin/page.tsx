"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.log('No session found, redirecting to login');
          router.push('/login');
          return;
        }

        const role = session.user.user_metadata.role;
        if (role !== 'admin') {
          console.log('User is not admin, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        setUserEmail(session.user.email || null);
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/login');
      }
    };

    checkAdminAccess();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h1>Hello {userEmail}</h1>
    </div>
  );
} 
