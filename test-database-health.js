import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema.js';

async function checkDatabaseHealth() {
  console.log('🔍 CivicOS Database Health Check');
  console.log('================================');
  
  // Check environment variables
  console.log('\n📋 Environment Check:');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set - this is the root cause of the 500 errors');
    return;
  }

  // Test basic connection
  console.log('\n🔌 Connection Test:');
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined
    } : false
  });

  try {
    const result = await pool.query('SELECT NOW() as now, version() as version');
    console.log('✅ Database connection successful');
    console.log('Current time:', result.rows[0].now);
    console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0]);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }

  // Test critical tables
  console.log('\n📊 Table Health Check:');
  const criticalTables = [
    'users',
    'politicians', 
    'bills',
    'votes',
    'social_posts',
    'announcements',
    'permissions',
    'user_permissions',
    'membership_permissions'
  ];

  for (const table of criticalTables) {
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`✅ ${table}: ${result.rows[0].count} records`);
    } catch (error) {
      console.error(`❌ ${table}: ${error.message}`);
    }
  }

  // Test users table schema specifically
  console.log('\n👥 Users Table Schema Check:');
  try {
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
  } catch (error) {
    console.error('❌ Could not check users table schema:', error.message);
  }

  // Test auth functionality
  console.log('\n🔐 Auth Functionality Test:');
  try {
    // Test if we can create a test user
    const testUserId = `test-health-check-${Date.now()}`;
    const testUser = {
      id: testUserId,
      username: `test-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      password: 'test-password-hash'
    };

    await pool.query(`
      INSERT INTO users (id, username, email, password) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [testUser.id, testUser.username, testUser.email, testUser.password]);

    console.log('✅ Can create users');

    // Test if we can retrieve the user
    const retrievedUser = await pool.query('SELECT * FROM users WHERE id = $1', [testUserId]);
    if (retrievedUser.rows.length > 0) {
      console.log('✅ Can retrieve users');
    } else {
      console.log('❌ Cannot retrieve users');
    }

    // Clean up test user
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    console.log('✅ Can delete users');

  } catch (error) {
    console.error('❌ Auth functionality test failed:', error.message);
  }

  // Test Drizzle ORM
  console.log('\n🛠️ Drizzle ORM Test:');
  try {
    const db = drizzle(pool, { schema });
    const users = await db.select().from(schema.users).limit(1);
    console.log('✅ Drizzle ORM working correctly');
    console.log('Sample user fields available:', Object.keys(users[0] || {}));
  } catch (error) {
    console.error('❌ Drizzle ORM test failed:', error.message);
    console.error('This suggests a schema mismatch between code and database');
  }

  await pool.end();
  
  console.log('\n🎯 Health check completed!');
  console.log('If you see any ❌ errors above, those are the issues causing the 500 errors.');
}

checkDatabaseHealth().catch(console.error); 