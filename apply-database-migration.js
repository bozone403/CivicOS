import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyDatabaseMigration() {
  // console.log removed for production
  
  // Read the SQL migration file
  const migrationPath = path.join(__dirname, 'fix-all-production-issues.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    // console.log removed for production
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // console.log removed for production
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await client.query(statement);
        successCount++;
        // console.log removed for production
      } catch (error) {
        errorCount++;
        // console.log removed for production
      }
    }
    
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    
    if (errorCount === 0) {
      // console.log removed for production
    } else {
      // console.log removed for production
    }
    
    return { successCount, errorCount, total: statements.length };
    
  } catch (error) {
    // console.error removed for production
    return { error: error.message };
  } finally {
    await client.end();
  }
}

applyDatabaseMigration().catch(console.error); 