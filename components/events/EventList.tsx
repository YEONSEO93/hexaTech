// "use client";

// import { useEffect, useState } from "react";
// import EventItem from "./EventItem";

// type EventItem = {
//   id: number;
//   name: string;
//   start_date: string;
//   end_date: string | null;
//   status: string;
//   total_attendees: number | null;
//   total_attendee_category: string | null;
//   venue: { name: string };
//   company: { name: string };
//   category: { name: string };
//   sub_category: { name: string };
// };

// export default function EventList() {
//   const [events, setEvents] = useState<EventItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetch("/api/events")
//       .then((res) => res.json())
//       .then((data) => {
//         console.log("📦 Events from API:", data);
//         setEvents(data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Error loading events:", err);
//         setError("Failed to load events");
//         setLoading(false);
//       });
//   }, []);

//   if (loading) return <p>Loading events...</p>;
//   if (error) return <p className="text-red-600">{error}</p>;

//   return (
//     <ul className="space-y-4">
//       {events.map((event) => (
//         <EventItem key={event.id} event={event} />
//       ))}
//     </ul>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import BaseTable, {
  BaseColumnProps,
} from "@/components/ui/base-table/base-table";

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
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const formattedDate = new Intl.DateTimeFormat("en-AU").format(date);
    console.log("Formatted date:", formattedDate);

    return formattedDate;
  }

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 Events from API:", data);
        console.log("✅ Final parsed data:", data.events);
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading events:", err);
        setError("Failed to load events");
        setLoading(false);
      });
  }, []);

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
  ];

  if (loading) return <p>Loading events...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <BaseTable value={events} columns={columns} />
    </div>
  );
}

// return (
//   <li key={event.id} className="p-4 border rounded shadow-sm bg-white">
//     <div className="font-bold text-lg">{event.name}</div>
//     <div className="text-sm text-gray-600">
//       {formatDate(event.start_date)} ~{" "}
//       {event.end_date ? formatDate(event.end_date) : "N/A"} / {event.status}
//     </div>
//     <div className="text-sm">
//       Company: {event.company.name} / Venue: {event.venue.name}
//     </div>
//     <div className="text-sm">
//       Category: {event.category?.name ?? "N/A"} / Sub:{" "}
//       {event.sub_category?.name ?? "N/A"}
//     </div>
//     {event.total_attendees && (
//       <div className="text-sm">
//         Total Attendees: {event.total_attendees} (
//         {event.total_attendee_category})
//       </div>
//     )}
//   </li>
// );
