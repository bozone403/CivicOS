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

async function runComprehensiveAudit() {
  console.log('🔍 COMPREHENSIVE CIVICOS AUDIT\n');
  
  // Get a valid token for authenticated tests
  console.log('📋 Step 1: Getting authentication token...');
  const registerResult = await testEndpoint('/api/auth/register', 'POST', {}, {
    email: `audit${Date.now()}@civicos.com`,
    password: 'auditpass123',
    firstName: 'Audit',
    lastName: 'User',
    agreeToTerms: true
  });
  
  let token = null;
  if (registerResult.success) {
    token = registerResult.data.token;
    console.log('✅ Authentication token obtained');
  } else {
    console.log('❌ Failed to get authentication token');
    console.log(`   Error: ${registerResult.error}`);
  }
  
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  // 1. AUTHENTICATION ENDPOINTS
  console.log('\n📋 1. AUTHENTICATION ENDPOINTS:');
  const authEndpoints = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/user',
    '/api/auth/env-check'
  ];
  
  for (const endpoint of authEndpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${endpoint}: ${result.success ? '✅' : '❌'} ${result.error || 'Working'}`);
  }
  
  // 2. USER MANAGEMENT ENDPOINTS
  console.log('\n📋 2. USER MANAGEMENT ENDPOINTS:');
  const userEndpoints = [
    '/api/users/profile',
    '/api/users/search?q=test&limit=5',
    '/api/users/profile/testuser'
  ];
  
  for (const endpoint of userEndpoints) {
    const result = await testEndpoint(endpoint, 'GET', authHeaders);
    console.log(`${endpoint}: ${result.success ? '✅' : '❌'} ${result.error || 'Working'}`);
  }
  
  // 3. SOCIAL/CIVICSOCIAL ENDPOINTS
  console.log('\n📋 3. SOCIAL/CIVICSOCIAL ENDPOINTS:');
  const socialEndpoints = [
    '/api/social/feed',
    '/api/social/posts',
    '/api/social/posts/1/like',
    '/api/social/posts/1/comment',
    '/api/social/friends',
    '/api/social/messages',
    '/api/social/posts/user/testuser'
  ];
  
  for (const endpoint of socialEndpoints) {
    const result = await testEndpoint(endpoint, 'GET', authHeaders);
    console.log(`${endpoint}: ${result.success ? '✅' : '❌'} ${result.error || 'Working'}`);
  }
  
  // 4. POLITICAL INTELLIGENCE ENDPOINTS
  console.log('\n📋 4. POLITICAL INTELLIGENCE ENDPOINTS:');
  const politicalEndpoints = [
    '/api/politicians',
    '/api/politicians/1',
    '/api/bills',
    '/api/bills/1',
    '/api/voting',
    '/api/elections',
    '/api/elections/1'
  ];
  
  for (const endpoint of politicalEndpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${endpoint}: ${result.success ? '✅' : '❌'} ${result.error || 'Working'}`);
  }
  
  // 5. NEWS & MEDIA ENDPOINTS
  console.log('\n📋 5. NEWS & MEDIA ENDPOINTS:');
  const newsEndpoints = [
    '/api/news',
    '/api/news/articles',
    '/api/news/trending',
    '/api/news/search?q=test'
  ];
  
  for (const endpoint of newsEndpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${endpoint}: ${result.success ? '✅' : '❌'} ${result.error || 'Working'}`);
  }
  
  // 6. LEGAL & RIGHTS ENDPOINTS
  console.log('\n📋 6. LEGAL & RIGHTS ENDPOINTS:');
  const legalEndpoints = [
    '/api/legal',
    '/api/legal/search',
    '/api/rights',
    '/api/cases',
    '/api/cases/1'
  ];
  
  for (const endpoint of legalEndpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${endpoint}: ${result.success ? '✅' : '❌'} ${result.error || 'Working'}`);
  }
  
  // 7. GOVERNMENT INTEGRITY ENDPOINTS
  console.log('\n📋 7. GOVERNMENT INTEGRITY ENDPOINTS:');
  const integrityEndpoints = [
    '/api/finance',
    '/api/lobbyists',
    '/api/procurement',
    '/api/corruption',
    '/api/leaks',
    '/api/foi',
    '/api/whistleblower'
  ];
  
  for (const endpoint of integrityEndpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${endpoint}: ${result.success ? '✅' : '❌'} ${result.error || 'Working'}`);
  }
  
  // 8. ENGAGEMENT ENDPOINTS
  console.log('\n📋 8. ENGAGEMENT ENDPOINTS:');
  const engagementEndpoints = [
    '/api/petitions',
    '/api/petitions/1',
    '/api/contacts',
    '/api/contacts/1',
    '/api/maps',
    '/api/memory',
    '/api/ledger',
    '/api/trust'
  ];
  
  for (const endpoint of engagementEndpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${endpoint}: ${result.success ? '✅' : '❌'} ${result.error || 'Working'}`);
  }
  
  // 9. SYSTEM ENDPOINTS
  console.log('\n📋 9. SYSTEM ENDPOINTS:');
  const systemEndpoints = [
    '/api/announcements',
    '/api/notifications',
    '/api/messages/unread/count',
    '/api/dashboard/stats',
    '/api/search?q=test',
    '/api/ai/chat',
    '/api/ai/models',
    '/health'
  ];
  
  for (const endpoint of systemEndpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${endpoint}: ${result.success ? '✅' : '❌'} ${result.error || 'Working'}`);
  }
  
  // 10. DATABASE FUNCTIONALITY TESTS
  console.log('\n📋 10. DATABASE FUNCTIONALITY TESTS:');
  
  if (token) {
    // Test post creation
    const createPostResult = await testEndpoint('/api/social/posts', 'POST', authHeaders, {
      content: 'Comprehensive audit test post',
      type: 'text',
      visibility: 'public'
    });
    
    if (createPostResult.success) {
      console.log('✅ Social post creation: Working');
      const postId = createPostResult.data.post.id;
      
      // Test like functionality
      const likeResult = await testEndpoint(`/api/social/posts/${postId}/like`, 'POST', authHeaders);
      console.log(`✅ Post like functionality: ${likeResult.success ? 'Working' : 'Broken'}`);
      
      // Test comment functionality
      const commentResult = await testEndpoint(`/api/social/posts/${postId}/comment`, 'POST', authHeaders, {
        content: 'Comprehensive audit test comment'
      });
      console.log(`✅ Post comment functionality: ${commentResult.success ? 'Working' : 'Broken'}`);
      
    } else {
      console.log('❌ Social post creation: Broken');
    }
  }
  
  console.log('\n🎯 COMPREHENSIVE AUDIT SUMMARY:');
  console.log('This audit has tested all major endpoints across the CivicOS platform.');
  console.log('Check the results above to identify missing or broken functionality.');
}

runComprehensiveAudit().catch(console.error); 