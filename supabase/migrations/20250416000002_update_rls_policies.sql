-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Collaborators can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own must_change_password" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- Create updated policies
-- 1. Admin policy - full access to all users
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

-- 2. Users can view their own data
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (
    auth.uid() = id
  );

-- 3. Users can update their must_change_password flag
CREATE POLICY "Users can update their own must_change_password"
  ON users FOR UPDATE
  USING (
    auth.uid() = id
  )
  WITH CHECK (
    -- Only allow updating must_change_password field
    must_change_password IS NOT NULL AND
    -- Ensure other fields aren't being modified
    (
      SELECT COUNT(*)
      FROM jsonb_each(to_jsonb(NEW) - 'must_change_password')
      WHERE jsonb_each.value IS DISTINCT FROM (
        SELECT jsonb_each.value
        FROM jsonb_each(to_jsonb(OLD))
        WHERE jsonb_each.key = jsonb_each.key
      )
    ) = 0
  );

-- 4. Collaborators can view all users (useful for team features)
CREATE POLICY "Collaborators can view all users"
  ON users FOR SELECT
  USING (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'collaborator'
  );

-- 5. Service role can manage users
CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  USING (
    auth.role() = 'service_role'
  ); 