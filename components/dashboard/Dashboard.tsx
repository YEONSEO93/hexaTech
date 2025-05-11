import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ExcelUploader from "./ExcelUploader";
import { PageHeader } from "../PageHeader";

export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setError("User not found");
          return;
        }

        setUser(authUser);

        const { data: userRecord, error: roleError } = await supabase
          .from("users")
          .select("role")
          .eq("id", authUser.id)
          .single();

        if (roleError || !userRecord?.role) {
          setError("Role not found");
          return;
        }

        setRole(userRecord.role);
      } catch (error) {
        console.error("Error in Dashboard:", error);
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
    <>
      <PageHeader title="Dashboard" />

      <div className="p-6 bg-white rounded-lg shadow">
        {user?.email && (
          <h2 className="text-3xl font-bold">
            Hi {user?.email || "Not logged in"}
          </h2>
        )}
        {role && <p className="text-gray-600">Role: {role}</p>}
        <ExcelUploader />
      </div>
    </>
  );
}
