"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import LoadingSpinner from "@/components/loading-spinner";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Pie,
  Cell,
  Bar,
  ResponsiveContainer,
} from "recharts";

const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  {
    loading: () => (
      <div className="h-[300px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    ),
    ssr: false,
  }
);

const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), {
  loading: () => (
    <div className="h-[300px] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  ),
  ssr: false,
});

const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  loading: () => (
    <div className="h-[300px] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  ),
  ssr: false,
});

type Event = {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  total_attendees: number | null;
  total_attendee_category: string | null;
  venue: { name: string; location: string | null };
  company: { name: string };
  category: { name: string | null };
  sub_category: { name: string | null };
};

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events?limit=1000");
        const data = await response.json();
        setEvents(data.data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Dashboard" />
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-center items-center h-[100px]">
                <LoadingSpinner />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-center items-center h-[300px]">
                <LoadingSpinner />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title="Dashboard" />
        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-center text-gray-500">No events found.</p>
        </div>
      </div>
    );
  }

  const totalEvents = events.length;
  const topVenue = events.reduce((acc, curr) => {
    if (curr.venue?.name) {
      acc[curr.venue.name] = (acc[curr.venue.name] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const monthlyTrend = events.reduce((acc, event) => {
    if (event.start_date) {
      const month = new Date(event.start_date).toLocaleString("default", {
        month: "short",
      });
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const categoryData = events.reduce((acc, event) => {
    const category = event.category?.name || "Unknown";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const collaboratorData = events.reduce((acc, event) => {
    const companyName = event.company?.name || "Unknown";
    const category = event.category?.name || "Unknown";

    if (!acc[companyName]) {
      acc[companyName] = {};
    }
    acc[companyName][category] = (acc[companyName][category] || 0) + 1;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const subCategoryData = events.reduce((acc, event) => {
    const subCategory = event.sub_category?.name || "Unknown";
    acc[subCategory] = (acc[subCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events
    .filter((event) => {
      if (!event.start_date) return false;
      const eventDate = new Date(event.start_date);
      return eventDate >= today && event.status === "ANNOUNCED";
    })
    .sort((a, b) => {
      if (!a.start_date || !b.start_date) return 0;
      return (
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
    })
    .slice(0, 6);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <div className="relative p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold">Total Events</h3>
          <p className="text-3xl font-bold">{totalEvents}</p>
        </div>
        <div className="relative p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold">Top Venue</h3>
          <p className="text-3xl font-bold">
            {Object.entries(topVenue).sort((a, b) => b[1] - a[1])[0]?.[0]}
          </p>
        </div>
        <div className="relative p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold">Event Status</h3>
          <p className="text-3xl font-bold">
            {events.filter((e) => e.status === "ANNOUNCED").length} Announced
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
        <div className="relative p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Event Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Object.entries(monthlyTrend).map(([month, count]) => ({
                  month,
                  count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Upcoming Events
          </h3>
          <div className="min-h-[300px]">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <h4 className="font-medium">{event.name}</h4>
                      <p className="text-sm text-gray-600">
                        {event.venue.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Date(event.start_date!).toLocaleDateString()}
                      </p>
                      <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded">
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="relative p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Event by Category
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(categoryData).map(([name, value]) => ({
                    name,
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(categoryData).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ paddingLeft: "20px" }}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Events by Sub-category
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(subCategoryData)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, value]) => ({ name, value }))}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Event by Collaborator
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(collaboratorData).map(
                  ([company, categories]) => ({
                    company,
                    ...categories,
                  })
                )}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(
                  events.reduce((acc, event) => {
                    acc[event.category?.name || "Unknown"] = true;
                    return acc;
                  }, {} as Record<string, boolean>)
                ).map((category, index) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="a"
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Top Locations
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(topVenue)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([name, count]) => ({ name, count }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
