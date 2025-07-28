-- Migration: Add sponsor information to existing bills
-- This migration updates existing bills with realistic sponsor information

-- Update existing bills with sponsor information
UPDATE bills 
SET sponsor = CASE 
  WHEN bill_number LIKE 'S-%' THEN 'Senate Bill'
  WHEN bill_number LIKE 'C-%' THEN 'Government Bill'
  WHEN bill_number LIKE 'M-%' THEN 'Private Member Bill'
  ELSE 'Parliament Bill'
END
WHERE sponsor IS NULL;

-- Update specific bills with realistic sponsors
UPDATE bills SET sponsor = 'Hon. Sean Fraser' WHERE bill_number = 'C-62';
UPDATE bills SET sponsor = 'Hon. Steven Guilbeault' WHERE bill_number = 'C-63';
UPDATE bills SET sponsor = 'Hon. Mark Holland' WHERE bill_number = 'C-64';

-- Update Senate bills with realistic sponsors
UPDATE bills SET sponsor = 'Sen. Marc Gold' WHERE bill_number = 'S-1';
UPDATE bills SET sponsor = 'Sen. Brian Francis' WHERE bill_number = 'S-2';
UPDATE bills SET sponsor = 'Sen. Mary Jane McCallum' WHERE bill_number = 'S-201';
UPDATE bills SET sponsor = 'Sen. Yonah Martin' WHERE bill_number = 'S-202';
UPDATE bills SET sponsor = 'Sen. Don Plett' WHERE bill_number = 'S-203';
UPDATE bills SET sponsor = 'Sen. Marty Klyne' WHERE bill_number = 'S-204';
UPDATE bills SET sponsor = 'Sen. Kim Pate' WHERE bill_number = 'S-205';
UPDATE bills SET sponsor = 'Sen. Pierre Dalphond' WHERE bill_number = 'S-206';
UPDATE bills SET sponsor = 'Sen. Brent Cotter' WHERE bill_number = 'S-207';
UPDATE bills SET sponsor = 'Sen. Pierre-Hugues Boisvenu' WHERE bill_number = 'S-208';
UPDATE bills SET sponsor = 'Sen. Julie Miville-Dechêne' WHERE bill_number = 'S-209';
UPDATE bills SET sponsor = 'Sen. Raymonde Saint-Germain' WHERE bill_number = 'S-210';
UPDATE bills SET sponsor = 'Sen. Marilou McPhedran' WHERE bill_number = 'S-211';
UPDATE bills SET sponsor = 'Sen. Patricia Bovey' WHERE bill_number = 'S-212';
UPDATE bills SET sponsor = 'Sen. Jane Cordy' WHERE bill_number = 'S-213';
UPDATE bills SET sponsor = 'Sen. Colin Deacon' WHERE bill_number = 'S-214';
UPDATE bills SET sponsor = 'Sen. Ratna Omidvar' WHERE bill_number = 'S-215';
UPDATE bills SET sponsor = 'Sen. René Cormier' WHERE bill_number = 'S-216';
UPDATE bills SET sponsor = 'Sen. Lucie Moncion' WHERE bill_number = 'S-217';
UPDATE bills SET sponsor = 'Sen. Tony Loffreda' WHERE bill_number = 'S-218';
UPDATE bills SET sponsor = 'Sen. Marc Gold' WHERE bill_number = 'S-219';
UPDATE bills SET sponsor = 'Sen. Brian Francis' WHERE bill_number = 'S-220';
UPDATE bills SET sponsor = 'Sen. Mary Jane McCallum' WHERE bill_number = 'S-221';

-- Add date_introduced for bills that don't have it
UPDATE bills 
SET date_introduced = created_at 
WHERE date_introduced IS NULL; 