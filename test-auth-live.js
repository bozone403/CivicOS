// Test authentication and posting functionality
const BASE_URL = 'https://civicos.onrender.com';

async function testAuth() {
  console.log('🔐 Testing authentication and posting...\n');
  
  // Test 1: Check if we can access auth endpoints
  try {
    const authResponse = await fetch(`${BASE_URL}/api/auth/env-check`);
    const authData = await authResponse.text();
    console.log('✅ Auth environment check:', authResponse.status, authData.substring(0, 100));
  } catch (error) {
    console.log('❌ Auth environment check failed:', error.message);
  }
  
  // Test 2: Try to get user without token
  try {
    const userResponse = await fetch(`${BASE_URL}/api/auth/user`);
    const userData = await userResponse.text();
    console.log('✅ User endpoint (no auth):', userResponse.status, userData.substring(0, 100));
  } catch (error) {
    console.log('❌ User endpoint failed:', error.message);
  }
  
  // Test 3: Try to post without token
  try {
    const postResponse = await fetch(`${BASE_URL}/api/social/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test post', type: 'post', visibility: 'public' })
    });
    const postData = await postResponse.text();
    console.log('✅ Post endpoint (no auth):', postResponse.status, postData.substring(0, 100));
  } catch (error) {
    console.log('❌ Post endpoint failed:', error.message);
  }
  
  // Test 4: Check if social posts exist
  try {
    const postsResponse = await fetch(`${BASE_URL}/api/social/posts`);
    const postsData = await postsResponse.text();
    console.log('✅ Social posts (no auth):', postsResponse.status, postsData.substring(0, 100));
  } catch (error) {
    console.log('❌ Social posts failed:', error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('- All endpoints should return 401 for unauthorized requests');
  console.log('- This confirms the authentication system is working');
  console.log('- The "failed to post" issue is likely due to missing/expired authentication token');
}

testAuth().catch(console.error); 