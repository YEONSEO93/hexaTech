import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseRouteHandlerClient();

  // Parse form data
  const formData = await request.formData();
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  // Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Prepare update payload
  const updates: { email?: string; password?: string } = {};
  if (email) updates.email = email;
  if (password) updates.password = password;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No data to update" }, { status: 400 });
  }

  // Update user
  const { data, error } = await supabase.auth.updateUser(updates, {emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/setting/email-confirmed`});

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Account updated", user: data.user });
}