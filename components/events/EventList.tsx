"use client";

import { useEffect, useState } from "react";
import EventItem from "./EventItem";

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
        console.log("📦 Events from API:", data);
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
        <EventItem key={event.id} event={event} />
      ))}
    </ul>
  );
}
