"use client";

import { useState } from "react";

const STATUS_OPTIONS = ["PENDING", "ANNOUNCED"] as const;
const CATEGORY_OPTIONS = [
  "Mega Event",
  "Business Event",
  "Concert",
  "Mass Participation",
  "Major Event",
  "Key Cultural Event",
  "Trans/Infra Disrupt",
] as const;

const SUBCATEGORY_OPTIONS = [
  "Arts & Culture",
  "Business Event",
  "Lifestyle",
  "Music",
  "Sport (Non-Olympic / Paralympic)",
  "Sport (Olympic / Paralympic)",
  "STEM",
  "Trans/Infra Disrupt",
] as const;

type EventFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<EventItem>;
  onSubmit: (values: Partial<EventItem>) => void;
};

export type EventItem = {
  id: number;
  name: string;
  status: string;
  start_date: string;
  end_date?: string | null;
  total_attendees?: number | null;
  total_attendee_category?: string | null;
  venue: { name: string };
  company: { name: string };
  category?: { name: string };
  sub_category?: { name: string };
  details?: string | null;
};

export default function EventForm({
  mode,
  defaultValues = {},
  onSubmit,
}: EventFormProps) {
  const [form, setForm] = useState<Partial<EventItem>>(defaultValues);

  const handleChange = (field: string, value: string | number | null) => {
    setForm({ ...form, [field]: value });
  };

  const handleNestedChange = (
    field: "category" | "sub_category",
    value: string
  ) => {
    setForm({
      ...form,
      [field]: { name: value },
    });
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
        <input
          type="text"
          className="w-full border px-3 py-2 rounded bg-gray-100"
          value={form.venue?.name ?? ""}
          disabled
        />
      </div>

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
          value={form.category?.name ?? ""}
          onChange={(e) => handleNestedChange("category", e.target.value)}
        >
          <option value="" disabled>
            Select category
          </option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium">Subcategory</label>
        <select
          className="w-full border px-3 py-2 rounded bg-white"
          value={form.sub_category?.name ?? ""}
          onChange={(e) => handleNestedChange("sub_category", e.target.value)}
        >
          <option value="" disabled>
            Select subcategory
          </option>
          {SUBCATEGORY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
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

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {mode === "edit" ? "Update" : "Create"}
      </button>
    </form>
  );
}
