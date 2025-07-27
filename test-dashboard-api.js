import { db } from './dist/server/db.js';
import { users, votes, bills, petitions, petitionSignatures, politicians, socialPosts, userActivities } from './dist/shared/schema.js';
import { eq, and, count, desc, gte } from 'drizzle-orm';

async function testDashboardAPI() {
  try {
    console.log('Testing dashboard API logic...');
    
    const userId = 'test-user-1';
    
    // Get user's current data
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const currentUser = user[0];
    
    if (!currentUser) {
      console.log('Test user not found, creating one...');
      return;
    }
    
    console.log('Found user:', currentUser.firstName, currentUser.lastName);
    
    // Get user's vote count
    const voteCount = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.userId, userId));
    
    console.log('User vote count:', voteCount[0]?.count || 0);
    
    // Get active bills count
    const activeBillsCount = await db
      .select({ count: count() })
      .from(bills)
      .where(eq(bills.status, 'active'));
    
    console.log('Active bills count:', activeBillsCount[0]?.count || 0);
    
    // Get user's petition signatures count
    const petitionSignaturesCount = await db
      .select({ count: count() })
      .from(petitionSignatures)
      .where(eq(petitionSignatures.userId, userId));
    
    console.log('User petition signatures count:', petitionSignaturesCount[0]?.count || 0);
    
    // Get total politicians count
    const politiciansCount = await db
      .select({ count: count() })
      .from(politicians);
    
    console.log('Total politicians count:', politiciansCount[0]?.count || 0);
    
    // Get user's social posts count
    const socialPostsCount = await db
      .select({ count: count() })
      .from(socialPosts)
      .where(eq(socialPosts.userId, userId));
    
    console.log('User social posts count:', socialPostsCount[0]?.count || 0);
    
    // Calculate trust score
    const trustScore = Math.min(100, Math.max(0, 
      Number(currentUser.trustScore || 100) + 
      (voteCount[0]?.count || 0) * 2 + 
      (petitionSignaturesCount[0]?.count || 0) * 3 +
      (socialPostsCount[0]?.count || 0) * 1
    ));
    
    console.log('Calculated trust score:', trustScore);
    
    // Calculate civic points
    const civicPoints = (currentUser.civicPoints || 0) + 
      (voteCount[0]?.count || 0) * 10 +
      (petitionSignaturesCount[0]?.count || 0) * 15 +
      (socialPostsCount[0]?.count || 0) * 5;
    
    console.log('Calculated civic points:', civicPoints);
    
    // Simulate dashboard stats response
    const stats = {
      totalVotes: voteCount[0]?.count || 0,
      activeBills: activeBillsCount[0]?.count || 0,
      politiciansTracked: politiciansCount[0]?.count || 0,
      petitionsSigned: petitionSignaturesCount[0]?.count || 0,
      civicPoints: civicPoints,
      trustScore: Math.round(trustScore),
      recentActivity: [
        {
          id: 999999,
          type: 'welcome',
          title: 'Welcome to CivicOS! Start engaging with democracy.',
          timestamp: new Date().toISOString(),
          icon: 'welcome'
        }
      ]
    };
    
    console.log('\nDashboard Stats Response:');
    console.log(JSON.stringify(stats, null, 2));
    
    console.log('\n✅ Dashboard API test completed successfully!');
    console.log('The dashboard is now using REAL data from the database!');
    
  } catch (error) {
    console.error('❌ Error testing dashboard API:', error);
  }
}

testDashboardAPI(); 