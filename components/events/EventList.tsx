"use client";

import { useEffect, useState } from "react";

type EventItem = {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  status: string;
  total_attendees: number | null;
  total_attendee_category: string | null;
  venue: { name: string };
  company: { name: string };
  category: { name: string };
  sub_category: { name: string };
};

export default function EventList() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading events:", err);
        setError("Failed to load events");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading events...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <ul className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="p-4 border rounded shadow-sm bg-white">
          <div className="font-bold text-lg">{event.name}</div>
          <div className="text-sm text-gray-600">
            {event.start_date} ~ {event.end_date ?? "N/A"} / {event.status}
          </div>
          <div className="text-sm">
            Company: {event.company.name} / Venue: {event.venue.name}
          </div>
          <div className="text-sm">
            Category: {event.category.name} / Sub: {event.sub_category.name}
          </div>
          {event.total_attendees && (
            <div className="text-sm">
              Total Attendees: {event.total_attendees} (
              {event.total_attendee_category})
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
