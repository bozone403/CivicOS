#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  }
});

async function verifyDatabaseHealth() {
  // console.log removed for production
  
  try {
    // Test connection
    const result = await pool.query('SELECT NOW() as current_time');
    // console.log removed for production
    
    // Check table counts
    const tables = [
      'users', 'politicians', 'bills', 'votes', 'petitions', 
      'petition_signatures', 'news_articles', 'legal_acts', 
      'criminal_code_sections', 'social_posts', 'announcements'
    ];
    
    // console.log removed for production
    for (const table of tables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countResult.rows[0].count;
        // console.log removed for production
        
        if (count === 0) {
          // console.log removed for production
        }
      } catch (error) {
        // console.log removed for production
      }
    }
    
    // Check specific data issues
    // console.log removed for production
    
    // Check politicians table structure
    const politicianColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'politicians' 
      ORDER BY ordinal_position
    `);
    
    // console.log removed for production
    politicianColumns.rows.forEach(col => {
      console.log(`    ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check for sample data
    const samplePoliticians = await pool.query('SELECT id, name, position, jurisdiction FROM politicians LIMIT 3');
    if (samplePoliticians.rows.length > 0) {
      // console.log removed for production
      samplePoliticians.rows.forEach(p => {
        console.log(`    ${p.name} - ${p.position} (${p.jurisdiction})`);
      });
    }
    
    // Check bills table
    const sampleBills = await pool.query('SELECT id, title, status FROM bills LIMIT 3');
    if (sampleBills.rows.length > 0) {
      // console.log removed for production
      sampleBills.rows.forEach(b => {
        // console.log removed for production
      });
    }
    
    // Check petitions table
    const samplePetitions = await pool.query('SELECT id, title, status, current_signatures FROM petitions LIMIT 3');
    if (samplePetitions.rows.length > 0) {
      // console.log removed for production
      samplePetitions.rows.forEach(p => {
        console.log(`    ${p.title} - ${p.status} (${p.current_signatures} signatures)`);
      });
    }
    
    // Check news table
    const sampleNews = await pool.query('SELECT id, title, source FROM news_articles LIMIT 3');
    if (sampleNews.rows.length > 0) {
      // console.log removed for production
      sampleNews.rows.forEach(n => {
        // console.log removed for production
      });
    }
    
    // Check legal table
    const sampleLegal = await pool.query('SELECT id, title, type FROM legal_acts LIMIT 3');
    if (sampleLegal.rows.length > 0) {
      // console.log removed for production
      sampleLegal.rows.forEach(l => {
        // console.log removed for production
      });
    }
    
  } catch (error) {
    // console.error removed for production
  }
}

