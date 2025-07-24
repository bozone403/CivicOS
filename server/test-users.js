import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

// Disable SSL certificate verification for testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATABASE_URL = "postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require";

async function checkUsers() {
  try {
    // console.log removed for production
    const pool = new Pool({ 
      connectionString: DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      }
    });

    // Get all users
    const usersResult = await pool.query('SELECT id, email, first_name, last_name FROM users');
    // console.log removed for production
    usersResult.rows.forEach((user, index) => {
      // console.log removed for production
    });

    // Test login with first user
    if (usersResult.rows.length > 0) {
      const firstUser = usersResult.rows[0];
      // console.log removed for production
      
      // Try to get the password hash
      const passwordResult = await pool.query('SELECT password FROM users WHERE id = $1', [firstUser.id]);
      if (passwordResult.rows[0] && passwordResult.rows[0].password) {
        // console.log removed for production
        
        // Test with a common password
        const testPasswords = ['password', '123456', 'admin', 'test', 'civicos'];
        for (const testPassword of testPasswords) {
          const isValid = await bcrypt.compare(testPassword, passwordResult.rows[0].password);
          if (isValid) {
            // console.log removed for production
            break;
          }
        }
      } else {
        // console.log removed for production
      }
    }

    await pool.end();
  } catch (error) {
    // console.error removed for production
  }
}

checkUsers(); 