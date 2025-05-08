"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

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
  venue_id: number;
  company_id: number;
  category_id?: number;
  subcategory_id?: number;
  details?: string | null;
};

export default function EventForm({
  mode,
  defaultValues = {},
  onSubmit,
}: EventFormProps) {
  console.log("📦 defaultValues:", defaultValues);
  const [form, setForm] = useState<Partial<EventItem>>(defaultValues);
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
    const supabase = createClientComponentClient<Database>();

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

      if (venueData)
        setVenueOptions(venueData as { id: number; name: string }[]);
      if (companyData)
        if (categoryData)
          setCategoryOptions(categoryData as { id: number; name: string }[]);
      if (subcategoryData)
        setSubcategoryOptions(
          subcategoryData as { id: number; name: string }[]
        );
    };

    fetchAllOptions();
  }, []);

  const handleChange = (field: string, value: string | number | null) => {
    setForm({ ...form, [field]: value });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
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
          value={form.venue_id ?? ""}
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

      {defaultValues.company_name && (
        <div>
          <label className="block font-medium">Company</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded bg-gray-100"
            value={defaultValues.company_name}
            readOnly
          />
        </div>
      )}

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
