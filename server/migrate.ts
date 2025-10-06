import { sql } from 'drizzle-orm';
import { db } from './db.js';

export async function runMigrations() {
  // console.log removed for production
  
  try {
    // First, drop any incorrectly named columns that were created in previous migrations
    // console.log removed for production
    
    const columnsToDrop = [
      'civicLevel',
      'recentActivity', 
      'policyPositions',
      'officeAddress'
    ];

    for (const column of columnsToDrop) {
      try {
        const sqlQuery = `DO $$ 
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'politicians' AND column_name = '${column}'
            ) THEN
              ALTER TABLE politicians DROP COLUMN "${column}";
            END IF;
          END $$;`;
        
        await db.execute(sql.raw(sqlQuery));
        // console.log removed for production
      } catch (error) {
        console.log(`⚠️ Column '${column}' doesn't exist or error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Add missing columns to politicians table with correct snake_case names
    // console.log removed for production
    
    const politiciansColumns = [
      { name: 'riding', type: 'text' },
      { name: 'image', type: 'text' }, 
      { name: 'civic_level', type: 'text' },
      { name: 'recent_activity', type: 'text' },
      { name: 'policy_positions', type: 'text' },
      { name: 'expenses', type: 'jsonb' },
      { name: 'committees', type: 'text' },
      { name: 'bio', type: 'text' },
      { name: 'office_address', type: 'text' }
    ];

    for (const column of politiciansColumns) {
      try {
        const sqlQuery = `DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'politicians' AND column_name = '${column.name}'
            ) THEN
              ALTER TABLE politicians ADD COLUMN "${column.name}" ${column.type};
            END IF;
          END $$;`;
        
        await db.execute(sql.raw(sqlQuery));
        // console.log removed for production
      } catch (error) {
        console.log(`⚠️ Column '${column.name}' already exists or error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Add missing columns to criminal_code_sections table
    // console.log removed for production
    
    const criminalCodeColumns = [
      { name: 'source', type: 'varchar(255)' },
      { name: 'source_url', type: 'varchar(255)' }, 
      { name: 'last_updated', type: 'timestamp' }
    ];

    for (const column of criminalCodeColumns) {
      try {
        const sqlQuery = `DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'criminal_code_sections' AND column_name = '${column.name}'
            ) THEN
              ALTER TABLE criminal_code_sections ADD COLUMN "${column.name}" ${column.type};
            END IF;
          END $$;`;
        
        await db.execute(sql.raw(sqlQuery));
        // console.log removed for production
      } catch (error) {
        console.log(`⚠️ Column '${column.name}' already exists or error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Add missing columns to legal_acts table
    // console.log removed for production
    
    const legalActsColumns = [
      { name: 'source', type: 'varchar(255)' },
      { name: 'source_url', type: 'varchar(255)' },
      { name: 'last_updated', type: 'timestamp' }
    ];

    for (const column of legalActsColumns) {
      try {
        const sqlQuery = `DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'legal_acts' AND column_name = '${column.name}'
            ) THEN
              ALTER TABLE legal_acts ADD COLUMN "${column.name}" ${column.type};
            END IF;
          END $$;`;
        
        await db.execute(sql.raw(sqlQuery));
        // console.log removed for production
      } catch (error) {
        console.log(`⚠️ Column '${column.name}' already exists or error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Add missing columns to legal_cases table
    // console.log removed for production
    
    const legalCasesColumns = [
      { name: 'source', type: 'varchar(255)' },
      { name: 'source_url', type: 'varchar(255)' },
      { name: 'last_updated', type: 'timestamp' },
      { name: 'summary', type: 'text' }
    ];

    for (const column of legalCasesColumns) {
      try {
        const sqlQuery = `DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'legal_cases' AND column_name = '${column.name}'
            ) THEN
              ALTER TABLE legal_cases ADD COLUMN "${column.name}" ${column.type};
            END IF;
          END $$;`;
        
        await db.execute(sql.raw(sqlQuery));
        // console.log removed for production
      } catch (error) {
        console.log(`⚠️ Column '${column.name}' already exists or error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Add missing columns to petitions table
    // console.log removed for production
    
    const petitionsColumns = [
      { name: 'source', type: 'varchar(255)' },
      { name: 'source_url', type: 'varchar(255)' },
      { name: 'last_updated', type: 'timestamp' }
    ];

    for (const column of petitionsColumns) {
      try {
        const sqlQuery = `DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'petitions' AND column_name = '${column.name}'
            ) THEN
              ALTER TABLE petitions ADD COLUMN "${column.name}" ${column.type};
            END IF;
          END $$;`;
        
        await db.execute(sql.raw(sqlQuery));
        // console.log removed for production
      } catch (error) {
        console.log(`⚠️ Column '${column.name}' already exists or error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // console.log removed for production
    
  } catch (error) {
    // console.error removed for production
    throw error;
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      // console.log removed for production
      process.exit(0);
    })
    .catch((error) => {
      // console.error removed for production
      process.exit(1);
    });
}
