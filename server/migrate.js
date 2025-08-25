import { sql } from 'drizzle-orm';
import { db } from './db.js';

export async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Add missing columns to politicians table
    console.log('Adding missing columns to politicians table...');
    
    const politiciansColumns = [
      'riding',
      'image', 
      'civicLevel',
      'recentActivity',
      'policyPositions',
      'expenses',
      'committees',
      'bio',
      'officeAddress'
    ];

    for (const column of politiciansColumns) {
      try {
        await db.execute(sql`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'politicians' AND column_name = ${column}
            ) THEN
              ALTER TABLE politicians ADD COLUMN ${sql.raw(column)} text;
            END IF;
          END $$;
        `);
        console.log(`✅ Added column '${column}' to politicians table`);
      } catch (error) {
        console.log(`⚠️ Column '${column}' already exists or error: ${error.message}`);
      }
    }

    // Add missing columns to criminal_code_sections table
    console.log('Adding missing columns to criminal_code_sections table...');
    
    const criminalCodeColumns = [
      'source',
      'sourceUrl', 
      'lastUpdated'
    ];

    for (const column of criminalCodeColumns) {
      try {
        const columnType = column === 'lastUpdated' ? 'timestamp' : 'varchar';
        const columnDef = column === 'lastUpdated' ? 'timestamp' : 'varchar(255)';
        
        await db.execute(sql`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'criminal_code_sections' AND column_name = ${column}
            ) THEN
              ALTER TABLE criminal_code_sections ADD COLUMN ${sql.raw(column)} ${sql.raw(columnDef)};
            END IF;
          END $$;
        `);
        console.log(`✅ Added column '${column}' to criminal_code_sections table`);
      } catch (error) {
        console.log(`⚠️ Column '${column}' already exists or error: ${error.message}`);
      }
    }

    // Add missing columns to legal_acts table
    console.log('Adding missing columns to legal_acts table...');
    
    const legalActsColumns = [
      'source',
      'sourceUrl',
      'lastUpdated'
    ];

    for (const column of legalActsColumns) {
      try {
        const columnType = column === 'lastUpdated' ? 'timestamp' : 'varchar';
        const columnDef = column === 'lastUpdated' ? 'timestamp' : 'varchar(255)';
        
        await db.execute(sql`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'legal_acts' AND column_name = ${column}
            ) THEN
              ALTER TABLE legal_acts ADD COLUMN ${sql.raw(column)} ${sql.raw(columnDef)};
            END IF;
          END $$;
        `);
        console.log(`✅ Added column '${column}' to legal_acts table`);
      } catch (error) {
        console.log(`⚠️ Column '${column}' already exists or error: ${error.message}`);
      }
    }

    // Add missing columns to legal_cases table
    console.log('Adding missing columns to legal_cases table...');
    
    const legalCasesColumns = [
      'source',
      'sourceUrl',
      'lastUpdated',
      'summary'
    ];

    for (const column of legalCasesColumns) {
      try {
        const columnType = column === 'lastUpdated' ? 'timestamp' : 'text';
        const columnDef = column === 'lastUpdated' ? 'timestamp' : 'text';
        
        await db.execute(sql`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'legal_cases' AND column_name = ${column}
            ) THEN
              ALTER TABLE legal_cases ADD COLUMN ${sql.raw(column)} ${sql.raw(columnDef)};
            END IF;
          END $$;
        `);
        console.log(`✅ Added column '${column}' to legal_cases table`);
      } catch (error) {
        console.log(`⚠️ Column '${column}' already exists or error: ${error.message}`);
      }
    }

    // Add missing columns to petitions table
    console.log('Adding missing columns to petitions table...');
    
    const petitionsColumns = [
      'source',
      'sourceUrl',
      'lastUpdated'
    ];

    for (const column of petitionsColumns) {
      try {
        const columnType = column === 'lastUpdated' ? 'timestamp' : 'varchar';
        const columnDef = column === 'lastUpdated' ? 'timestamp' : 'varchar(255)';
        
        await db.execute(sql`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'petitions' AND column_name = ${column}
            ) THEN
              ALTER TABLE petitions ADD COLUMN ${sql.raw(column)} ${sql.raw(columnDef)};
            END IF;
          END $$;
        `);
        console.log(`✅ Added column '${column}' to petitions table`);
      } catch (error) {
        console.log(`⚠️ Column '${column}' already exists or error: ${error.message}`);
      }
    }

    console.log('✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migrations failed:', error);
      process.exit(1);
    });
} 