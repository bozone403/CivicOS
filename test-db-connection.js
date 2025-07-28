import { Pool } from 'pg';

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    return;
  }

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined
    } : false
  });

  try {
    console.log('Attempting to connect to database...');
    const result = await pool.query('SELECT NOW() as now, version() as version');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].now);
    console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0]);
    
    // Test users table
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Users table count:', usersResult.rows[0].count);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection(); 