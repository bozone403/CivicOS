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

async function runCoreTests() {
  // console.log removed for production
  
  // Test 1: User Registration (to get a valid token)
  // console.log removed for production
  const registerResult = await testEndpoint('/api/auth/register', 'POST', {}, {
    email: `test${Date.now()}@civicos.com`,
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User',
    agreeToTerms: true
  });
  
  if (!registerResult.success) {
    // console.log removed for production
    // console.log removed for production
    return;
  }
  
  // console.log removed for production
  const token = registerResult.data.token;
  const userId = registerResult.data.user.id;
  
  // Test 2: Create a social post
  // console.log removed for production
  const createPostResult = await testEndpoint('/api/social/posts', 'POST', {
    'Authorization': `Bearer ${token}`
  }, {
    content: 'Test post from CivicSocial functionality test',
    type: 'text',
    visibility: 'public'
  });
  
  if (createPostResult.success) {
    // console.log removed for production
    const postId = createPostResult.data.id;
    
    // Test 3: Like the post
    // console.log removed for production
    const likeResult = await testEndpoint(`/api/social/posts/${postId}/like`, 'POST', {
      'Authorization': `Bearer ${token}`
    });
    
    if (likeResult.success) {
      // console.log removed for production
    } else {
      // console.log removed for production
      // console.log removed for production
    }
    
    // Test 4: Comment on the post
    // console.log removed for production
    const commentResult = await testEndpoint(`/api/social/posts/${postId}/comment`, 'POST', {
      'Authorization': `Bearer ${token}`
    }, {
      content: 'Test comment from CivicSocial functionality test'
    });
    
    if (commentResult.success) {
      // console.log removed for production
    } else {
      // console.log removed for production
      // console.log removed for production
    }
    
    // Test 5: Get social feed
    // console.log removed for production
    const feedResult = await testEndpoint('/api/social/feed', 'GET', {
      'Authorization': `Bearer ${token}`
    });
    
    if (feedResult.success) {
      // console.log removed for production
      // console.log removed for production
    } else {
      // console.log removed for production
      // console.log removed for production
    }
    
  } else {
    // console.log removed for production
    // console.log removed for production
  }
  
  // Test 6: User Profile
  // console.log removed for production
  const profileResult = await testEndpoint('/api/users/profile', 'GET', {
    'Authorization': `Bearer ${token}`
  });
  
  if (profileResult.success) {
    // console.log removed for production
    // console.log removed for production
  } else {
    // console.log removed for production
    // console.log removed for production
  }
  
  // Test 7: User Search
  // console.log removed for production
  const searchResult = await testEndpoint('/api/users/search?q=test&limit=5', 'GET', {
    'Authorization': `Bearer ${token}`
  });
  
  if (searchResult.success) {
    // console.log removed for production
    // console.log removed for production
  } else {
    // console.log removed for production
    // console.log removed for production
  }
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  console.log('- Post interactions (like/comment): ⚠️ Needs investigation');
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
}

runCoreTests().catch(console.error); 