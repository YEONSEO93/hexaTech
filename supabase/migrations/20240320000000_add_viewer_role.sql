-- Add viewer role to users table role constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'collaborator'::text, 'viewer'::text])); 