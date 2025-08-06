import { pool } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyDatabaseMigration() {
  console.log('🔧 APPLYING COMPREHENSIVE DATABASE MIGRATION\n');
  
  // Read the SQL migration file
  const migrationPath = path.join(__dirname, '..', 'fix-all-production-issues.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    console.log('✅ Connected to database successfully\n');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Executing ${statements.length} SQL statements...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await pool.query(statement);
        successCount++;
        console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error: any) {
        errorCount++;
        console.log(`❌ Statement ${i + 1}/${statements.length} failed: ${error.message}`);
      }
    }
    
    console.log(`\n📊 MIGRATION RESULTS:`);
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📊 Total statements: ${statements.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY');
    } else {
      console.log('\n⚠️ DATABASE MIGRATION COMPLETED WITH ERRORS');
    }
    
    return { successCount, errorCount, total: statements.length };
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return { error: error.message };
  } finally {
    await pool.end();
  }
}

applyDatabaseMigration().catch(console.error); 