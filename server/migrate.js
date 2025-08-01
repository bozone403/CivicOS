import { pool } from './db.js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('Starting migration process...');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to apply in order
    
    console.log('Found migration files:', migrationFiles);
    
    for (const migrationFile of migrationFiles) {
      try {
        console.log('Running migration:', migrationFile);
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        await pool.query(migrationSQL);
        
        console.log('Successfully ran migration:', migrationFile);
      } catch (error) {
        console.error('Error running migration:', migrationFile, error.message);
        // Continue with other migrations even if one fails
      }
    }
    
    console.log('Migration process completed');
  } catch (error) {
    console.error('Migration process failed:', error.message);
    // Don't throw - let the application continue
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then(() => {
    process.exit(0);
  }).catch((error) => {
    // console.error removed for production
    process.exit(1);
  });
}

export { runMigrations }; 