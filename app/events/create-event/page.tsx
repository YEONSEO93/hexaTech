// app/events/create/page.tsx
"use client";

import { Sidebar } from "@/components/sidebar";
import { PageHeader } from "@/components/PageHeader";
import EventForm, { EventItem } from "@/components/events/EventForm";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layouts/MainLayout";

export default function CreateEventPage() {
  const router = useRouter();

  const handleSubmit = async (form: Partial<EventItem>) => {
    const res = await fetch("/api/events", {
      method: "POST",
      body: JSON.stringify(form),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) router.push("/events");
    else alert("Failed to create event");
  };

  return (
    <>
      <Sidebar />
      <MainLayout>
        <div className="flex items-center justify-between mb-6">
          <PageHeader title="Create Event" />
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <EventForm mode="create" onSubmit={handleSubmit} />
        </div>
      </MainLayout>
    </>
  );
}
