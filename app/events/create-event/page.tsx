// app/events/create/page.tsx
"use client";

import EventForm, { EventItem } from "@/components/events/EventForm";
import { useRouter } from "next/navigation";

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
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create Event</h1>
      <EventForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
