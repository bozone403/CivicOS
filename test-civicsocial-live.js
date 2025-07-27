// Test CivicSocial endpoints on live server
const BASE_URL = 'https://civicos.onrender.com';

async function testEndpoint(name, url, method = 'GET', headers = {}, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.text();
    
    console.log(`✅ ${name}: ${response.status} - ${data.substring(0, 100)}`);
    return { success: true, status: response.status, data };
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing CivicSocial endpoints on live server...\n');
  
  // Test health endpoint
  await testEndpoint('Health Check', `${BASE_URL}/health`);
  
  // Test social endpoints (should require auth)
  await testEndpoint('Social Posts (Unauthorized)', `${BASE_URL}/api/social/posts`);
  await testEndpoint('Social Feed (Unauthorized)', `${BASE_URL}/api/social/feed`);
  await testEndpoint('Social Friends (Unauthorized)', `${BASE_URL}/api/social/friends`);
  await testEndpoint('Social Trending (Unauthorized)', `${BASE_URL}/api/social/trending`);
  
  // Test other API endpoints
  await testEndpoint('Auth User (Unauthorized)', `${BASE_URL}/api/auth/user`);
  await testEndpoint('Politicians', `${BASE_URL}/api/politicians`);
  await testEndpoint('Bills', `${BASE_URL}/api/bills`);
  await testEndpoint('News', `${BASE_URL}/api/news`);
  
  console.log('\n📊 Test Summary:');
  console.log('- All endpoints should return 401 for unauthorized requests');
  console.log('- Social endpoints should exist and require authentication');
  console.log('- Other API endpoints should be accessible');
}

runTests().catch(console.error); 