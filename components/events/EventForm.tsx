"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createSupabaseClientComponentClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { useUser } from "@/app/context/UserContext"; // get user info from context

const STATUS_OPTIONS = ["PENDING", "ANNOUNCED"] as const;

type EventFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<EventItem>;
  onSubmit: (values: Partial<EventItem>) => void;
  companyName?: string;
};

export type EventItem = {
  id: number;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string | null;
  total_attendees?: number | null;
  total_attendee_category?: string | null;
  company_name: string;
  company_id: number;
  company: {
    id: number;
    name: string;
  };
  venue_id: number;
  venue: {
    name: string;
  };
  category_id?: number;
  category?: {
    name: string;
  };
  subcategory_id?: number;
  sub_category?: {
    name: string;
  };
  details?: string | null;
};

export default function EventForm({
  mode,
  defaultValues = {},
  onSubmit,
}: EventFormProps) {
  const { userRole, isLoading } = useUser();

  console.log("📦 userRole:", userRole);
  console.log("📦 isLoading:", isLoading);

  console.log("📦 defaultValues:", defaultValues);

  const [form, setForm] = useState<Partial<EventItem>>({}); // ✅ Start empty form

  const [companyOptions, setCompanyOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [venueOptions, setVenueOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [categoryOptions, setCategoryOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<
    { id: number; name: string }[]
  >([]);

  useEffect(() => {
    const supabase = createSupabaseClientComponentClient();

    const fetchAllOptions = async () => {
      const [
        { data: venueData },
        { data: companyData },
        { data: categoryData },
        { data: subcategoryData },
      ] = await Promise.all([
        supabase.from("venue").select("id, name").not("name", "is", null),
        supabase.from("company").select("id, name").not("name", "is", null),
        supabase.from("category").select("id, name").not("name", "is", null),
        supabase
          .from("sub_category")
          .select("id, name")
          .not("name", "is", null),
      ]);

      if (companyData) console.log("📦 companyData:", companyData);
      setCompanyOptions(companyData as { id: number; name: string }[]);

      if (venueData)
        setVenueOptions(venueData as { id: number; name: string }[]);
      console.log("📦 venueData:", venueData);

      if (categoryData)
        setCategoryOptions(categoryData as { id: number; name: string }[]);
      console.log("📦 categoryData:", categoryData);
      if (subcategoryData)
        setSubcategoryOptions(
          subcategoryData as { id: number; name: string }[]
        );
      console.log("📦 subcategoryData:", subcategoryData);
    };

    fetchAllOptions();
  }, []);

  // ✅ Fill in form after dropdown options + defaultValues are ready
  useEffect(() => {
    if (
      defaultValues &&
      companyOptions.length &&
      venueOptions.length &&
      categoryOptions.length &&
      subcategoryOptions.length
    ) {
      const companyMatch = companyOptions.find(
        (c) => c.name === defaultValues.company?.name
      );
      console.log("companyMatch:", companyMatch);
      const venueMatch = venueOptions.find(
        (v) => v.name === defaultValues.venue?.name
      );
      const categoryMatch = categoryOptions.find(
        (c) => c.name === defaultValues.category?.name
      );
      const subcategoryMatch = subcategoryOptions.find(
        (s) => s.name === defaultValues.sub_category?.name
      );

      setForm({
        ...defaultValues,
        company_id: companyMatch?.id ?? defaultValues.company_id,
        company_name: companyMatch?.name ?? defaultValues.company_name,
        venue_id: venueMatch?.id ?? defaultValues.venue_id,
        category_id: categoryMatch?.id ?? defaultValues.category_id,
        subcategory_id: subcategoryMatch?.id ?? defaultValues.subcategory_id,
      });
    } else if (mode === "create") {
      setForm(defaultValues); // ✅ For create mode
    }
  }, [
    defaultValues,
    companyOptions,
    venueOptions,
    categoryOptions,
    subcategoryOptions,
    mode,
  ]);

  const handleChange = (field: string, value: string | number | null) => {
    setForm({ ...form, [field]: value });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 form:", form);
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block font-medium">Name</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          value={form.name ?? ""}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>

      <div>
        <label className="block font-medium">Number of attendees</label>
        <input
          type="number"
          className="w-full border px-3 py-2 rounded"
          value={form.total_attendees ?? ""}
          onChange={(e) =>
            handleChange("total_attendees", parseInt(e.target.value))
          }
        />
      </div>

      <div>
        <label className="block font-medium">Venue</label>
        <select
          className="w-full border px-3 py-2 rounded bg-white"
          value={form.venue_id ?? ""} // ✅ Fixed here: was form.name
          onChange={(e) => handleChange("venue_id", Number(e.target.value))}
        >
          <option value="" disabled>
            Select venue
          </option>
          {venueOptions.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </select>
      </div>

      {userRole === "admin" ? (
        <div>
          <label className="block font-medium">Company</label>
          <select
            className="w-full border px-3 py-2 rounded bg-white"
            value={form.company_id ?? ""}
            onChange={(e) => handleChange("company_id", Number(e.target.value))}
          >
            <option value="" disabled>
              Select company
            </option>
            {companyOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : form.company_id ? (
        <div>
          <label className="block font-medium">Company</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded bg-gray-100"
            value={
              companyOptions.find((c) => c.id === form.company_id)?.name ?? ""
            }
            readOnly
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Start Date</label>
          <input
            type="date"
            className="w-full border px-3 py-2 rounded"
            value={form.start_date?.slice(0, 10) ?? ""}
            onChange={(e) => handleChange("start_date", e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium">End Date</label>
          <input
            type="date"
            className="w-full border px-3 py-2 rounded"
            value={form.end_date?.slice(0, 10) ?? ""}
            onChange={(e) => handleChange("end_date", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block font-medium">Status</label>
        <select
          className="w-full border px-3 py-2 rounded bg-white"
          value={form.status ?? ""}
          onChange={(e) => handleChange("status", e.target.value)}
        >
          <option value="" disabled>
            Select status
          </option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0) + opt.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium">Category</label>
        <select
          className="w-full border px-3 py-2 rounded bg-white"
          value={form.category_id ?? ""}
          onChange={(e) => handleChange("category_id", Number(e.target.value))}
        >
          <option value="" disabled>
            Select category
          </option>
          {categoryOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium">Subcategory</label>
        <select
          className="w-full border px-3 py-2 rounded bg-white"
          value={form.subcategory_id ?? ""}
          onChange={(e) =>
            handleChange("subcategory_id", Number(e.target.value))
          }
        >
          <option value="" disabled>
            Select subcategory
          </option>
          {subcategoryOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium">Special Note</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          value={form.details ?? ""}
          onChange={(e) => handleChange("details", e.target.value)}
        />
      </div>

      <Button type="submit">{mode === "edit" ? "Update" : "Create"}</Button>
    </form>
  );
}
