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

async function populateDatabase() {
  // console.log removed for production
  
  try {
    // Test connection
    const result = await pool.query('SELECT NOW() as current_time');
    // console.log removed for production
    
    // 1. Populate Politicians Table
    // console.log removed for production
    const politicianData = [
      {
        name: 'Justin Trudeau',
        position: 'Prime Minister',
        party: 'Liberal',
        jurisdiction: 'Federal',
        level: 'federal',
        constituency: 'Papineau',
        riding: 'Papineau',
        image: 'https://www.parl.gc.ca/Content/HOC/Members/ProfileMP/196619.jpg',
        bio: 'Prime Minister of Canada since 2015',
        is_incumbent: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Pierre Poilievre',
        position: 'Leader of the Opposition',
        party: 'Conservative',
        jurisdiction: 'Federal',
        level: 'federal',
        constituency: 'Carleton',
        riding: 'Carleton',
        image: 'https://www.parl.gc.ca/Content/HOC/Members/ProfileMP/196620.jpg',
        bio: 'Leader of the Conservative Party of Canada',
        is_incumbent: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Jagmeet Singh',
        position: 'Leader of the New Democratic Party',
        party: 'NDP',
        jurisdiction: 'Federal',
        level: 'federal',
        constituency: 'Burnaby South',
        riding: 'Burnaby South',
        image: 'https://www.parl.gc.ca/Content/HOC/Members/ProfileMP/196621.jpg',
        bio: 'Leader of the New Democratic Party of Canada',
        is_incumbent: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    for (const politician of politicianData) {
      try {
        await pool.query(`
          INSERT INTO politicians (name, position, party, jurisdiction, level, constituency, riding, image, bio, is_incumbent)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, Object.values(politician).slice(0, 10));
      } catch (error) {
        // console.log removed for production
      }
    }
    // console.log removed for production
    
    // 2. Populate Bills Table
    // console.log removed for production
    const billData = [
      {
        title: 'An Act to amend the Criminal Code (medical assistance in dying)',
        description: 'Bill to expand medical assistance in dying eligibility',
        status: 'active',
        bill_number: 'C-7',
        bill_type: 'Government Bill',
        summary: 'This bill amends the Criminal Code to expand eligibility for medical assistance in dying',
        category: 'Criminal Law'
      },
      {
        title: 'An Act respecting climate change',
        description: 'Bill to establish climate change targets and reporting',
        status: 'active',
        bill_number: 'C-12',
        bill_type: 'Government Bill',
        summary: 'This bill establishes climate change targets and requires annual reporting on progress',
        category: 'Environment'
      },
      {
        title: 'An Act to implement certain provisions of the budget tabled in Parliament on April 19, 2021',
        description: 'Budget implementation bill',
        status: 'active',
        bill_number: 'C-30',
        bill_type: 'Government Bill',
        summary: 'This bill implements measures from the 2021 federal budget',
        category: 'Finance'
      }
    ];
    
    for (const bill of billData) {
      try {
        await pool.query(`
          INSERT INTO bills (title, description, status, bill_number, bill_type, summary, category)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, Object.values(bill));
      } catch (error) {
        // console.log removed for production
      }
    }
    // console.log removed for production
    
    // 3. Populate Petitions Table
    // console.log removed for production
    const petitionData = [
      {
        title: 'Support Climate Action',
        description: 'Petition to support stronger climate change policies and renewable energy initiatives',
        target_signatures: 1000,
        current_signatures: 847,
        status: 'active',
        deadline_date: new Date('2025-12-31'),
        creator_id: 'user_001'
      },
      {
        title: 'Protect Canadian Forests from Clear-Cutting',
        description: 'Petition to implement stronger forest protection policies and sustainable logging practices',
        target_signatures: 5000,
        current_signatures: 3241,
        status: 'active',
        deadline_date: new Date('2025-12-31'),
        creator_id: 'user_002'
      },
      {
        title: 'Implement National Pharmacare Program',
        description: 'Petition to establish universal prescription drug coverage for all Canadians',
        target_signatures: 2000,
        current_signatures: 1892,
        status: 'active',
        deadline_date: new Date('2025-12-31'),
        creator_id: 'user_003'
      }
    ];
    
    for (const petition of petitionData) {
      try {
        await pool.query(`
          INSERT INTO petitions (title, description, target_signatures, current_signatures, status, deadline_date, creator_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, Object.values(petition));
      } catch (error) {
        // console.log removed for production
      }
    }
    // console.log removed for production
    
    // 4. Populate News Articles Table
    // console.log removed for production
    const newsData = [
      {
        title: 'New Climate Bill Introduced in Parliament',
        content: 'A new bill aimed at reducing carbon emissions has been introduced in the House of Commons. The legislation proposes ambitious targets for renewable energy adoption and carbon pricing.',
        source: 'CBC News',
        source_url: 'https://www.cbc.ca/news',
        author: 'John Smith',
        category: 'Politics'
      },
      {
        title: 'Healthcare Reform Discussion Continues',
        content: 'Members of Parliament continue discussions on healthcare reform, focusing on improving access to mental health services and reducing wait times.',
        source: 'CTV News',
        source_url: 'https://www.ctvnews.ca',
        author: 'Jane Doe',
        category: 'Healthcare'
      },
      {
        title: 'Federal Budget Focuses on Economic Recovery',
        content: 'The latest federal budget emphasizes economic recovery measures, including support for small businesses and infrastructure investments.',
        source: 'Global News',
        source_url: 'https://globalnews.ca',
        author: 'Mike Johnson',
        category: 'Economy'
      }
    ];
    
    for (const news of newsData) {
      try {
        await pool.query(`
          INSERT INTO news_articles (title, content, source, source_url, author, category)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, Object.values(news));
      } catch (error) {
        // console.log removed for production
      }
    }
    // console.log removed for production
    
    // 5. Populate Legal Acts Table
    // console.log removed for production
    const legalData = [
      {
        title: 'Canadian Charter of Rights and Freedoms',
        act_number: '1982, c. 11',
        content: 'The Canadian Charter of Rights and Freedoms guarantees the rights and freedoms set out in it subject only to such reasonable limits prescribed by law as can be demonstrably justified in a free and democratic society.',
        jurisdiction: 'Federal',
        summary: 'Constitutional document protecting fundamental rights and freedoms',
        source: 'Government of Canada',
        source_url: 'https://laws-lois.justice.gc.ca'
      },
      {
        title: 'Criminal Code of Canada',
        act_number: 'R.S.C., 1985, c. C-46',
        content: 'The Criminal Code contains most of the criminal offences and procedures in Canada.',
        jurisdiction: 'Federal',
        summary: 'Federal criminal law of Canada',
        source: 'Government of Canada',
        source_url: 'https://laws-lois.justice.gc.ca'
      }
    ];
    
    for (const legal of legalData) {
      try {
        await pool.query(`
          INSERT INTO legal_acts (title, act_number, content, jurisdiction, summary, source, source_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, Object.values(legal));
      } catch (error) {
        // console.log removed for production
      }
    }
    // console.log removed for production
    
    // 6. Populate Announcements Table
    // console.log removed for production
    const announcementData = [
      {
        title: 'New CivicOS Features Available',
        content: 'We are excited to announce new features including enhanced petition creation, improved voting records, and better mobile experience.',
        type: 'platform_update',
        priority: 'medium'
      },
      {
        title: 'Parliament Session Updates',
        content: 'The current parliamentary session will focus on climate change legislation, healthcare reform, and economic recovery measures.',
        type: 'government_update',
        priority: 'high'
      }
    ];
    
    for (const announcement of announcementData) {
      try {
        await pool.query(`
          INSERT INTO announcements (title, content, type, priority)
          VALUES ($1, $2, $3, $4)
        `, Object.values(announcement));
      } catch (error) {
        // console.log removed for production
      }
    }
    // console.log removed for production
    
    // console.log removed for production
    // console.log removed for production
    
    // Verify the data was inserted
    const politicianCount = await pool.query('SELECT COUNT(*) as count FROM politicians');
    const billCount = await pool.query('SELECT COUNT(*) as count FROM bills');
    const petitionCount = await pool.query('SELECT COUNT(*) as count FROM petitions');
    const newsCount = await pool.query('SELECT COUNT(*) as count FROM news_articles');
    const legalCount = await pool.query('SELECT COUNT(*) as count FROM legal_acts');
    const announcementCount = await pool.query('SELECT COUNT(*) as count FROM announcements');
    
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    
  } catch (error) {
    // console.error removed for production
  } finally {
    await pool.end();
  }
}

populateDatabase();