async function populateSampleData() {
  // console.log removed for production
  
  try {
    // Check if politicians table has data
    const politicianCount = await pool.query('SELECT COUNT(*) as count FROM politicians');
    if (politicianCount.rows[0].count === 0) {
      // console.log removed for production
      
      const samplePoliticians = [
        {
          id: 'pol_001',
          name: 'Justin Trudeau',
          position: 'Prime Minister',
          jurisdiction: 'Federal',
          level: 'federal',
          party: 'Liberal',
          constituency: 'Papineau',
          email: 'justin.trudeau@parl.gc.ca',
          phone: '613-992-4211',
          website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=196619',
          image: 'https://www.parl.gc.ca/Content/HOC/Members/ProfileMP/196619.jpg',
          bio: 'Prime Minister of Canada since 2015',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'pol_002',
          name: 'Pierre Poilievre',
          position: 'Leader of the Opposition',
          jurisdiction: 'Federal',
          level: 'federal',
          party: 'Conservative',
          constituency: 'Carleton',
          email: 'pierre.poilievre@parl.gc.ca',
          phone: '613-992-2772',
          website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=196620',
          image: 'https://www.parl.gc.ca/Content/HOC/Members/ProfileMP/196620.jpg',
          bio: 'Leader of the Conservative Party of Canada',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      for (const politician of samplePoliticians) {
        await pool.query(`
          INSERT INTO politicians (id, name, position, jurisdiction, level, party, constituency, email, phone, website, image, bio, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO NOTHING
        `, Object.values(politician));
      }
      // console.log removed for production
    }
    
    // Check if bills table has data
    const billCount = await pool.query('SELECT COUNT(*) as count FROM bills');
    if (billCount.rows[0].count === 0) {
      // console.log removed for production
      
      const sampleBills = [
        {
          id: 'bill_001',
          title: 'An Act to amend the Criminal Code (medical assistance in dying)',
          description: 'Bill to expand medical assistance in dying eligibility',
          status: 'active',
          bill_number: 'C-7',
          session: '43rd Parliament, 2nd Session',
          introduced_date: new Date('2020-10-05'),
          sponsor: 'David Lametti',
          sponsor_party: 'Liberal',
          summary: 'This bill amends the Criminal Code to expand eligibility for medical assistance in dying',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'bill_002',
          title: 'An Act respecting climate change',
          description: 'Bill to establish climate change targets and reporting',
          status: 'active',
          bill_number: 'C-12',
          session: '43rd Parliament, 2nd Session',
          introduced_date: new Date('2020-11-19'),
          sponsor: 'Jonathan Wilkinson',
          sponsor_party: 'Liberal',
          summary: 'This bill establishes climate change targets and requires annual reporting on progress',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      for (const bill of sampleBills) {
        await pool.query(`
          INSERT INTO bills (id, title, description, status, bill_number, session, introduced_date, sponsor, sponsor_party, summary, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING
        `, Object.values(bill));
      }
      // console.log removed for production
    }
    
    // Check if petitions table has data
    const petitionCount = await pool.query('SELECT COUNT(*) as count FROM petitions');
    if (petitionCount.rows[0].count === 0) {
      // console.log removed for production
      
      const samplePetitions = [
        {
          id: 'pet_001',
          title: 'Support Climate Action',
          description: 'Petition to support stronger climate change policies',
          target_signatures: 1000,
          current_signatures: 0,
          status: 'active',
          deadline_date: new Date('2025-12-31'),
          creator_id: 'user_001',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'pet_002',
          title: 'Improve Healthcare Access',
          description: 'Petition for better healthcare access in rural areas',
          target_signatures: 500,
          current_signatures: 0,
          status: 'active',
          deadline_date: new Date('2025-12-31'),
          creator_id: 'user_001',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      for (const petition of samplePetitions) {
        await pool.query(`
          INSERT INTO petitions (id, title, description, target_signatures, current_signatures, status, deadline_date, creator_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `, Object.values(petition));
      }
      // console.log removed for production
    }
    
    // Check if news table has data
    const newsCount = await pool.query('SELECT COUNT(*) as count FROM news_articles');
    if (newsCount.rows[0].count === 0) {
      // console.log removed for production
      
      const sampleNews = [
        {
          id: 'news_001',
          title: 'New Climate Bill Introduced in Parliament',
          content: 'A new bill aimed at reducing carbon emissions has been introduced...',
          source: 'CBC News',
          source_url: 'https://www.cbc.ca/news',
          published_date: new Date(),
          author: 'John Smith',
          category: 'Politics',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'news_002',
          title: 'Healthcare Reform Discussion Continues',
          content: 'Members of Parliament continue discussions on healthcare reform...',
          source: 'CTV News',
          source_url: 'https://www.ctvnews.ca',
          published_date: new Date(),
          author: 'Jane Doe',
          category: 'Healthcare',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      for (const news of sampleNews) {
        await pool.query(`
          INSERT INTO news_articles (id, title, content, source, source_url, published_date, author, category, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `, Object.values(news));
      }
      // console.log removed for production
    }
    
    // Check if legal table has data
    const legalCount = await pool.query('SELECT COUNT(*) as count FROM legal_acts');
    if (legalCount.rows[0].count === 0) {
      // console.log removed for production
      
      const sampleLegal = [
        {
          id: 'legal_001',
          title: 'Canadian Charter of Rights and Freedoms',
          type: 'constitution',
          description: 'Part of the Constitution Act, 1982',
          content: 'The Canadian Charter of Rights and Freedoms guarantees the rights and freedoms set out in it...',
          jurisdiction: 'Federal',
          effective_date: new Date('1982-04-17'),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'legal_002',
          title: 'Criminal Code of Canada',
          type: 'criminal_code',
          description: 'Federal criminal law of Canada',
          content: 'The Criminal Code contains most of the criminal offences and procedures in Canada...',
          jurisdiction: 'Federal',
          effective_date: new Date('1892-07-01'),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      for (const legal of sampleLegal) {
        await pool.query(`
          INSERT INTO legal_acts (id, title, type, description, content, jurisdiction, effective_date, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, Object.values(legal));
      }
      // console.log removed for production
    }
    
  } catch (error) {
    // console.error removed for production
  }
}

async function main() {
  try {
    await verifyDatabaseHealth();
    await populateSampleData();
    
    // console.log removed for production
    // console.log removed for production
    
  } catch (error) {
    // console.error removed for production
  } finally {
    await pool.end();
  }
}

main();
