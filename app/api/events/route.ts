// app/api/events/route.ts

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest,NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { TablesInsert } from "@/types/supabase";
import { Database } from "@/types/supabase";

const supabase = createAdminClient();

// POST /api/events
// Creates a new event (admin, collaborator)
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
// Fetches all events (admin , viewer)
// Fetches only user's company events (collaborator)
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(req.url).searchParams;
  const limit = Number(searchParams.get("limit") ?? "10") || 10;
  const offset = Number(searchParams.get("offset") ?? "0") || 0;
  const filterCompanyId = searchParams.get("company_id");

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "User not found" }, { status: 403 });
  }

  const { role, company_id } = userData;

  let query = supabase
    .from("event")
    .select(
      `
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
    `,
      { count: "exact" }
    )
    .order("start_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (role === "collaborator") {
    if (!company_id) {
      return NextResponse.json({ error: "Missing company_id" }, { status: 400 });
    }
    query = query.eq("company_id", company_id);
  } else if (filterCompanyId) {
    query = query.eq("company_id", Number(filterCompanyId));
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count });
}

