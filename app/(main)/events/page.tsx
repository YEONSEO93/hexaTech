"use client";

import { Sidebar } from '@/components/sidebar';
import MainLayout from '@/components/layouts/MainLayout';

export default function EventsPage() {
  return (
    <>
      <Sidebar />
      <MainLayout>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Events Page</h1>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <p>Event listing or details will be displayed here.</p>
        </div>

      </MainLayout>
    </>
  );
}
  