"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('No session found');
        }

        const response = await fetch('/api/roles/admin', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (!response.ok) {
          throw new Error('Access denied');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Admin access check failed:', error);
        router.push('/dashboard');
      }
    };

    checkAdminAccess();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AdminDashboard />
    </DashboardLayout>
  );
} 
