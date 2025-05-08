// app/events/[id]/edit/page.tsx

"use client";

import EventForm, { EventItem } from "@/components/events/EventForm";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import MainLayout from "@/components/layouts/MainLayout";

export default function EditEventPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setEvent(data));
  }, [id]);

  const handleSubmit = async (form: Partial<EventItem>) => {
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(form),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) router.push("/events");
    else alert("Failed to update event");
  };

  if (!event) return <p>Loading...</p>;

  return (
    <>
      <Sidebar navigationItems={[]} isLoading={false} />
      <MainLayout>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Events List</h1>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <EventForm
            mode="edit"
            defaultValues={event}
            onSubmit={handleSubmit}
          />
        </div>
      </MainLayout>
    </>
  );
}
