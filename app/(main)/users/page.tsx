"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import BaseTable, {
  BaseColumnProps,
} from "@/components/ui/base-table/base-table";
import { Database } from "@/types/supabase";
import { useAuth } from "@/lib/hooks/useAuth";

type UserData = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  | "id"
  | "name"
  | "role"
  | "created_at"
  | "company"
  | "updated_at"
  | "profile_photo"
> & {
  company: { id: number; name: string } | null;
};

export default function UsersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setDeleteLoading(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteLoading(null);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        let errorMessage = `Failed to fetch users: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (
            response.status === 401 ||
            errorData.error?.includes("Unauthorized") ||
            errorData.error?.includes("No active session")
          ) {
            errorMessage = "Please log in to view user data.";
          } else if (
            response.status === 403 ||
            errorData.error?.includes("Forbidden")
          ) {
            errorMessage = "You do not have permission to view this data.";
          } else {
            errorMessage = errorData.error || errorMessage;
          }
        } catch (jsonError) {
          console.warn("Could not parse error response as JSON", jsonError);
        }
        setError(errorMessage);
        setUsers([]);
        return;
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        err instanceof Error ? err.message : "An unknown network error occurred"
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns: BaseColumnProps<UserData>[] = [
    {
      field: "profile_photo",
      header: "Profile",
      body: (rowData) => (
        <div className="flex items-center">
          {rowData.profile_photo ? (
            <img
              src={rowData.profile_photo}
              alt={`${rowData.name}'s profile`}
              className="object-cover w-10 h-10 rounded-full"
            />
          ) : (
            <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full">
              <span className="text-sm text-gray-500">
                {rowData.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
        </div>
      ),
      style: { width: "80px", textAlign: "center" },
    },
    {
      field: "name",
      header: "Name",
      sortable: true,
      body: (rowData) => (
        <div>
          <span>{rowData.name || "N/A"}</span>
          <span className="block text-xs text-gray-500">{rowData.id}</span>
        </div>
      ),
    },
    { field: "role", header: "Role" },
    { field: "created_at", header: "Created At" },
    { field: "updated_at", header: "Updated At" },
    {
      field: "company",
      header: "Company",
      body: (rowData) => <span>{rowData.company?.name || "N/A"}</span>,
    },
    {
      field: "id",
      header: "Actions",
      body: (rowData) =>
        isAdmin ? (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              onClick={() => router.push(`/users/${rowData.id}/edit`)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => handleDelete(rowData.id)}
              className="rounded-md bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700"

            >
              Delete
            </Button>
          </div>
        ) : null,
      style: { width: "auto", textAlign: "center" },
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="User Management" />
        {isAdmin && (
          <div className="px-8 py-4">
            <Button
              size="sm"
              className="px-6 py-2.5"
              onClick={() => router.push("/users/create")}
            >
              CREATE USER
            </Button>
          </div>
        )}
      </div>
      <div className="p-8">
        {error && (
          <div
            className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
            role="alert"
          >
            <span className="font-medium">Error:</span> {error}
          </div>
        )}
        {loading && <p>Loading...</p>}
        {!loading && users.length === 0 && !error && <p>No users found.</p>}
        {!loading && users.length > 0 && (
          <BaseTable value={users} columns={columns} />
        )}
      </div>
    </>
  );
}
