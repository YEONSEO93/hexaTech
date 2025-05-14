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
    try {
      const {
        name,
        start_date,
        end_date,
        total_attendees,
        total_attendee_category,
        details,
        status,
        venue_id,
        company_id,
        category_id,
        subcategory_id,
      } = form;

      const payload = {
        name,
        start_date,
        end_date,
        total_attendees,
        total_attendee_category,
        details,
        status,
        venue_id,
        company_id,
        category_id,
        subcategory_id,
      };

      const res = await fetch(`/api/events/${form.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      console.log("📥 API response:", result);

      if (!res.ok) {
        alert(`Update failed: ${result.error?.message || "Unknown error"}`);
      } else {
        router.push("/events");
      }
    } catch (err) {
      console.error("❗ Network error:", err);
      alert("An error occurred while processing your request.");
    }
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
