"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

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

// Brisbane brand colors (based on the brand image)
const BRISBANE_COLORS = {
  navy: "#001F4D", // Navy blue (main color) - maintained
  softPink: "#FF9ECD", // Vibrant pink
  circuitBlue: "#00D6E1", // Bright cyan blue
  softYellow: "#FFD034", // Bright yellow
  mintGreen: "#40E0D0", // Bright mint
  white: "#FFFFFF", // White
  background: "#1A1F3B", // Background navy
};

const PERCENTAGE_THRESHOLD = 5; // 5% threshold for grouping into 'Others'

const processDataWithThreshold = (data: Record<string, number>) => {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const mainData: { name: string; value: number }[] = [];
  let othersTotal = 0;
  const othersDetails: { name: string; value: number }[] = [];

  Object.entries(data)
    .sort((a, b) => b[1] - a[1]) // Sort by value descending
    .forEach(([name, value]) => {
      const percentage = (value / total) * 100;
      if (percentage >= PERCENTAGE_THRESHOLD) {
        mainData.push({ name, value });
      } else {
        othersTotal += value;
        othersDetails.push({ name, value });
      }
    });

  if (othersTotal > 0) {
    mainData.push({ name: "Others", value: othersTotal });
  }

  return { mainData, othersDetails };
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (!events || events.length === 0)
    return <div className="p-6">No events found.</div>;

  // Calculate summary data
  const totalEvents = events.length;
  const topVenue = events.reduce((acc, curr) => {
    if (curr.venue?.name) {
      acc[curr.venue.name] = (acc[curr.venue.name] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Monthly trend data
  const monthlyTrend = events.reduce((acc, event) => {
    if (event.start_date) {
      const date = new Date(event.start_date);
      const monthKey = date.toISOString().substring(0, 7); // Keep YYYY-MM for sorting
      const monthDisplay = String(date.getMonth() + 1).padStart(2, "0");
      // Australian date format for tooltip
      const fullDate = `${monthDisplay}/${date.getFullYear()}`;

      acc[monthKey] = {
        display: monthDisplay, // Only show month in axis
        fullDate, // For tooltip
        count: (acc[monthKey]?.count || 0) + 1,
      };
    }
    return acc;
  }, {} as Record<string, { display: string; fullDate: string; count: number }>);

  // Sort data chronologically (oldest to newest)
  const sortedMonthlyData = Object.entries(monthlyTrend)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([, data]) => ({
      month: data.display,
      fullDate: data.fullDate,
      count: data.count,
    }));

  // Category distribution
  const categoryData = events.reduce((acc, event) => {
    const category = event.category?.name || "Unknown";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate event distribution by company and category
  const collaboratorData = events.reduce((acc, event) => {
    const companyName = event.company?.name || "Unknown";
    const category = event.category?.name || "Unknown";

    if (!acc[companyName]) {
      acc[companyName] = {};
    }
    acc[companyName][category] = (acc[companyName][category] || 0) + 1;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // Calculate event distribution by sub-category
  const subCategoryData = events.reduce((acc, event) => {
    const subCategory = event.sub_category?.name || "Unknown";
    acc[subCategory] = (acc[subCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get upcoming events (events after today with 'ANNOUNCED' status)
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
    .slice(0, 6); // Display top 6 upcoming events

  const { mainData: processedCategoryData, othersDetails: categoryOthers } =
    processDataWithThreshold(categoryData);

  const processedCollaboratorData = Object.entries(collaboratorData)
    .filter(([, categories]) => {
      const total = Object.values(categories).reduce(
        (sum, count) => sum + count,
        0
      );
      return total >= 3; // Only show companies with 3 or more events
    })
    .map(([company, categories]) => {
      const total = Object.values(categories).reduce(
        (sum, count) => sum + count,
        0
      );
      let othersTotal = 0;
      const processedCategories: Record<string, number> = {};

      // Sort categories by count and calculate percentages
      Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          const percentage = (count / total) * 100;
          if (percentage >= PERCENTAGE_THRESHOLD) {
            processedCategories[category] = count;
          } else {
            othersTotal += count;
          }
        });

      // Add Others category if there are small categories
      if (othersTotal > 0) {
        processedCategories["Others"] = othersTotal;
      }

      return {
        company,
        ...processedCategories,
      };
    });

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <div
          className="p-4 bg-white rounded-lg shadow"
          style={{ borderTop: `4px solid ${BRISBANE_COLORS.navy}` }}
        >
          <h3 className="text-lg font-semibold">Total Events</h3>
          <p className="text-3xl font-bold">{totalEvents}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold">Top Venue</h3>
          <p className="text-3xl font-bold">
            {Object.entries(topVenue).sort((a, b) => b[1] - a[1])[0]?.[0]}
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold">Event Status</h3>
          <p className="text-3xl font-bold">
            {events.filter((e) => e.status === "ANNOUNCED").length} Announced
          </p>
        </div>
      </div>

      {/* Event Trend and Upcoming Events */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
        {/* Event Trend */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Event Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sortedMonthlyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={BRISBANE_COLORS.softPink}
                opacity={0.1}
              />
              <XAxis
                dataKey="month"
                interval={0}
                tick={{ fill: BRISBANE_COLORS.navy, fontSize: 12 }}
              />
              <YAxis tick={{ fill: BRISBANE_COLORS.navy }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: BRISBANE_COLORS.white,
                  borderColor: BRISBANE_COLORS.navy,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(
                  value: ValueType,
                  name: NameType,
                  item: {
                    payload?: {
                      fullDate: string;
                    };
                  }
                ) => {
                  if (item?.payload?.fullDate) {
                    return [`${value} events`, item.payload.fullDate];
                  }
                  return ["0 events", ""];
                }}
              />
              <Legend wrapperStyle={{ color: BRISBANE_COLORS.navy }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={BRISBANE_COLORS.navy}
                strokeWidth={2}
                dot={{ fill: BRISBANE_COLORS.navy }}
                activeDot={{
                  fill: BRISBANE_COLORS.softPink,
                  stroke: BRISBANE_COLORS.navy,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Events */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Upcoming Events
          </h3>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <h4 className="font-medium">{event.name}</h4>
                    <p className="text-sm text-gray-600">{event.venue.name}</p>
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

      {/* Main grid layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Event Category Distribution */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Event by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processedCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {processedCategoryData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      [
                        BRISBANE_COLORS.navy,
                        BRISBANE_COLORS.circuitBlue,
                        BRISBANE_COLORS.softYellow,
                        BRISBANE_COLORS.softPink,
                        BRISBANE_COLORS.mintGreen,
                      ][index % 5]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: BRISBANE_COLORS.white,
                  borderColor: BRISBANE_COLORS.navy,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "Others") {
                    const details = categoryOthers
                      .map((item) => `${item.name}: ${item.value}`)
                      .join("\n");
                    return [`${value} events`, `Details:\n${details}`];
                  }
                  return [`${value} events`, name];
                }}
              />
              <Legend wrapperStyle={{ color: BRISBANE_COLORS.navy }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sub-category Distribution */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Events by Sub-category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(subCategoryData)
                .sort((a, b) => b[1] - a[1])
                .map(([name, value]) => ({ name, value }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={BRISBANE_COLORS.softPink}
                opacity={0.1}
              />
              <XAxis type="number" tick={{ fill: BRISBANE_COLORS.navy }} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 12, fill: BRISBANE_COLORS.navy }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: BRISBANE_COLORS.white,
                  borderColor: BRISBANE_COLORS.navy,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="value" fill={BRISBANE_COLORS.navy} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Event by Collaborator (Stacked Bar Chart) */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Event by Collaborator
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={processedCollaboratorData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={BRISBANE_COLORS.softPink}
                opacity={0.1}
              />
              <XAxis
                dataKey="company"
                tick={{ fill: BRISBANE_COLORS.navy, fontSize: 12 }}
              />
              <YAxis tick={{ fill: BRISBANE_COLORS.navy }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: BRISBANE_COLORS.white,
                  borderColor: BRISBANE_COLORS.navy,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend wrapperStyle={{ color: BRISBANE_COLORS.navy }} />
              {Array.from(
                new Set(
                  processedCollaboratorData.flatMap((data) =>
                    Object.keys(data).filter((key) => key !== "company")
                  )
                )
              ).map((category, index) => (
                <Bar
                  key={category}
                  dataKey={category}
                  stackId="a"
                  fill={
                    [
                      BRISBANE_COLORS.navy,
                      BRISBANE_COLORS.circuitBlue,
                      BRISBANE_COLORS.softYellow,
                      BRISBANE_COLORS.softPink,
                      BRISBANE_COLORS.mintGreen,
                    ][index % 5]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Locations Chart */}
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-700">
            Top Locations
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(topVenue)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }))}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={BRISBANE_COLORS.softPink}
                opacity={0.1}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: BRISBANE_COLORS.navy, fontSize: 12 }}
              />
              <YAxis tick={{ fill: BRISBANE_COLORS.navy }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: BRISBANE_COLORS.white,
                  borderColor: BRISBANE_COLORS.navy,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar
                dataKey="count"
                fill={BRISBANE_COLORS.navy}
                activeBar={{ fill: BRISBANE_COLORS.softYellow }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
