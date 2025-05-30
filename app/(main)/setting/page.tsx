"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconUser } from "@/components/icon/IconUser";
import { PageHeader } from "@/components/PageHeader";
import { SettingsLayout } from "@/components/layouts/SettingsLayout";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { selectAndValidatePhoto, uploadProfilePhotoToSupabase } from "@/lib/utils/photo";
import { createSupabaseClientComponentClient } from "@/lib/supabase/client";
import { use, useState } from "react";
import FeedbackMessage from "@/components/ui/feedback-message";
import { set } from "zod";

export default function Setting() {
  const { userProfile, refetch } = useUserProfile();
  const supabase = createSupabaseClientComponentClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUploadPhoto = async () => {
    const { file, error } = await selectAndValidatePhoto({
      minWidth: 400,
      minHeight: 400,
      maxSizeMB: 2,
    });
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    if (!file || !userProfile?.id) return;

    setLoading(true);

    const { publicUrl, error: uploadError } = await uploadProfilePhotoToSupabase({
      file,
      userId: userProfile.id,
      supabase,
    });

    if (uploadError) {
      setError(uploadError);
      setLoading(false);
      return;
    }


    // Update user in database with new photo URL 
    const { error: dbError } = await supabase
      .from("users")
      .update({ profile_photo: publicUrl })
      .eq("id", userProfile.id);

    if (dbError) {
      setError("Failed to update profile photo.");
      setLoading(false);
      return;
    }

    setLoading(false);
    refetch(); // Refetch user profile to update UI
  };

  const handleRemovePhoto = async () => {
    if (!userProfile?.id) return;
    setError(null);

    // Remove photo from user profile in DB
    const { error } = await supabase
      .from("users")
      .update({ profile_photo: null })
      .eq("id", userProfile.id);

    if (error) {
      setError("Failed to remove profile photo.");
    } else {
      refetch(); // Refetch user profile to update UI
      return;
    }
  };

  return (
    <>
      <PageHeader title="Settings" />
      <SettingsLayout currentPath="profile">
        <>
          <h2 className="text-xl font-semibold mb-6">Profile Photo</h2>
          <div className="flex items-start gap-8 mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
                {userProfile?.profile_photo ? (
                  <img
                    src={userProfile.profile_photo}
                    alt="Profile"
                    className="object-cover w-full h-full rounded-full"
                  />
                ) : (
                  <IconUser className="w-16 h-16 text-gray-400" />
                )}
              </div>
            </div>

            <div>
              <Button disabled={loading} onClick={handleUploadPhoto}>{loading ? "Uploading" : "Upload Photo"}</Button>
              <button onClick={handleRemovePhoto} className="text-red-500 px-4 py-2 ml-2 hover:text-red-700">
                {"Remove"}
              </button>
              <div className="mt-2 text-sm text-gray-600">
                <p>Image requirments:</p>
                <ul className="list-disc ml-4 mt-1">
                  <li>Min. 400 x 400px</li>
                  <li>Max. 2MB</li>
                  <li>Your face or company logo</li>
                </ul>
              </div>
            </div>
          </div>
          {error && (
            <FeedbackMessage type="error" message={error} />
          )}

          <h2 className="text-xl font-semibold mb-6">User Details</h2>
          {/* all inputs are read-only except for profile photo */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Input
                id="Name"
                label="Name"
                placeholder="Enter your first name"
                disabled
                value={userProfile?.name || ""}
              />

              <Input
                id="company"
                label="Company"
                placeholder="Enter your company name"
                disabled
                value={userProfile?.company || ""}
              />
            </div>
          </div>
        </>

      </SettingsLayout>
    </>
  );
}
