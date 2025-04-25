"use client";

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import React, { useState, useEffect, useCallback } from "react"; 
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layouts/MainLayout";
import BaseTable, { BaseColumnProps } from "@/components/ui/base-table/base-table";
import { Database } from '@/types/supabase'; 
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type UserData = Pick<
  Database['public']['Tables']['users']['Row'], 
  'id' | 'name' | 'role' | 'created_at' | 'company' | 'updated_at' | 'profile_photo'
>;

export default function UsersPage() { 
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  const fetchUserRole = useCallback(async () => {
    setIsLoadingRole(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null);
        return;
      }
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (roleError) throw roleError;
      setUserRole(userData?.role as string ?? null);
    } catch (err) {
      console.error("Error fetching user role:", err);
      setUserRole(null);
    } finally {
      setIsLoadingRole(false);
    }
  }, [supabase]);

  const fetchUsers = useCallback(async () => { 
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        let errorMessage = `Failed to fetch users: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (response.status === 401 || errorData.error?.includes("Unauthorized") || errorData.error?.includes("No active session")) {
              errorMessage = "Please log in to view user data.";
          } else if (response.status === 403 || errorData.error?.includes("Forbidden")) {
               errorMessage = "You do not have permission to view this data.";
          }
           else {
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
      setError(err instanceof Error ? err.message : "An unknown network error occurred");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchUserRole();
    fetchUsers();
  }, [fetchUserRole, fetchUsers]); 

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
                  {rowData.name?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>
        ),
        style: { width: '80px', textAlign: 'center' }
      },
      {
        field: "name", 
        header: "Name", 
        sortable: true, 
        body: (rowData) => ( 
          <div>
            <span>{rowData.name || 'N/A'}</span>
            <span className="block text-xs text-gray-500">{rowData.id}</span>
          </div>
        )
      }, 
      { field: "role", header: "Role" },
      { field: "created_at", header: "Created At" },
      { field: "updated_at", header: "Updated At" },
      { field: "company", header: "Company" },
      {
        field: "id", 
        header: "Actions",
        body: (rowData) => (
          <Button
            size="sm"
            onClick={() => router.push(`/users/${rowData.id}/edit`)}
            disabled={userRole !== 'admin'}
          >
            Edit
          </Button>
        ),
        style: { width: 'auto', textAlign: 'center' }
      },
  ];

  return (
    <>
      <Sidebar />
      <MainLayout>
        <div className="flex items-center justify-between">
          <PageHeader title="User Management" />
          {!isLoadingRole && userRole === 'admin' && (
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
          {error && 
            <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
              <span className="font-medium">Error:</span> {error}
            </div>
          }
          {(loading || isLoadingRole) && <p>Loading...</p>} 
          {!loading && !isLoadingRole && users.length === 0 && !error && <p>No users found.</p>} 
          {!loading && !isLoadingRole && users.length > 0 && (
            <BaseTable
              value={users}
              columns={columns}
            />
          )}
        </div>
      </MainLayout>
    </>
  );
}
