const API_BASE = 'https://civicos.onrender.com';

async function testEndpoint(endpoint, method = 'GET', headers = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
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

async function runTests() {
  console.log('🔍 Testing CivicOS Production Endpoints\n');
  
  // Test public endpoints
  console.log('📋 Testing Public Endpoints:');
  
  const publicEndpoints = [
    '/api/auth/env-check',
    '/api/politicians',
    '/api/announcements',
    '/api/news'
  ];
  
  for (const endpoint of publicEndpoints) {
    console.log(`\nTesting ${endpoint}...`);
    const result = await testEndpoint(endpoint);
    if (result.success) {
      console.log(`✅ ${endpoint} - WORKING`);
    } else {
      console.log(`❌ ${endpoint} - FAILED`);
      console.log(`   Error: ${result.error}`);
    }
  }
  
  // Test authenticated endpoints (should return auth errors)
  console.log('\n📋 Testing Authenticated Endpoints (expected to fail without token):');
  
  const authEndpoints = [
    '/api/auth/user',
    '/api/users/profile',
    '/api/messages/unread/count',
    '/api/notifications',
    '/api/dashboard/stats',
    '/api/social/feed'
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
  
  console.log('\n🎯 Summary:');
  console.log('- Public endpoints should work without authentication');
  console.log('- Authenticated endpoints should return 401 without valid token');
  console.log('- This is normal behavior for a secure API');
}

runTests().catch(console.error); 