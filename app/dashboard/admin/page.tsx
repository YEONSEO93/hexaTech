"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/auth/admin');
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
  }, [router]);

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
