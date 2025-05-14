// app/events/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import EventForm, { EventItem } from "@/components/events/EventForm";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useUser } from "@/app/context/UserContext";

export default function CreateEventPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  const { userRole } = useUser();

  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  // ✅ Fetch the logged-in user's company_id (for collaborator)
  useEffect(() => {
    const fetchCompanyId = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error("🔴 Failed to get user:", error?.message);
        return;
      }

      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("company_id, company ( name )")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("🔴 Failed to get user record:", userError.message);
        return;
      }

      if (userRecord.company_id && userRecord.company) {
        setCompanyId(userRecord.company_id);
        setCompanyName(userRecord.company.name);
      }
    };

    if (userRole === "collaborator") {
      fetchCompanyId(); // only fetch company for non-admin
    }
  }, [supabase, userRole]);

  const handleSubmit = async (form: Partial<EventItem>) => {
    if (userRole === "viewer") {
      alert("You do not have permission to create an event.");
      return;
    }

    // ✅ Decide how to set company_id based on role
    const payload = {
      ...form,
      company_id: userRole === "admin" ? form.company_id : companyId,
    };

    const res = await fetch("/api/events", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      router.push("/events");
    } else {
      const result = await res.json();
      alert(`Failed to create event: ${result.error ?? "Unknown error"}`);
    }
  };

  if (userRole === "viewer") {
    return (
      <p className="text-red-500">You are not allowed to create events.</p>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Create Event" />
      </div>
      <div className="p-6 bg-white rounded-lg shadow">
        <EventForm
          mode="create"
          onSubmit={handleSubmit}
          defaultValues={
            userRole === "collaborator"
              ? {
                  company_id: companyId ?? undefined,
                  company_name: companyName,
                }
              : {}
          }
          companyName={companyName}
        />
      </div>
    </>
  );
}
