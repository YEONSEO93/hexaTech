-- First, update existing rows to ensure they have valid data
UPDATE users
SET name = 'Unknown User'
WHERE name IS NULL;

UPDATE users
SET company = 'Unknown Company'
WHERE company IS NULL;

-- Then, update the table structure
ALTER TABLE users
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN company SET NOT NULL,
  ADD COLUMN IF NOT EXISTS profile_photo TEXT; 