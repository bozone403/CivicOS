import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Disable SSL certificate verification for testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATABASE_URL = "postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require";

async function createTestUser() {
  try {
    console.log('Creating test user...');
    const pool = new Pool({ 
      connectionString: DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      }
    });

    const testEmail = 'test@civicos.ca';
    const testPassword = 'test123';
    const userId = uuidv4();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [testEmail]);
    if (existingUser.rows.length > 0) {
      console.log('Test user already exists, updating password...');
      await pool.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2',
        [hashedPassword, testEmail]
      );
    } else {
      console.log('Creating new test user...');
      await pool.query(
        'INSERT INTO users (id, email, password, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [userId, testEmail, hashedPassword]
      );
    }

    console.log(`✅ Test user created/updated:`);
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log(`User ID: ${userId}`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser(); 