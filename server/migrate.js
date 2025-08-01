import { pool } from './db.js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to apply in order
    
    for (const migrationFile of migrationFiles) {
      try {
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        await pool.query(migrationSQL);
      } catch (error) {
        // Continue with other migrations even if one fails
      }
    }
  } catch (error) {
    throw error;
  }
} 