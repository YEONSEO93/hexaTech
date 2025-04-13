"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          router.push('/login');
          return;
        }

        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (roleError || userData?.role !== 'admin') {
          router.push('/users');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        router.push('/login');
      }
    };

    checkAdminRole();
  }, [router]);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return <h1>testing-admin dashboard</h1>;
} 
