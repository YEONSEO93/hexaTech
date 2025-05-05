// app/events/[id]/edit/page.tsx

"use client";

import EventForm, { EventItem } from "@/components/events/EventForm";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Edit Event</h1>
      <EventForm mode="edit" defaultValues={event} onSubmit={handleSubmit} />
    </div>
  );
}
