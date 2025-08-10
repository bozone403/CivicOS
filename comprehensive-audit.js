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
  // console.log removed for production
  
  // Get a valid token for authenticated tests
  // console.log removed for production
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
    // console.log removed for production
  } else {
    // console.log removed for production
    // console.log removed for production
  }
  
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  // 1. AUTHENTICATION ENDPOINTS
  // console.log removed for production
  const authEndpoints = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/user',
    '/api/auth/env-check'
  ];
  
  for (const endpoint of authEndpoints) {
    const result = await testEndpoint(endpoint);
    // console.log removed for production
  }
  
  // 2. USER MANAGEMENT ENDPOINTS
  // console.log removed for production
  const userEndpoints = [
    '/api/users/profile',
    '/api/users/search?q=test&limit=5',
    '/api/users/profile/testuser'
  ];
  
  for (const endpoint of userEndpoints) {
    const result = await testEndpoint(endpoint, 'GET', authHeaders);
    // console.log removed for production
  }
  
  // 3. SOCIAL/CIVICSOCIAL ENDPOINTS
  // console.log removed for production
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
    // console.log removed for production
  }
  
  // 4. POLITICAL INTELLIGENCE ENDPOINTS
  // console.log removed for production
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
    // console.log removed for production
  }
  
  // 5. NEWS & MEDIA ENDPOINTS
  // console.log removed for production
  const newsEndpoints = [
    '/api/news',
    '/api/news/articles',
    '/api/news/trending',
    '/api/news/search?q=test'
  ];
  
  for (const endpoint of newsEndpoints) {
    const result = await testEndpoint(endpoint);
    // console.log removed for production
  }
  
  // 6. LEGAL & RIGHTS ENDPOINTS
  // console.log removed for production
  const legalEndpoints = [
    '/api/legal',
    '/api/legal/search',
    '/api/rights',
    '/api/cases',
    '/api/cases/1'
  ];
  
  for (const endpoint of legalEndpoints) {
    const result = await testEndpoint(endpoint);
    // console.log removed for production
  }
  
  // 7. GOVERNMENT INTEGRITY ENDPOINTS
  // console.log removed for production
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
    // console.log removed for production
  }
  
  // 8. ENGAGEMENT ENDPOINTS
  // console.log removed for production
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
    // console.log removed for production
  }
  
  // 9. SYSTEM ENDPOINTS
  // console.log removed for production
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
    // console.log removed for production
  }
  
  // 10. DATABASE FUNCTIONALITY TESTS
  // console.log removed for production
  
  if (token) {
    // Test post creation
    const createPostResult = await testEndpoint('/api/social/posts', 'POST', authHeaders, {
      content: 'Comprehensive audit test post',
      type: 'text',
      visibility: 'public'
    });
    
    if (createPostResult.success) {
      // console.log removed for production
      const postId = createPostResult.data.post.id;
      
      // Test like functionality
      const likeResult = await testEndpoint(`/api/social/posts/${postId}/like`, 'POST', authHeaders);
      // console.log removed for production
      
      // Test comment functionality
      const commentResult = await testEndpoint(`/api/social/posts/${postId}/comment`, 'POST', authHeaders, {
        content: 'Comprehensive audit test comment'
      });
      // console.log removed for production
      
    } else {
      // console.log removed for production
    }
  }
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
}

runComprehensiveAudit().catch(console.error); 