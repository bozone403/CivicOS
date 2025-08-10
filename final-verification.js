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

async function runFinalVerification() {
  // console.log removed for production
  
  // Get authentication token
  // console.log removed for production
  const registerResult = await testEndpoint('/api/auth/register', 'POST', {}, {
    email: `finalverify${Date.now()}@civicos.com`,
    password: 'finalverifypass123',
    firstName: 'Final',
    lastName: 'Verification',
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
  
  // Test login
  const loginResult = await testEndpoint('/api/auth/login', 'POST', {}, {
    email: `finalverify${Date.now()}@civicos.com`,
    password: 'finalverifypass123'
  });
  
  if (loginResult.success) {
    // console.log removed for production
  } else {
    // console.log removed for production
    // console.log removed for production
  }
  
  // Test user profile
  const userResult = await testEndpoint('/api/auth/user', 'GET', authHeaders);
  if (userResult.success) {
    // console.log removed for production
  } else {
    // console.log removed for production
    // console.log removed for production
  }
  
  // console.log removed for production
  
  if (token) {
    // Test post creation
    const createPostResult = await testEndpoint('/api/social/posts', 'POST', authHeaders, {
      content: 'Final verification test post',
      type: 'text',
      visibility: 'public'
    });
    
    if (createPostResult.success) {
      // console.log removed for production
      const postId = createPostResult.data.post.id;
      
      // Test like functionality
      const likeResult = await testEndpoint(`/api/social/posts/${postId}/like`, 'POST', authHeaders);
      if (likeResult.success) {
        // console.log removed for production
      } else {
        // console.log removed for production
        // console.log removed for production
      }
      
      // Test comment functionality
      const commentResult = await testEndpoint(`/api/social/posts/${postId}/comment`, 'POST', authHeaders, {
        content: 'Final verification test comment'
      });
      if (commentResult.success) {
        // console.log removed for production
      } else {
        // console.log removed for production
        // console.log removed for production
      }
      
      // Test social feed
      const feedResult = await testEndpoint('/api/social/feed', 'GET', authHeaders);
      if (feedResult.success) {
        // console.log removed for production
      } else {
        // console.log removed for production
        // console.log removed for production
      }
      
    } else {
      // console.log removed for production
      // console.log removed for production
    }
  }
  
  // console.log removed for production
  
  // Test core endpoints
  const coreEndpoints = [
    '/api/politicians',
    '/api/bills',
    '/api/elections',
    '/api/legal',
    '/api/cases',
    '/api/finance',
    '/api/lobbyists',
    '/api/petitions',
    '/api/memory',
    '/api/ledger',
    '/api/trust',
    '/api/notifications',
    '/api/messages/unread/count',
    '/api/dashboard/stats',
    '/api/search',
    '/api/ai/models',
    '/health'
  ];
  
  const coreResults = [];
  for (const endpoint of coreEndpoints) {
    const result = await testEndpoint(endpoint, 'GET', authHeaders);
    coreResults.push({ endpoint, ...result });
    
    if (result.success) {
      // console.log removed for production
    } else {
      // console.log removed for production
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // console.log removed for production
  
  const userEndpoints = [
    '/api/users/profile',
    '/api/users/search?q=test&limit=5',
    '/api/users/profile/testuser'
  ];
  
  for (const endpoint of userEndpoints) {
    const result = await testEndpoint(endpoint, 'GET', authHeaders);
    if (result.success) {
      // console.log removed for production
    } else {
      // console.log removed for production
    }
  }
  
  // console.log removed for production
  
  const systemEndpoints = [
    '/api/announcements',
    '/api/auth/env-check'
  ];
  
  for (const endpoint of systemEndpoints) {
    const result = await testEndpoint(endpoint, 'GET');
    if (result.success) {
      // console.log removed for production
    } else {
      // console.log removed for production
    }
  }
  
  // Summary
  // console.log removed for production
  // console.log removed for production
  
  const workingCore = coreResults.filter(r => r.success).length;
  const brokenCore = coreResults.filter(r => !r.success).length;
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  console.log(`Success Rate: ${((workingCore / coreResults.length) * 100).toFixed(1)}%`);
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  
  // console.log removed for production
  // console.log removed for production
}

runFinalVerification().catch(console.error); 