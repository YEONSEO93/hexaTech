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

  // const handleSubmit = async (form: Partial<EventItem>) => {
  //   console.log("📤 전달된 formData:", form);
  //   const res = await fetch(`/api/events/${id}`, {
  //     method: "PATCH",
  //     body: JSON.stringify(form),
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   });

  //   if (res.ok) router.push("/events");
  //   else alert("Failed to update event");
  // };

  // const handleSubmit = async (form: Partial<EventItem>) => {
  //   try {
  //     console.log("📤 전달된 formData:", form);

  //     const res = await fetch(`/api/events/${id}`, {
  //       method: "PATCH",
  //       body: JSON.stringify(form),
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     const result = await res.json(); // 여기서도 오류 날 수 있음
  //     console.log("📥 API 응답:", result);

  //     if (res.ok) {
  //       router.push("/events");
  //     } else {
  //       alert("❌ Failed to update event");
  //     }
  //   } catch (err) {
  //     console.error("❗fetch 중 에러 발생:", err);
  //     alert("❌ 요청 중 오류가 발생했습니다");
  //   }
  // };

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
      console.log("📥 API 응답:", result);

      if (!res.ok) {
        alert(`업데이트 실패: ${result.error?.message || "Unknown error"}`);
      } else {
        router.push("/events");
      }
    } catch (err) {
      console.error("❗ 네트워크 에러:", err);
      alert("요청 중 오류 발생");
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
