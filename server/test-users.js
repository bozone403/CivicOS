import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

// Disable SSL certificate verification for testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATABASE_URL = "postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require";

async function checkUsers() {
  try {
    console.log('Checking existing users...');
    const pool = new Pool({ 
      connectionString: DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      }
    });

    // Get all users
    const usersResult = await pool.query('SELECT id, email, first_name, last_name FROM users');
    console.log('Existing users:');
    usersResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}`);
    });

    // Test login with first user
    if (usersResult.rows.length > 0) {
      const firstUser = usersResult.rows[0];
      console.log(`\nTesting login with user: ${firstUser.email}`);
      
      // Try to get the password hash
      const passwordResult = await pool.query('SELECT password FROM users WHERE id = $1', [firstUser.id]);
      if (passwordResult.rows[0] && passwordResult.rows[0].password) {
        console.log('User has password hash');
        
        // Test with a common password
        const testPasswords = ['password', '123456', 'admin', 'test', 'civicos'];
        for (const testPassword of testPasswords) {
          const isValid = await bcrypt.compare(testPassword, passwordResult.rows[0].password);
          if (isValid) {
            console.log(`✅ Password found: "${testPassword}"`);
            break;
          }
        }
      } else {
        console.log('User has no password hash');
      }
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers(); 