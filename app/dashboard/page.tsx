"use client";

import { Sidebar } from '@/components/sidebar';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default function DashboardPage() {

  return (
    <>
      <Sidebar />
      <main className="pl-[260px]">
        <AdminDashboard />
      </main>
    </>
  );
}
