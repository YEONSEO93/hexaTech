"use client";

import { Sidebar } from "@/components/sidebar";
import MainLayout from "@/components/layouts/MainLayout";
import EventList from "@/components/events/EventList";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function EventsPage() {
  const router = useRouter();

  return (
    <>
      <Sidebar />
      <MainLayout>
        <div className="flex items-center justify-between mb-6">
          <PageHeader title="Events List" />
          <div className="px-8 py-4">
            <Button
              size="sm"
              className="px-6 py-2.5"
              onClick={() => router.push("/events/create-event")}
            >
              CREATE EVENT
            </Button>
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <EventList />
        </div>
      </MainLayout>
    </>
  );
}
