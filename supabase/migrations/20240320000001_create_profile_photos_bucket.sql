-- Create a new bucket for profile photos with file size limit (5MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    true,
    5242880,  -- 5MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated users to upload their profile photo
CREATE POLICY "Allow authenticated users to upload their profile photo" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text AND
        (SELECT COUNT(*) FROM storage.objects
         WHERE bucket_id = 'profile-photos'
         AND (storage.foldername(name))[1] = auth.uid()::text) = 0
    );

-- Allow users to update their own profile photo
CREATE POLICY "Allow users to update their own profile photo" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profile-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to delete their own profile photo
CREATE POLICY "Allow users to delete their own profile photo" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profile-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow public read access to profile photos
CREATE POLICY "Allow public read access to profile photos" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'profile-photos');

-- Add trigger to automatically delete old profile photo when a new one is uploaded
CREATE OR REPLACE FUNCTION delete_old_profile_photo()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete any existing profile photos for the user
    DELETE FROM storage.objects
    WHERE bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = (storage.foldername(NEW.name))[1]
    AND name != NEW.name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_photo_cleanup
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    WHEN (NEW.bucket_id = 'profile-photos')
    EXECUTE FUNCTION delete_old_profile_photo();

COMMENT ON COLUMN public.users.profile_photo IS 'URL or path to the user''s profile photo in Supabase Storage'; 