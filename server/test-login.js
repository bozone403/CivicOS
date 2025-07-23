import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Disable SSL certificate verification for testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATABASE_URL = "postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require";
const JWT_SECRET = "civicos-dev-session-secret-2024";

async function testLogin() {
  try {
    console.log('Testing database connection...');
    const pool = new Pool({ 
      connectionString: DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      }
    });

    // Test database connection
    const result = await pool.query('SELECT NOW() as now');
    console.log('Database connection successful:', result.rows[0].now);

    // Test users table
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Users table accessible, count:', usersResult.rows[0].count);

    // Test bcrypt
    const testPassword = 'test123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log('Bcrypt working, hash length:', hashedPassword.length);

    // Test JWT
    const testUser = { id: 'test', email: 'test@example.com' };
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: "7d" });
    console.log('JWT working, token length:', token.length);

    console.log('All tests passed!');
    await pool.end();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLogin(); 