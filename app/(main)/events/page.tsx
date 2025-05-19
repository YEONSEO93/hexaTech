// app/(main)/events/page.tsx
"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import { Dashboard } from "@/components/dashboard/Dashboard";
import LoadingSpinner from "@/components/loading-spinner";

// Dynamic import with loading
const EventList = dynamic(() => import("@/components/events/EventList"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

export default function EventsPage() {
  const { userRole } = useUser();

  // // test
  // const userRole = "admin" as "admin" | "viewer" | "collaborator";

  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Events List" />
        <div className="px-8 py-4">
          {userRole !== "viewer" && (
            <Button
              size="sm"
              className="px-6 py-2.5"
              onClick={() => router.push("/events/create-event")}
            >
              CREATE EVENT
            </Button>
          )}
        </div>
      </div>
      <div className="p-6 mb-6 bg-white rounded-lg shadow">
        <EventList />
      </div>

      {/* Dashboard section - only visible for admin */}
      {userRole === "admin" && (
        <div className="p-6 bg-white rounded-lg shadow">
          <Dashboard />
        </div>
      )}
    </>
  );
}
