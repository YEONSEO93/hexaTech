// app/api/companies/route.ts

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseRouteHandlerClient();

  const { data, error } = await supabase
    .from("company")
    .select("id, name")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
