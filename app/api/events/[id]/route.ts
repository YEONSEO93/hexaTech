//api/events/[id]/route.tsf

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/client";

// GET /api/events/:id
// Fetches a single event by ID
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createAdminClient();
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
    const supabase = createAdminClient();
    const eventIdRaw = params.id;
    const payload = await req.json();
  
    const eventId = Number(eventIdRaw);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }
  
    // 🔄 mapping name → ID 
    const getId = async (
        table: "category" | "sub_category" | "venue" | "company",
        name: string | undefined
      ) => {
        if (!name) return null;
      
        const { data, error } = await supabase
          .from(table as "category" | "sub_category" | "venue" | "company")
          .select("id")
          .eq("name", name)
          .single();
      
        if (error) {
          console.error(`Error fetching ID from ${table}:`, error.message);
          return null;
        }
        return data?.id ?? null;
      };
  
    const category_id = await getId("category", payload.category?.name);
    const subcategory_id = await getId("sub_category", payload.sub_category?.name);
    const venue_id = await getId("venue", payload.venue?.name);
    const company_id = await getId("company", payload.company?.name); // optional
  
    const flatPayload = {
        name: payload.name,
        status: payload.status?.toUpperCase(),
        start_date: payload.start_date,
        end_date: payload.end_date,
        total_attendees: payload.total_attendees,
        total_attendee_category: payload.total_attendee_category,
        details: payload.details ?? undefined,
        category_id: category_id ?? undefined,
        subcategory_id: subcategory_id ?? undefined,
        venue_id: venue_id ?? undefined,
        company_id: company_id ?? undefined,
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
    const supabase = createAdminClient();
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

