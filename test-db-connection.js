import { db } from './dist/server/db.js';
import { users } from './dist/shared/schema.js';
import { sql } from 'drizzle-orm';

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection from server perspective...');
    
    // Test basic connection
    const result = await db.execute(sql`SELECT NOW() as now`);
    console.log('✅ Database connection successful:', result[0]?.now || 'No result');
    
    // Test if we can query the users table
    const userCount = await db.select({ count: sql`count(*)` }).from(users);
    console.log('✅ Users table accessible, count:', userCount[0]?.count || 0);
    
    // Test if we can query social_links column specifically
    const socialLinksTest = await db.select({ 
      id: users.id, 
      socialLinks: users.socialLinks 
    }).from(users).limit(1);
    
    console.log('✅ social_links column accessible:', socialLinksTest[0] || 'No users found');
    
    // Test if we can insert a test record
    const testUser = {
      id: 'test-db-connection-' + Date.now(),
      email: 'test-db@example.com',
      socialLinks: { twitter: 'test' }
    };
    
    try {
      await db.insert(users).values(testUser);
      console.log('✅ Can insert user with social_links');
      
      // Clean up
      await db.delete(users).where(sql`id = ${testUser.id}`);
      console.log('✅ Cleanup successful');
    } catch (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDatabaseConnection(); 