-- Insert admin2 user if not exists
INSERT INTO users (id, email, role, must_change_password)
VALUES (
  '08966d3c-c431-4f3d-8ef2-56142989efb2',  -- This is the admin2 user ID from your JWT
  'admin2@hexatech.com',                     -- Admin2 email
  'admin',                                   -- Role
  false                                      -- No need to change password
)
ON CONFLICT (id) DO NOTHING;                 -- Don't error if already exists 