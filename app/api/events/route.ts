// app/api/events/route.ts

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

const supabase = createAdminClient();

// POST /api/events
// Creates a new event
export async function POST(req: Request) {
    const payload = await req.json();
  
    const { data, error } = await supabase
      .from('event')
      .insert(payload)
      .select()
      .single();
  
    if (error) {
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

