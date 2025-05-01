"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import MainLayout from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/PageHeader";

type UserData = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  company: string | null;
  createdAt: string;
};

export default function EditUser() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error fetching user: ${response.statusText}`);
        }
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);
  return (
    <>
      <PageHeader title={`Edit User: ${user?.name || id}`} />
      <div className="p-8">
        {loading && <p>Loading user data...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {user && (
          <div className="space-y-2">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Name:</strong> {user.name || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Company:</strong> {user.company || 'N/A'}</p>
            <p><strong>Created At:</strong> {new Date(user.createdAt).toLocaleString()}</p>
          </div>
        )}
        {!loading && !user && !error && <p>User data could not be loaded.</p>}
      </div>
    </>
  );
}
