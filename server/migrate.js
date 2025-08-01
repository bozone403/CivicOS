import { pool } from './db.js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    // console.log removed for production
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to apply in order
    
    // console.log removed for production
    
    for (const migrationFile of migrationFiles) {
      try {
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        await pool.query(migrationSQL);
        
        // console.log removed for production
      } catch (error) {
        // console.error removed for production
        // Continue with other migrations even if one fails
      }
    }
    
    // console.log removed for production
  } catch (error) {
    // console.error removed for production
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