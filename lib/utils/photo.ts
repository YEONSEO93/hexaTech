import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export async function selectAndValidatePhoto(options?: { minWidth?: number; minHeight?: number; maxSizeMB?: number }) {
  return new Promise<{ file?: File; error?: string }>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve({ error: "No file selected." });

      // Validate file type
      if (!file.type.startsWith("image/")) {
        return resolve({ error: "Only image files are allowed." });
      }

      // Validate file size
      const maxSize = (options?.maxSizeMB ?? 2) * 1024 * 1024;
      if (file.size > maxSize) {
        return resolve({ error: `File size must be less than ${options?.maxSizeMB ?? 2}MB.` });
      }

      // Validate image dimensions
      if (options?.minWidth || options?.minHeight) {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          if (
            (options.minWidth && img.width < options.minWidth) ||
            (options.minHeight && img.height < options.minHeight)
          ) {
            resolve({ error: `Image must be at least ${options.minWidth}x${options.minHeight}px.` });
          } else {
            resolve({ file });
          }
        };
        img.onerror = () => resolve({ error: "Invalid image file." });
      } else {
        resolve({ file });
      }
    };
    input.click();
  });
}

export async function uploadProfilePhotoToSupabase({
  file,
  userId,
  supabase,
  bucket = "profile-photos",
}: {
  file: File;
  userId: string;
  supabase: SupabaseClient<Database>;
  bucket?: string;
}): Promise<{ publicUrl?: string; error?: string }> {
  if (!file || !userId) return { error: "Missing file or user ID." };

  const ext = file.name.split(".").pop();
  const filePath = `${userId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { publicUrl: data.publicUrl };
}