// app/api/companies/route.ts

import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api/authUtils";

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseRouteHandlerClient();


    const authResult = await authorizeRequest(request, {
      allowedRoles: ["admin", "viewer", "collaborator"],
    });
    if (authResult instanceof NextResponse) return authResult;

    const { data, error } = await supabase
      .from("company")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching companies:", error);
      return NextResponse.json(
        { error: "Failed to fetch companies" },
        { status: 500 }
      );
    }

    return NextResponse.json({ companies: data });
  } catch (error) {
    console.error("Error in GET /api/companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseRouteHandlerClient();

    const authResult = await authorizeRequest(request, {
      allowedRoles: ["admin"],
    });
    if (authResult instanceof NextResponse) return authResult;
  

    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }
    const { data: existingCompany } = await supabase
    .from("company")
    .select("id, name")
    .eq("name", name.trim())
    .single();


  if (existingCompany) {
    return NextResponse.json(
      { 
        error: "Company already exists",
        existingCompany  
      },
      { status: 409 }
    );
  }
    const { data, error } = await supabase
      .from("company")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      console.error("Error creating company:", error);
      return NextResponse.json(
        { error: "Failed to create company" },
        { status: 500 }
      );
    }

    return NextResponse.json({ company: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
