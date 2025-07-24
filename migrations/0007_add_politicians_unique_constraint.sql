-- Add unique constraint to politicians table for name and jurisdiction combination
-- This will prevent duplicate entries and enable proper ON CONFLICT handling

-- First, remove any existing duplicate entries to avoid constraint violation
DELETE FROM politicians 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM politicians 
    GROUP BY name, jurisdiction
);

-- Add the unique constraint
ALTER TABLE politicians 
ADD CONSTRAINT unique_name_jurisdiction UNIQUE (name, jurisdiction);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_politicians_name_jurisdiction 
ON politicians (name, jurisdiction); 