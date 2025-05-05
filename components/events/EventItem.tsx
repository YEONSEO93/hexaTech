"use client";

import { EventItem as EventType } from "./EventForm"; // 또는 types 파일에서 import

export default function EventItem({ event }: { event: EventType }) {
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const formattedDate = new Intl.DateTimeFormat("en-AU").format(date);
    console.log("Formatted date:", formattedDate);

    return formattedDate;
  }

  return (
    <li key={event.id} className="p-4 border rounded shadow-sm bg-white">
      <div className="font-bold text-lg">{event.name}</div>
      <div className="text-sm text-gray-600">
        {formatDate(event.start_date)} ~{" "}
        {event.end_date ? formatDate(event.end_date) : "N/A"} / {event.status}
      </div>
      <div className="text-sm">
        Company: {event.company.name} / Venue: {event.venue.name}
      </div>
      <div className="text-sm">
        Category: {event.category?.name ?? "N/A"} / Sub:{" "}
        {event.sub_category?.name ?? "N/A"}
      </div>
      {event.total_attendees && (
        <div className="text-sm">
          Total Attendees: {event.total_attendees} (
          {event.total_attendee_category})
        </div>
      )}
    </li>
  );
}
