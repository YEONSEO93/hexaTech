import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ExcelUploader from "./ExcelUploader";

export function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) {
          throw new Error("User not found");
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (userError) {
          throw new Error("Failed to fetch user data");
        }

        const combinedUser = {
          ...authUser,
          user_metadata: {
            ...authUser.user_metadata,
            role: userData.role,
          },
        };

        setUser(combinedUser);
      } catch (error) {
        console.error("Error in AdminDashboard:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      }
    };
    fetchUser();
  }, [supabase]);

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 bg-red-100 rounded-lg shadow">
          <h2 className="text-xl font-bold text-red-800">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        {user?.email && (
          <h2 className="text-3xl font-bold">
            Hi {user?.email || "Not logged in"}
          </h2>
        )}
        {user?.user_metadata?.role && (
          <p className="text-gray-600">Role: {user.user_metadata.role}</p>
        )}
      </div>
      <ExcelUploader />
    </div>
  );
}
