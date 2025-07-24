import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

// Disable SSL certificate verification for testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATABASE_URL = "postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require";

async function testPasswords() {
  try {
    // console.log removed for production
    const pool = new Pool({ 
      connectionString: DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      }
    });

    // Get password hash for first user
    const userResult = await pool.query('SELECT email, password FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      // console.log removed for production
      return;
    }

    const user = userResult.rows[0];
    // console.log removed for production
    // console.log removed for production

    // Common passwords to test
    const testPasswords = [
      'password',
      '123456',
      'admin',
      'test',
      'civicos',
      'civic',
      'demo',
      'user',
      'login',
      'pass',
      '123',
      'abc123',
      'password123',
      'admin123',
      'test123',
      'civicos123',
      'civic123',
      'demo123',
      'user123',
      'login123'
    ];

    for (const testPassword of testPasswords) {
      try {
        const isValid = await bcrypt.compare(testPassword, user.password);
        if (isValid) {
          // console.log removed for production
          break;
        }
      } catch (error) {
        // console.log removed for production
      }
    }

    await pool.end();
  } catch (error) {
    // console.error removed for production
  }
}

testPasswords(); 