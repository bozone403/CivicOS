-- Fix Legal System Database Schema
-- This script creates the missing tables and fixes schema issues

-- Create legal_acts table if it doesn't exist
CREATE TABLE IF NOT EXISTS legal_acts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    act_number VARCHAR(100),
    content TEXT,
    jurisdiction VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    full_text TEXT,
    summary TEXT,
    year INTEGER,
    key_provisions TEXT[],
    category VARCHAR(100)
);

-- Create legal_cases table if it doesn't exist
CREATE TABLE IF NOT EXISTS legal_cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    jurisdiction VARCHAR(100),
    status VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    court VARCHAR(100),
    decision_date DATE,
    citation VARCHAR(200),
    summary TEXT,
    key_legal_principles TEXT[]
);

-- Create procurement_contracts table if it doesn't exist
CREATE TABLE IF NOT EXISTS procurement_contracts (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(100) UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    vendor VARCHAR(200),
    value DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'CAD',
    start_date DATE,
    end_date DATE,
    status VARCHAR(50),
    contract_type VARCHAR(100),
    procurement_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    jurisdiction VARCHAR(100),
    category VARCHAR(100),
    tags TEXT[]
);

-- Create criminal_code_sections table if it doesn't exist
CREATE TABLE IF NOT EXISTS criminal_code_sections (
    id SERIAL PRIMARY KEY,
    section_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    full_text TEXT NOT NULL,
    summary TEXT,
    penalties TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create elections table if it doesn't exist
CREATE TABLE IF NOT EXISTS elections (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    election_date DATE,
    estimated_date DATE,
    status VARCHAR(50) DEFAULT 'upcoming',
    type VARCHAR(100),
    description TEXT,
    candidates_count INTEGER DEFAULT 0,
    registered_voters INTEGER,
    turnout_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    source VARCHAR(200),
    location VARCHAR(200)
);

-- Create news_articles table if it doesn't exist
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    summary TEXT,
    source VARCHAR(200),
    url VARCHAR(500),
    published_at TIMESTAMP,
    author VARCHAR(200),
    category VARCHAR(100),
    tags TEXT[],
    sentiment VARCHAR(20),
    civic_impact_score INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample legal acts data
INSERT INTO legal_acts (title, act_number, jurisdiction, summary, year, key_provisions, category) VALUES
('Canadian Human Rights Act', 'RSC 1985, c H-6', 'Federal', 'Prohibits discrimination in federally regulated activities', 1977, ARRAY['Equal opportunity', 'Anti-discrimination', 'Human rights complaints'], 'Human Rights'),
('Privacy Act', 'RSC 1985, c P-21', 'Federal', 'Governs the collection, use, and disclosure of personal information by federal government institutions', 1983, ARRAY['Personal information protection', 'Access to personal information', 'Privacy rights'], 'Privacy'),
('Personal Information Protection and Electronic Documents Act (PIPEDA)', 'SC 2000, c 5', 'Federal', 'Governs how private sector organizations collect, use, and disclose personal information', 2000, ARRAY['Consent requirements', 'Data protection', 'Electronic documents'], 'Privacy'),
('Cannabis Act', 'SC 2018, c 16', 'Federal', 'Legalizes and regulates the production, distribution, and consumption of cannabis', 2018, ARRAY['Legal cannabis', 'Age restrictions', 'Licensing requirements'], 'Health'),
('Impact Assessment Act', 'SC 2019, c 28', 'Federal', 'Establishes a federal impact assessment regime for major projects', 2019, ARRAY['Environmental assessment', 'Indigenous consultation', 'Public participation'], 'Environment');

-- Insert sample legal cases data
INSERT INTO legal_cases (case_number, title, description, jurisdiction, status, court, decision_date, citation, summary, key_legal_principles) VALUES
('R v Jordan', 'Jordan case regarding unreasonable delay in criminal proceedings', 'Federal', 'decided', 'Supreme Court of Canada', '2016-07-08', '2016 SCC 27', 'Established the Jordan framework for unreasonable delay in criminal proceedings', ARRAY['Right to trial within reasonable time', 'Charter section 11(b)', 'Unreasonable delay']),
('R v Cody', 'Cody case regarding unreasonable delay in criminal proceedings', 'Federal', 'decided', 'Supreme Court of Canada', '2017-06-23', '2017 SCC 28', 'Clarified the Jordan framework for unreasonable delay', ARRAY['Right to trial within reasonable time', 'Charter section 11(b)', 'Unreasonable delay']),
('R v Antic', 'Antic case regarding bail conditions', 'Federal', 'decided', 'Supreme Court of Canada', '2017-03-23', '2017 SCC 27', 'Established principles for bail conditions', ARRAY['Bail conditions', 'Charter section 11(e)', 'Presumption of innocence']);

-- Insert sample criminal code sections
INSERT INTO criminal_code_sections (section_number, title, full_text, summary, penalties, category) VALUES
('380', 'Fraud', 'Every one who, by deceit, falsehood or other fraudulent means, whether or not it is a false pretence within the meaning of this Act, defrauds the public or any person, whether ascertained or not, of any property, money or valuable security or any service is guilty of an indictable offence.', 'Prohibits fraud and deception', 'Up to 14 years imprisonment', 'Fraud'),
('430', 'Mischief', 'Every one commits mischief who wilfully destroys or damages property, renders property dangerous, useless, inoperative or ineffective, or interferes with the lawful use, enjoyment or operation of property.', 'Prohibits damage to property', 'Up to 10 years imprisonment', 'Property Crimes'),
('462.31', 'Money Laundering', 'Every one commits an offence who uses, transfers the possession of, sends or delivers to any person or place, transports, transmits, alters, disposes of or otherwise deals with, in any manner and by any means, any property or any proceeds of any property with intent to conceal or convert that property or those proceeds, knowing or believing that all or a part of that property or of those proceeds was obtained or derived directly or indirectly as a result of the commission in Canada of a designated offence.', 'Prohibits money laundering', 'Up to 10 years imprisonment', 'Financial Crimes');

-- Insert sample elections data
INSERT INTO elections (title, jurisdiction, level, election_date, estimated_date, status, type, description, candidates_count, registered_voters, turnout_percentage, source, location) VALUES
('Federal General Election', 'Canada', 'Federal', '2025-10-20', '2025-10-20', 'upcoming', 'General', '44th Canadian federal election', 338, 27000000, NULL, 'Elections Canada', 'Canada'),
('Ontario Provincial Election', 'Ontario', 'Provincial', '2026-06-02', '2026-06-02', 'upcoming', 'General', '43rd Ontario general election', 124, 10000000, NULL, 'Elections Ontario', 'Ontario'),
('Quebec Provincial Election', 'Quebec', 'Provincial', '2026-10-05', '2026-10-05', 'upcoming', 'General', '43rd Quebec general election', 125, 8000000, NULL, 'Élections Québec', 'Quebec'),
('Toronto Municipal Election', 'Toronto', 'Municipal', '2026-10-26', '2026-10-26', 'upcoming', 'General', 'Toronto municipal election', 25, 2000000, NULL, 'City of Toronto', 'Toronto'),
('Vancouver Municipal Election', 'Vancouver', 'Municipal', '2026-10-15', '2026-10-15', 'upcoming', 'General', 'Vancouver municipal election', 11, 500000, NULL, 'City of Vancouver', 'Vancouver');

-- Insert sample news articles
INSERT INTO news_articles (title, content, summary, source, url, published_at, author, category, tags, sentiment, civic_impact_score) VALUES
('Federal Budget 2025: Key Highlights for Canadians', 'The federal government has announced its 2025 budget with significant investments in healthcare, infrastructure, and climate action. The budget includes $10 billion for healthcare modernization, $15 billion for green infrastructure, and tax measures to support middle-class families.', 'Federal budget focuses on healthcare, infrastructure, and climate action with $25 billion in new spending', 'CBC News', 'https://www.cbc.ca/news/politics/federal-budget-2025', '2025-01-15 10:00:00', 'CBC Staff', 'Politics', ARRAY['budget', 'healthcare', 'infrastructure', 'climate'], 'positive', 8),
('New Bill Introduced to Strengthen Privacy Laws', 'A new bill has been introduced in Parliament to strengthen Canada''s privacy laws and give Canadians more control over their personal information. The bill includes provisions for data portability, the right to be forgotten, and stricter penalties for violations.', 'New privacy bill gives Canadians more control over personal data with stronger enforcement', 'The Globe and Mail', 'https://www.theglobeandmail.com/politics/privacy-bill', 'https://www.theglobeandmail.com/politics/privacy-bill', '2025-01-14 14:30:00', 'Jane Smith', 'Politics', ARRAY['privacy', 'legislation', 'data protection'], 'positive', 9),
('Supreme Court Rules on Indigenous Rights Case', 'The Supreme Court of Canada has issued a landmark ruling on Indigenous rights, affirming the duty to consult and accommodate Indigenous peoples in resource development projects. The decision has significant implications for future development projects across the country.', 'Landmark Supreme Court decision strengthens Indigenous consultation rights in development projects', 'CTV News', 'https://www.ctvnews.ca/indigenous-rights-supreme-court', '2025-01-13 16:45:00', 'CTV Staff', 'Legal', ARRAY['indigenous rights', 'supreme court', 'consultation'], 'neutral', 9);

-- Insert sample procurement contracts
INSERT INTO procurement_contracts (contract_number, title, description, department, vendor, value, currency, start_date, end_date, status, contract_type, procurement_method, jurisdiction, category, tags) VALUES
('GC-2025-001', 'IT Infrastructure Modernization', 'Modernization of government IT systems and infrastructure', 'Shared Services Canada', 'IBM Canada Ltd.', 50000000.00, 'CAD', '2025-01-01', '2027-12-31', 'active', 'Services', 'Competitive', 'Federal', 'Information Technology', ARRAY['IT', 'infrastructure', 'modernization']),
('GC-2025-002', 'Office Supplies and Equipment', 'Supply of office supplies and equipment for federal departments', 'Public Services and Procurement Canada', 'Staples Canada', 2500000.00, 'CAD', '2025-01-01', '2025-12-31', 'active', 'Goods', 'Standing Offer', 'Federal', 'Office Supplies', ARRAY['office supplies', 'equipment']),
('ON-2025-001', 'Highway 401 Expansion Project', 'Expansion of Highway 401 in the Greater Toronto Area', 'Ministry of Transportation', 'EllisDon Construction', 150000000.00, 'CAD', '2025-03-01', '2028-12-31', 'active', 'Construction', 'Competitive', 'Ontario', 'Infrastructure', ARRAY['highway', 'construction', 'expansion']);

-- Create indexes for better performance
CREATE INDEX idx_legal_acts_title ON legal_acts(title);
CREATE INDEX idx_legal_acts_jurisdiction ON legal_acts(jurisdiction);
CREATE INDEX idx_legal_cases_case_number ON legal_cases(case_number);
CREATE INDEX idx_legal_cases_jurisdiction ON legal_cases(jurisdiction);
CREATE INDEX idx_procurement_contracts_department ON procurement_contracts(department);
CREATE INDEX idx_procurement_contracts_status ON procurement_contracts(status);
CREATE INDEX idx_elections_jurisdiction ON elections(jurisdiction);
CREATE INDEX idx_elections_level ON elections(level);
CREATE INDEX idx_news_articles_category ON news_articles(category);
CREATE INDEX idx_news_articles_published_at ON news_articles(published_at);

-- Update existing bills to have proper status values
UPDATE bills SET status = 'Active' WHERE status IS NULL OR status = '';
UPDATE bills SET status = 'Passed' WHERE title LIKE '%Act%' AND status != 'Active';
