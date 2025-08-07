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
  // console.log removed for production
  
  // Test public endpoints
  // console.log removed for production
  
  const publicEndpoints = [
    '/api/auth/env-check',
    '/api/politicians',
    '/api/announcements',
    '/api/news'
  ];
  
  for (const endpoint of publicEndpoints) {
    // console.log removed for production
    const result = await testEndpoint(endpoint);
    if (result.success) {
      // console.log removed for production
    } else {
      // console.log removed for production
      // console.log removed for production
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
    // console.log removed for production
    const result = await testEndpoint(endpoint);
    if (result.status === 401) {
      // console.log removed for production
    } else if (result.success) {
      // console.log removed for production
    } else {
      // console.log removed for production
      // console.log removed for production
    }
  }
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
}

runTests().catch(console.error); 