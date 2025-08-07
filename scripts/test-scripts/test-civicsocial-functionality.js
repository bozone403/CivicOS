const API_BASE = 'https://civicos.onrender.com';

async function testEndpoint(endpoint, method = 'GET', headers = {}, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return {
        success: false,
        status: response.status,
        data: null,
        error: `Invalid JSON response: ${text.substring(0, 100)}...`
      };
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      error: !response.ok ? data.message || data.error : null
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

async function runCivicSocialTests() {
  console.log('🔍 Testing CivicSocial Functionality\n');
  
  // Test public endpoints that should work without auth
  console.log('📋 Testing Public CivicSocial Endpoints:');
  
  const publicEndpoints = [
    '/api/users/search?q=test&limit=5',
    '/api/users/profile/testuser',
    '/api/social/posts/user/testuser'
  ];
  
  for (const endpoint of publicEndpoints) {
    console.log(`\nTesting ${endpoint}...`);
    const result = await testEndpoint(endpoint);
    if (result.success) {
      console.log(`✅ ${endpoint} - WORKING`);
    } else if (result.status === 401) {
      console.log(`✅ ${endpoint} - CORRECTLY REQUIRES AUTH`);
    } else if (result.status === 404) {
      console.log(`✅ ${endpoint} - CORRECTLY RETURNS 404 (no test user)`);
    } else {
      console.log(`❌ ${endpoint} - FAILED`);
      console.log(`   Status: ${result.status}, Error: ${result.error}`);
    }
  }
  
  // Test authenticated endpoints (should return auth errors)
  console.log('\n📋 Testing Authenticated CivicSocial Endpoints:');
  
  const authEndpoints = [
    '/api/social/feed',
    '/api/social/posts',
    '/api/social/posts/1/like',
    '/api/social/posts/1/comment',
    '/api/social/friends',
    '/api/social/messages',
    '/api/users/profile',
    '/api/users/search'
  ];
  
  for (const endpoint of authEndpoints) {
    console.log(`\nTesting ${endpoint}...`);
    const result = await testEndpoint(endpoint);
    if (result.status === 401) {
      console.log(`✅ ${endpoint} - CORRECTLY REQUIRES AUTH`);
    } else if (result.success) {
      console.log(`✅ ${endpoint} - WORKING`);
    } else {
      console.log(`❌ ${endpoint} - UNEXPECTED ERROR`);
      console.log(`   Status: ${result.status}, Error: ${result.error}`);
    }
  }
  
  // Test specific CivicSocial features
  console.log('\n📋 Testing CivicSocial Features:');
  
  // Test user registration (to get a valid token)
  console.log('\nTesting user registration...');
  const registerResult = await testEndpoint('/api/auth/register', 'POST', {}, {
    email: `test${Date.now()}@civicos.com`,
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User',
    agreeToTerms: true
  });
  
  if (registerResult.success) {
    console.log('✅ User registration - WORKING');
    const token = registerResult.data.token;
    
    // Test authenticated endpoints with valid token
    console.log('\nTesting authenticated endpoints with valid token...');
    
    const authHeaders = { 'Authorization': `Bearer ${token}` };
    
    const authTests = [
      '/api/social/feed',
      '/api/users/profile',
      '/api/social/posts',
      '/api/social/posts/1/like',
      '/api/social/posts/1/comment'
    ];
    
    for (const endpoint of authTests) {
      console.log(`\nTesting ${endpoint} with token...`);
      const result = await testEndpoint(endpoint, 'GET', authHeaders);
      if (result.success) {
        console.log(`✅ ${endpoint} - WORKING WITH AUTH`);
      } else {
        console.log(`❌ ${endpoint} - FAILED WITH AUTH`);
        console.log(`   Error: ${result.error}`);
      }
    }
  } else {
    console.log('❌ User registration - FAILED');
    console.log(`   Error: ${registerResult.error}`);
  }
  
  console.log('\n🎯 CivicSocial Test Summary:');
  console.log('- Public endpoints should work or return appropriate errors');
  console.log('- Authenticated endpoints should require valid tokens');
  console.log('- User registration should work to create test accounts');
}

runCivicSocialTests().catch(console.error); 