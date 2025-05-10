// app/events/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import EventForm, { EventItem } from "@/components/events/EventForm";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export default function CreateEventPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  // ✅ Fetch the logged-in user's company_id
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

    fetchCompanyId();
  }, [supabase]);

  const handleSubmit = async (form: Partial<EventItem>) => {
    if (!companyId) {
      alert("Company not found for this user.");
      return;
    }

    const payload = {
      ...form,
      company_id: companyId, // ✅ Automatically attach the user's company_id in the POST payload
    };

    const res = await fetch("/api/events", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) router.push("/events");
    else alert("Failed to create event");
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Create Event" />
      </div>
      <div className="p-6 bg-white rounded-lg shadow">
        {/* ✅ company_id is set automatically, so it's not selected in the form */}
        {/* <EventForm mode="create" onSubmit={handleSubmit} />
         */}
      </div>
      <EventForm
        mode="create"
        onSubmit={handleSubmit}
        defaultValues={{
          company_id: companyId ?? undefined,
          company_name: companyName,
        }}
        companyName={companyName}
      />
    </>
  );
}
