-- Migration: Add electoral voting system
-- Date: 2025-01-20

-- Electoral candidates table
CREATE TABLE IF NOT EXISTS electoral_candidates (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  party VARCHAR NOT NULL,
  position VARCHAR NOT NULL,
  jurisdiction VARCHAR DEFAULT 'Federal',
  image_url VARCHAR,
  bio TEXT,
  key_policies TEXT[],
  trust_score DECIMAL(5,2) DEFAULT 50.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Electoral votes table
CREATE TABLE IF NOT EXISTS electoral_votes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  candidate_id INTEGER NOT NULL REFERENCES electoral_candidates(id),
  vote_type VARCHAR NOT NULL,
  reasoning TEXT,
  verification_id VARCHAR NOT NULL UNIQUE,
  block_hash VARCHAR NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, candidate_id)
);

-- Insert initial electoral candidates
INSERT INTO electoral_candidates (name, party, position, jurisdiction, bio, key_policies, trust_score) VALUES
('Mark Carney', 'Liberal Party', 'Prime Minister of Canada', 'Federal', 
 'Former Bank of Canada Governor and Bank of England Governor. Appointed Prime Minister in 2025, bringing significant financial expertise to government leadership.',
 ARRAY['Economic stability', 'Climate action', 'Financial regulation', 'International cooperation'],
 75.00),
('Pierre Poilievre', 'Conservative Party', 'Leader of the Opposition', 'Federal',
 'Conservative Party leader known for his focus on economic issues, inflation concerns, and cryptocurrency advocacy.',
 ARRAY['Economic freedom', 'Reduced government spending', 'Digital currency', 'Common sense policies'],
 65.00),
('Yves-François Blanchet', 'Bloc Québécois', 'Party Leader', 'Federal',
 'Leader of the Bloc Québécois, advocating for Quebec''s interests and sovereignty within the Canadian federation.',
 ARRAY['Quebec sovereignty', 'French language protection', 'Provincial autonomy', 'Cultural preservation'],
 70.00),
('Don Davies', 'New Democratic Party', 'Interim Leader', 'Federal',
 'Interim leader of the NDP, continuing the party''s tradition of progressive policies and social justice advocacy.',
 ARRAY['Universal healthcare', 'Social justice', 'Climate action', 'Workers'' rights'],
 72.00),
('Elizabeth May', 'Green Party', 'Party Leader', 'Federal',
 'Long-time leader of the Green Party, environmental advocate, and former MP for Saanich—Gulf Islands.',
 ARRAY['Climate emergency', 'Environmental protection', 'Social justice', 'Electoral reform'],
 78.00);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_electoral_votes_user_id ON electoral_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_electoral_votes_candidate_id ON electoral_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_electoral_votes_timestamp ON electoral_votes(timestamp);
CREATE INDEX IF NOT EXISTS idx_electoral_candidates_party ON electoral_candidates(party); 