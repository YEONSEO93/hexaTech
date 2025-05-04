// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createAdminClient } from "@/lib/supabase/client";
// import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'; 

import { Database } from '@/types/supabase';
import { ExcelRow } from '@/types/excel';

const supabase = createAdminClient();

// Helper to insert or find existing row by name
export async function findOrInsertId<
  T extends keyof Database["public"]["Tables"],
  K extends keyof Database["public"]["Tables"][T]["Row"],
  V extends Database["public"]["Tables"][T]["Row"][K]
>(
  table: T,
  nameField: K,
  value: V
): Promise<Database["public"]["Tables"][T]["Row"]["id"]> {
  // 🔍 Try to find existing row
  const { data: existing, error: selectError } = await supabase
    .from(table)
    .select("id")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq(nameField as string, value as any)
    .maybeSingle() as {
        data: { id: number | string } | null;
        error: Error | null;
      };

  if (selectError) {
    console.error(`❌ Select failed in ${table}:`, selectError.message);
    throw new Error(`Select failed from ${String(table)}: ${selectError.message}`);
  }

  if (existing?.id) { 
    console.log(`✅ Found existing ${table} row for ${value}, id: ${existing.id}`);
    return existing.id;}

    console.log(`📦 Inserting new row into ${table} for ${value}...`);

  // ✍️ Insert new row if not found
  const { data: inserted, error: insertError } = await supabase
    .from(table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ [nameField]: value } as any)
    .select("id")
    .single();

  if (insertError || !("id" in inserted)) {
    console.error(`❌ Insert failed into ${table}:`, insertError?.message, inserted);
    throw new Error(`Insert failed into ${String(table)}: ${insertError?.message}`);
  }

  console.log(`✅ Inserted ${table} row for ${value}, id: ${inserted.id}`);
  return inserted.id as string | number;
}

// Optional: enum validation (basic)
const isValidStatus = (s: string): s is Database['public']['Enums']['event_status'] =>
  ['PENDING', 'ANNOUNCED'].includes(s);

export const isValidCategoryName = (
    value: string
  ): value is Database["public"]["Enums"]["category_name"] =>
    [
      "MEGA_EVENT",
      "MAJOR_EVENT",
      "MASS_PARTICIPATION_EVENT",
      "BUSINESS_EVENT",
      "CONCERT",
    ].includes(value);

export const isValidSubCategoryName = (
    value: string
    ): value is Database["public"]["Enums"]["sub_category_name"] =>
    [
        "SPORT_OLYMPIC_PARALYMPIC",
        "NON_OLYMPIC",
        "ARTS_AND_CULTURE",
        "STEM",
        "LIFESTYLE",
        "MUSIC",
        "TRANS_INFRA_DISRUPT",
    ].includes(value);


const isValidAttendeeCategory = (s: string): s is Database['public']['Enums']['attendee_bucket'] =>
  [
    '<500',
    '501-1,000',
    '1,001-3,000',
    '3,001-5,000',
    '5,001-10,000',
    '10,001-25,000',
    '25,001-50,000',
    '>50,000',
    'INFO ONLY',
  ].includes(s);


  //
export async function POST(req: NextRequest) {
    console.log("POST /api/imports called");
  const rows: ExcelRow[] = await req.json();
  const results: { index: number; success: boolean; skipped?: boolean; error?: string }[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      // 1. user
    console.log("for");
    console.log(`Processing row ${index + 1}:`, row);

      const userId = await findOrInsertId('users', 'name', row.collaboratorName);
      console.log(`User ID for ${row.collaboratorName}: ${userId}`);
      

      // 2. venue
      const venueId = await findOrInsertId('venue', 'name', row.venueName);

      // 3. category
    const categoryName = isValidCategoryName(row.categoryName)
    ? row.categoryName
    : null;
    if (!categoryName) throw new Error(`Invalid category: ${row.categoryName}`);
    const categoryId = await findOrInsertId('category', 'name', categoryName);
    

      // 4. sub_category
    const subCategoryName = isValidSubCategoryName(row.subCategoryName)
    ? row.subCategoryName
    : null;
    if (!subCategoryName) throw new Error(`Invalid sub-category: ${row.subCategoryName}`);
    const subCategoryId = await findOrInsertId('sub_category', 'name', subCategoryName);

      // 5. check if event already exists
      const { data: existingEvent } = await supabase
        .from('event')
        .select('id')
        .eq('name', row.eventTitle)
        .eq('user_id', userId)
        .eq('start_date', row.startDate ?? null)
        .eq('venue_id', venueId)
        .maybeSingle();

      if (existingEvent) {
        results.push({ index, success: true, skipped: true });
        continue;
      }

      // 6. insert event
      await supabase.from('event').insert({
        name: row.eventTitle,
        status: (isValidStatus(row.status) ? row.status : 'PENDING') as Database['public']['Enums']['event_status'],
        start_date: row.startDate ?? null,
        end_date: row.endDate ?? null,
        total_attendees: row.totalAttendees ?? null,
        details: row.details ?? null,
        user_id: userId,
        venue_id: venueId,
        category_id: categoryId,
        subcategory_id: subCategoryId,
        total_attendee_category: row.totalAttendeeCategory && isValidAttendeeCategory(row.totalAttendeeCategory)
          ? row.totalAttendeeCategory
          : null,
      });

      results.push({ index, success: true });
    } catch (err) {
      results.push({
        index,
        success: false,
        error: (err as Error).message,
      });
    }
  }

  return NextResponse.json({ results });
}