-- Migration: Fix jurisdiction constraint (2025-07-28)
-- Allow jurisdiction to be nullable or provide default value

-- Option 1: Make jurisdiction nullable
ALTER TABLE politicians ALTER COLUMN jurisdiction DROP NOT NULL;

-- Option 2: Set default value for existing null records
UPDATE politicians SET jurisdiction = 'Federal' WHERE jurisdiction IS NULL;

-- Option 3: Add default value for future inserts
ALTER TABLE politicians ALTER COLUMN jurisdiction SET DEFAULT 'Federal';

-- You can safely ignore any warnings about existing constraints. 