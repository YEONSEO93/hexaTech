//api/events/[id]/route.tsf

import { NextRequest, NextResponse } from "next/server";
// import { createAdminClient } from "@/lib/supabase/client";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

async function getUserAndRole() {
  const supabase = createSupabaseServerComponentClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log("🔵 User:", user);
  

  if (userError || !user) {
    return { error: "Unauthorized", role: null };
  }

  const { data: userRecord, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError || !userRecord?.role) {
    return { error: "Role not found", role: null };
  }

  return { role: userRecord.role, error: null };
}


// GET /api/events/:id
// Fetches a single event by ID
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createSupabaseServerComponentClient();
    const eventId = Number(params.id);
  
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
  
    const { data, error } = await supabase
      .from("event")
      .select(`
        id, name, start_date, end_date, status, total_attendees, total_attendee_category,
        venue ( name ),
        company ( name ),
        category ( name ),
        sub_category ( name ),
        details
      `)
      .eq("id", eventId)
      .single();
  
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  
    return NextResponse.json(data);
  }
  
// PATCH /api/events/:id
// Updates an event by ID
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {

  const { role, error: roleError } = await getUserAndRole();
  if (roleError || role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 }); // ✅ block viewer
  }

  const supabase = createSupabaseServerComponentClient();
  const eventIdRaw = params.id;
  const payload = await req.json();

  const eventId = Number(eventIdRaw);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  // ✅ Using ID values passed directly from the frontend
  const flatPayload = {
    name: payload.name,
    status: payload.status?.toUpperCase(),
    start_date: payload.start_date,
    end_date: payload.end_date,
    total_attendees: payload.total_attendees,
    total_attendee_category: payload.total_attendee_category,
    details: payload.details ?? undefined,
    category_id: payload.category_id ?? undefined,
    subcategory_id: payload.subcategory_id ?? undefined,
    venue_id: payload.venue_id ?? undefined,
    company_id: payload.company_id ?? undefined,
  };

  const { data, error } = await supabase
    .from("event")
    .update(flatPayload)
    .eq("id", eventId)
    .select();

  if (error) {
    console.error("🔴 Supabase update error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}


// DELETE /api/events/:id
// Deletes an event by ID
export async function DELETE(
    _: NextRequest,
    { params }: { params: { id: string } }
  ) {

    const { role, error: roleError } = await getUserAndRole();
    if (roleError || role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 }); 
    }

    const supabase = createSupabaseServerComponentClient();
    const eventIdRaw = params.id;
  
    const eventId = Number(eventIdRaw);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }
  
    const { data, error } = await supabase
      .from("event")
      .delete()
      .eq("id", eventId)
      .select();
  
    if (error) {
      console.error("🔴 Supabase delete error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  
    return NextResponse.json({ data });
  }

