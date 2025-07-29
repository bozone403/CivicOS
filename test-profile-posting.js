// Test profile posting functionality
const BASE_URL = 'https://civicos.onrender.com';

async function testProfilePosting() {
  // console.log removed for production
  
  // Test 1: Check if user can access their profile
  try {
    const profileResponse = await fetch(`${BASE_URL}/api/users/search?q=test`);
    const profileData = await profileResponse.text();
    console.log('✅ Profile search (no auth):', profileResponse.status, profileData.substring(0, 100));
  } catch (error) {
    // console.log removed for production
  }
  
  // Test 2: Check if social posts endpoint works
  try {
    const postsResponse = await fetch(`${BASE_URL}/api/social/posts`);
    const postsData = await postsResponse.text();
    console.log('✅ Social posts (no auth):', postsResponse.status, postsData.substring(0, 100));
  } catch (error) {
    // console.log removed for production
  }
  
  // Test 3: Check if user stats endpoint works
  try {
    const statsResponse = await fetch(`${BASE_URL}/api/users/popular`);
    const statsData = await statsResponse.text();
    console.log('✅ Popular users (no auth):', statsResponse.status, statsData.substring(0, 100));
  } catch (error) {
    // console.log removed for production
  }
  
  // Test 4: Check database directly
  // console.log removed for production
  try {
    const { exec } = require('child_process');
    exec('psql "postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres" -c "SELECT COUNT(*) as total_posts FROM social_posts;"', (error, stdout, stderr) => {
      if (error) {
        // console.log removed for production
      } else {
        console.log('✅ Database posts count:', stdout.trim());
      }
    });
  } catch (error) {
    // console.log removed for production
  }
  
  // console.log removed for production
  console.log('1. Check if you are logged in (look for "✓ Logged In" badge)');
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
}

testProfilePosting().catch(console.error); 