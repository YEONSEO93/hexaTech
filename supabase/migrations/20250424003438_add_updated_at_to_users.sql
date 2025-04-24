    -- supabase/migrations/[timestamp]_add_updated_at_to_users.sql
    ALTER TABLE public.users
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()); 
    -- Optional: Add a trigger to automatically update this column on row changes
    -- CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.users 
    -- FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);