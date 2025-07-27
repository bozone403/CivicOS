import { db } from './dist/server/db.js';
import { users, votes, bills, petitions, petitionSignatures, politicians, socialPosts, userActivities } from './dist/shared/schema.js';
import { eq, and, count, desc, gte, sql } from 'drizzle-orm';

async function testDashboardData() {
  try {
    console.log('Testing dashboard data fetching...');
    
    // Test database connection
    const result = await db.execute(sql`SELECT NOW() as now`);
    console.log('Database connection successful:', result[0].now);
    
    // Get some basic counts
    const userCount = await db.select({ count: count() }).from(users);
    console.log('Total users:', userCount[0]?.count || 0);
    
    const voteCount = await db.select({ count: count() }).from(votes);
    console.log('Total votes:', voteCount[0]?.count || 0);
    
    const billCount = await db.select({ count: count() }).from(bills);
    console.log('Total bills:', billCount[0]?.count || 0);
    
    const petitionCount = await db.select({ count: count() }).from(petitions);
    console.log('Total petitions:', petitionCount[0]?.count || 0);
    
    const politicianCount = await db.select({ count: count() }).from(politicians);
    console.log('Total politicians:', politicianCount[0]?.count || 0);
    
    const socialPostCount = await db.select({ count: count() }).from(socialPosts);
    console.log('Total social posts:', socialPostCount[0]?.count || 0);
    
    const activityCount = await db.select({ count: count() }).from(userActivities);
    console.log('Total user activities:', activityCount[0]?.count || 0);
    
    console.log('Dashboard data test completed successfully!');
    
  } catch (error) {
    console.error('Error testing dashboard data:', error);
  }
}

testDashboardData(); 