"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import BaseTable, {
  BaseColumnProps,
} from "@/components/ui/base-table/base-table";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

type EventItem = {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  status: string;
  total_attendees: number | null;
  total_attendee_category: string | null;
  venue?: { name: string };
  company?: { name: string };
  category?: { name: string };
  sub_category?: { name: string };
};

export default function EventList() {
  const { userRole } = useUser();
  const router = useRouter();

  // // test
  // const userRole = "admin" as "admin" | "viewer" | "collaborator";

  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [companyOptions, setCompanyOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const formattedDate = new Intl.DateTimeFormat("en-AU").format(date);

    return formattedDate;
  }

  const fetchEvents = async () => {
    setLoading(true);
    const offset = page * PAGE_SIZE;

    const res = await fetch(`/api/events?limit=${PAGE_SIZE}&offset=${offset}`);
    const data = await res.json();

    setEvents(data.data);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [page]);

  const handleDelete = async (id: number) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this event?"
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      alert("Event deleted successfully.");
      await fetchEvents();
    } catch (err) {
      alert("Error deleting event.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanyOptions(data));
  }, []);

  useEffect(() => {
    const offset = page * PAGE_SIZE;
    let url = `/api/events?limit=${PAGE_SIZE}&offset=${offset}`;

    if (selectedCompany !== null) {
      url += `&company_id=${selectedCompany}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.data);
        setTotal(data.total);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading events:", err);
        setError("Failed to load events");
        setLoading(false);
      });
  }, [page, selectedCompany]); // ✅ refresh the data when the page changes

  const columns: BaseColumnProps<EventItem>[] = [
    {
      field: "name",
      header: "Event Name",
      body: (row) => (
        <div>
          <span className="font-medium">{row.name}</span>
          {/* <span className="block text-xs text-gray-500">ID: {row.id}</span> */}
        </div>
      ),
    },
    {
      field: "status",
      header: "Status",
      body: (row) => <span>{row.status}</span>,
    },
    {
      field: "start_date",
      header: "Start Date",
      body: (row) => <span>{formatDate(row.start_date)}</span>,
    },
    {
      field: "end_date",
      header: "End Date",
      body: (row) => (
        <span>{row.end_date ? formatDate(row.end_date) : "-"} </span>
      ),
    },
    {
      field: "total_attendees",
      header: "Attendees",
      body: (row) => <span>{row.total_attendees ?? "-"}</span>,
    },
    {
      field: "total_attendee_category",
      header: "Attendee Category",
      body: (row) => <span>{row.total_attendee_category ?? "-"}</span>,
    },
    {
      field: "venue",
      header: "Venue",
      body: (row) => <span>{row.venue?.name ?? "-"}</span>,
    },
    {
      field: "company",
      header: "Company",
      body: (row) => <span>{row.company?.name ?? "-"}</span>,
    },
    {
      field: "category",
      header: "Category",
      body: (row) => <span>{row.category?.name ?? "-"}</span>,
    },
    {
      field: "sub_category",
      header: "Subcategory",
      body: (row) => <span>{row.sub_category?.name ?? "-"}</span>,
    },
    ...(userRole !== "viewer"
      ? [
          {
            field: "__actions" as keyof EventItem,
            header: "Actions",
            body: (row: EventItem) => (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => router.push(`/events/${row.id}/edit`)}
                  className="rounded-md bg-[#001F4D] font-semibold text-white hover:bg-[#001F4D]/90 focus:outline-none px-4 py-2 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="rounded-md bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ),
            style: { textAlign: "center" as const },
          },
        ]
      : []),
  ];

  if (loading) return <p>Loading events...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {userRole !== "collaborator" && (
        <div>
          <label className="block mb-1 font-medium">Filter by Company</label>
          <select
            value={selectedCompany ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCompany(val ? Number(val) : null);
              setPage(0);
            }}
            className="w-full border rounded px-3 py-2 bg-white"
          >
            <option value="">All Companies</option>
            {companyOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <BaseTable value={events} columns={columns} />
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
}
