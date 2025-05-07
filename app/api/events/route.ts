// app/api/events/route.ts

import { NextRequest,NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { TablesInsert } from "@/types/supabase";

const supabase = createAdminClient();

// POST /api/events
// Creates a new event
export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("👀 body from server:", body);

  if (!body.name || !body.status || !body.venue_id || !body.company_id) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const payload: TablesInsert<"event"> = {
    name: body.name,
    status: body.status,
    start_date: body.start_date ?? null,
    end_date: body.end_date ?? null,
    total_attendees: body.total_attendees ?? null,
    total_attendee_category: body.total_attendee_category ?? null,
    details: body.details ?? null,
    venue_id: body.venue_id,
    company_id: body.company_id,
    category_id: body.category_id ?? null,
    subcategory_id: body.subcategory_id ?? null,
  };

  const { data, error } = await supabase
    .from("event")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}



// GET /api/events
// Fetches all events
export async function GET() {
  const { data, error } = await supabase
    .from('event')
    .select(`
      id,
      name,
      start_date,
      end_date,
      status,
      total_attendees,
      total_attendee_category,
      venue:venue(name, location),
      company:company(name),
      category:category(name),
      sub_category:sub_category(name)
    `)
    .order('start_date', { ascending: false });

    console.log("📦 Events from API:", data);
    

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

