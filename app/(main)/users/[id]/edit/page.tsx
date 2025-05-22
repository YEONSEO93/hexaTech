"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { createSupabaseClientComponentClient } from "@/lib/supabase/client";
import Image from "next/image";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  company: { name: string; id: number } | null;
  createdAt: string;
  profile_photo: string | null;
};

export default function EditUser() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createSupabaseClientComponentClient();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const isEmailOnlyEditable = currentUserRole === 'collaborator' || currentUserRole === 'viewer';

  useEffect(() => {
    if (!id) return;

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Error fetching user: ${response.statusText}`
          );
        }
        const data = await response.json();
        setUser(data.user);
        setFormData(data.user);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Fetch current logged-in user's role
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserRole(user?.user_metadata?.role || null);
    };
    fetchCurrentUser();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image.');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Delete old avatar if exists
      if (formData.profile_photo) {
        const oldPath = formData.profile_photo.split('/').pop();
        if (oldPath) {
          const { error: deleteError } = await supabase.storage
            .from('profile-photos')
            .remove([oldPath]);

          if (deleteError) {
            console.error('Error deleting old avatar:', deleteError);
            // Continue with upload even if delete fails
          }
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        profile_photo: publicUrl
      }));

      setSuccessMessage('Profile photo updated successfully');

    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccessMessage('User updated successfully');
      setUser(data.user);

      // Refresh the page data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating the user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title={`Edit User: ${user?.name || id}`} />
      <div className="p-8">
        {loading && <p>Loading user data...</p>}
        {error && <p className="mb-4 text-red-500">Error: {error}</p>}
        {successMessage && <p className="mb-4 text-green-500">{successMessage}</p>}

        {user && (
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-24 h-24">
                  {formData.profile_photo ? (
                    <Image
                      src={formData.profile_photo}
                      alt="Profile"
                      fill
                      className="object-cover rounded-full"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center w-24 h-24 bg-gray-200 rounded-full">
                      <span className="text-2xl text-gray-400">
                        {formData.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="profile_photo" className="block text-sm font-medium text-gray-700">
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    id="profile_photo"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading || isEmailOnlyEditable}
                    className="block w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {uploading && <p className="mt-1 text-sm text-gray-500">Uploading...</p>}
                  <p className="mt-1 text-sm text-gray-500">
                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  required
                  disabled={isEmailOnlyEditable}
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  required
                  disabled={false}
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role || ''}
                  disabled
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company?.name || ''}
                  onChange={handleInputChange}
                  required
                  disabled={isEmailOnlyEditable}
                  className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {!loading && !user && !error && <p>User data could not be loaded.</p>}
      </div>
    </>
  );
}
