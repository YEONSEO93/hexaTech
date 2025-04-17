-- Insert admin user if not exists
INSERT INTO users (id, email, role, must_change_password)
VALUES (
  'e4ec3fc7-45f0-4138-b7c4-e6de97f52327',  -- This is the admin user ID from your JWT
  'admin@hexatech.com',                     -- Admin email
  'admin',                                  -- Role
  false                                     -- No need to change password
)
ON CONFLICT (id) DO NOTHING;                -- Don't error if already exists 