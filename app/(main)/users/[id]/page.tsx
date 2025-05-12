import { notFound, redirect } from "next/navigation";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";

async function getUserData(
  supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id, 
      name, 
      email, 
      role, 
      company_id,
      company:company(id, name),
      created_at, 
      updated_at
    `
    )
    .eq("id", userId)
    .single();

  if (error) {
    console.error(`Error fetching user data for ID ${userId}:`, error);
    return null;
  }
  return data;
}

type UserProfilePageProps = {
  params: {
    id: string;
  };
};

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const supabase = createSupabaseServerComponentClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "UserProfilePage: No valid user found by getUser(), redirecting to login.",
      userError
    );
    redirect("/login");
  }

  const loggedInUser = user;

  let loggedInUserRole:
    | Database["public"]["Tables"]["users"]["Row"]["role"]
    | null = null;

  try {
    const { data: roleData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", loggedInUser.id)
      .single();

    if (roleError) throw roleError;
    if (!roleData) throw new Error("Role data not found.");

    loggedInUserRole = roleData.role;
  } catch (error) {
    console.error(
      `UserProfilePage: Failed to fetch role for logged-in user ${loggedInUser.id}.`,
      error
    );
    return <div className="p-6">Error: Could not verify your permissions.</div>;
  }

  const awaitedParams = await params;
  const targetUserId = awaitedParams.id;

  const isAdmin = loggedInUserRole === "admin";
  const isOwnProfile = loggedInUser.id === targetUserId;

  if (!isAdmin && !isOwnProfile) {
    console.warn(
      `UserProfilePage: Unauthorized access attempt by ${loggedInUser.id} (role: ${loggedInUserRole}) to view profile ${targetUserId}.`
    );
    return (
      <div className="p-6">
        Error: You do not have permission to view this profile.
      </div>
    );
  }

  const userProfile = await getUserData(supabase, targetUserId);

  if (!userProfile) {
    notFound();
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">User Profile</h1>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            User Information
          </h3>
          <p className="max-w-2xl mt-1 text-sm text-gray-500">
            Details for user {userProfile.name}.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="px-4 py-5 bg-gray-50 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {userProfile.name}
              </dd>
            </div>
            <div className="px-4 py-5 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Email address
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {userProfile.email}
              </dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Company</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {userProfile.company?.name ?? "N/A"}
              </dd>
            </div>
            <div className="px-4 py-5 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize sm:mt-0 sm:col-span-2">
                {userProfile.role}
              </dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(userProfile.created_at).toLocaleString()}
              </dd>
            </div>
            <div className="px-4 py-5 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {userProfile.updated_at
                  ? new Date(userProfile.updated_at).toLocaleString()
                  : "N/A"}
              </dd>
            </div>
            {/* Add more fields as needed */}
          </dl>
        </div>
      </div>
      {/* Optionally add edit/delete buttons for Admins or if it's own profile */}
    </div>
  );
}
