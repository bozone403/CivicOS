import { pool } from './db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(): Promise<void> {
  try {
    // console.log removed for production
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/0006_complete_user_fields.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    // console.log removed for production
  } catch (error) {
    // console.error removed for production
    // Don't throw - let the application continue
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().then(() => {
    process.exit(0);
  }).catch((error) => {
    // console.error removed for production
    process.exit(1);
  });
}

export { runMigration }; 