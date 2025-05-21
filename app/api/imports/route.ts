import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route';
import { ExcelRow } from '@/types/excel';

// ---------- CATEGORY ----------
const CATEGORY_ENUM_VALUES = [
    'Mega Event',
    'Business Event',
    'Concert',
    'Mass Participation',
    'Major Event',
    'Key Cultural Event',
    'Trans/Infra Disrupt',
  ] as const;

type CategoryEnumType = (typeof CATEGORY_ENUM_VALUES)[number];

function isValidCategory(value: string | undefined): value is CategoryEnumType {
  return CATEGORY_ENUM_VALUES.includes(value as CategoryEnumType);
}

// ---------- SUBCATEGORY ----------
const SUBCATEGORY_ENUM_VALUES = [
    'Arts & Culture',
    'Business Event',
    'Lifestyle',
    'Music',
    'Sport (Non-Olympic / Paralympic)',
    'Sport (Olympic / Paralympic)',
    'STEM',
    'Trans/Infra Disrupt',
  ] as const;
  
  type SubcategoryEnumType = (typeof SUBCATEGORY_ENUM_VALUES)[number];
  
  function isValidSubcategory(value: string | undefined): value is SubcategoryEnumType {
    return SUBCATEGORY_ENUM_VALUES.includes(value as SubcategoryEnumType);
  }

  // ---------- EVENT STATUS ----------
  const EVENT_STATUS_ENUM_VALUES = [
    'PENDING',
    'ANNOUNCED',
  ] as const;
  
  type EventStatusEnumType = (typeof EVENT_STATUS_ENUM_VALUES)[number];
  
  function isValidEventStatus(value: string | undefined): value is EventStatusEnumType {
    return EVENT_STATUS_ENUM_VALUES.includes(value?.toUpperCase() as EventStatusEnumType);
  }
  


//---------- Supabase Client ----------


export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteHandlerClient();
  const rows: ExcelRow[] = await req.json();

  const results: {
    index: number;
    success: boolean;
    skipped?: boolean;
    error?: string;
  }[] = [];

  for (const [index, row] of rows.entries()) {
    try {
        const { data, error } = await supabase.rpc('insert_event_if_not_exists', {
            event_title: row.eventTitle,
            start_date: row.startDate,
            venue_name: row.venueName,
            status: isValidEventStatus(row.status)
  ? row.status!.toUpperCase()
  : 'PENDING',
            end_date: (row.endDate ?? undefined) as string | undefined,
            total_attendees: (row.totalAttendees ?? undefined) as number | undefined,
            details: (row.details ?? undefined) as string | undefined,
            category_name: isValidCategory(row.categoryName) ? row.categoryName : undefined,
            subcategory_name: isValidSubcategory(row.subCategoryName) ? row.subCategoryName : undefined,
            // total_attendee_category: (row.totalAttendeeCategory ?? undefined) as string | undefined,
            total_attendee_category:
  row.totalAttendeeCategory && row.totalAttendeeCategory.trim() !== ''
    ? row.totalAttendeeCategory
    : undefined,
            company_name: row.company,
        })as {
          data: { skipped?: boolean; reason?: string };
          error: { message: string } | null;};
        

      if (error) {
        console.error("❌ RPC failed:", error.message);
        results.push({ index, success: false, error: error.message });
        continue;
      }

      if (data?.skipped) {
        results.push({
          index,
          success: false,
          skipped: true,
          error: data.reason ?? "Duplicate row",
        });
      } else {
        console.log("✅ RPC succeeded:", row.eventTitle);
        results.push({ index, success: true });
      }
      // if (error) {
      //   console.error("RPC failed:", error.message);
      //   results.push({ index, success: false, error: error.message });
      //   continue;
      // }else {
      //   console.log("RPC succeeded:", row.eventTitle);
      //   results.push({ index, success: true });
      // }
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
