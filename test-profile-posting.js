// Test profile posting functionality
const BASE_URL = 'https://civicos.onrender.com';

async function testProfilePosting() {
  console.log('🔍 Testing profile posting functionality...\n');
  
  // Test 1: Check if user can access their profile
  try {
    const profileResponse = await fetch(`${BASE_URL}/api/users/search?q=test`);
    const profileData = await profileResponse.text();
    console.log('✅ Profile search (no auth):', profileResponse.status, profileData.substring(0, 100));
  } catch (error) {
    console.log('❌ Profile search failed:', error.message);
  }
  
  // Test 2: Check if social posts endpoint works
  try {
    const postsResponse = await fetch(`${BASE_URL}/api/social/posts`);
    const postsData = await postsResponse.text();
    console.log('✅ Social posts (no auth):', postsResponse.status, postsData.substring(0, 100));
  } catch (error) {
    console.log('❌ Social posts failed:', error.message);
  }
  
  // Test 3: Check if user stats endpoint works
  try {
    const statsResponse = await fetch(`${BASE_URL}/api/users/popular`);
    const statsData = await statsResponse.text();
    console.log('✅ Popular users (no auth):', statsResponse.status, statsData.substring(0, 100));
  } catch (error) {
    console.log('❌ Popular users failed:', error.message);
  }
  
  // Test 4: Check database directly
  console.log('\n📊 Database Status:');
  try {
    const { exec } = require('child_process');
    exec('psql "postgresql://postgres.wmpsjclnykcxtqwxfffv:0QZpuL2bShMezo2S@aws-0-us-east-2.pooler.supabase.com:6543/postgres" -c "SELECT COUNT(*) as total_posts FROM social_posts;"', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Database check failed:', error.message);
      } else {
        console.log('✅ Database posts count:', stdout.trim());
      }
    });
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
  
  console.log('\n🔧 Debugging Steps:');
  console.log('1. Check if you are logged in (look for "✓ Logged In" badge)');
  console.log('2. Check browser console for JavaScript errors');
  console.log('3. Check network tab for failed API requests');
  console.log('4. Try posting from /civicsocial-feed instead of /profile');
  console.log('5. Clear browser cache and try again');
}

testProfilePosting().catch(console.error); 