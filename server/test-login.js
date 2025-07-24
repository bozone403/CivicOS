import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Disable SSL certificate verification for testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATABASE_URL = "postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require";
const JWT_SECRET = "civicos-dev-session-secret-2024";

async function testLogin() {
  try {
    // console.log removed for production
    const pool = new Pool({ 
      connectionString: DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      }
    });

    // Test database connection
    const result = await pool.query('SELECT NOW() as now');
    // console.log removed for production

    // Test users table
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    // console.log removed for production

    // Test bcrypt
    const testPassword = 'test123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    // console.log removed for production

    // Test JWT
    const testUser = { id: 'test', email: 'test@example.com' };
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: "7d" });
    // console.log removed for production

    // console.log removed for production
    await pool.end();
  } catch (error) {
    // console.error removed for production
  }
}

testLogin(); 