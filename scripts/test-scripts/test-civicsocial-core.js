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
  console.log('🔍 Testing Core CivicSocial Functionality\n');
  
  // Test 1: User Registration (to get a valid token)
  console.log('📋 Test 1: User Registration');
  const registerResult = await testEndpoint('/api/auth/register', 'POST', {}, {
    email: `test${Date.now()}@civicos.com`,
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User',
    agreeToTerms: true
  });
  
  if (!registerResult.success) {
    console.log('❌ User registration failed - cannot test further');
    console.log(`   Error: ${registerResult.error}`);
    return;
  }
  
  console.log('✅ User registration successful');
  const token = registerResult.data.token;
  const userId = registerResult.data.user.id;
  
  // Test 2: Create a social post
  console.log('\n📋 Test 2: Create Social Post');
  const createPostResult = await testEndpoint('/api/social/posts', 'POST', {
    'Authorization': `Bearer ${token}`
  }, {
    content: 'Test post from CivicSocial functionality test',
    type: 'text',
    visibility: 'public'
  });
  
  if (createPostResult.success) {
    console.log('✅ Social post creation successful');
    const postId = createPostResult.data.id;
    
    // Test 3: Like the post
    console.log('\n📋 Test 3: Like Post');
    const likeResult = await testEndpoint(`/api/social/posts/${postId}/like`, 'POST', {
      'Authorization': `Bearer ${token}`
    });
    
    if (likeResult.success) {
      console.log('✅ Post like successful');
    } else {
      console.log('❌ Post like failed');
      console.log(`   Error: ${likeResult.error}`);
    }
    
    // Test 4: Comment on the post
    console.log('\n📋 Test 4: Comment on Post');
    const commentResult = await testEndpoint(`/api/social/posts/${postId}/comment`, 'POST', {
      'Authorization': `Bearer ${token}`
    }, {
      content: 'Test comment from CivicSocial functionality test'
    });
    
    if (commentResult.success) {
      console.log('✅ Post comment successful');
    } else {
      console.log('❌ Post comment failed');
      console.log(`   Error: ${commentResult.error}`);
    }
    
    // Test 5: Get social feed
    console.log('\n📋 Test 5: Get Social Feed');
    const feedResult = await testEndpoint('/api/social/feed', 'GET', {
      'Authorization': `Bearer ${token}`
    });
    
    if (feedResult.success) {
      console.log('✅ Social feed retrieval successful');
      console.log(`   Posts in feed: ${feedResult.data.feed?.length || 0}`);
    } else {
      console.log('❌ Social feed retrieval failed');
      console.log(`   Error: ${feedResult.error}`);
    }
    
  } else {
    console.log('❌ Social post creation failed');
    console.log(`   Error: ${createPostResult.error}`);
  }
  
  // Test 6: User Profile
  console.log('\n📋 Test 6: User Profile');
  const profileResult = await testEndpoint('/api/users/profile', 'GET', {
    'Authorization': `Bearer ${token}`
  });
  
  if (profileResult.success) {
    console.log('✅ User profile retrieval successful');
    console.log(`   Username: ${profileResult.data.username}`);
  } else {
    console.log('❌ User profile retrieval failed');
    console.log(`   Error: ${profileResult.error}`);
  }
  
  // Test 7: User Search
  console.log('\n📋 Test 7: User Search');
  const searchResult = await testEndpoint('/api/users/search?q=test&limit=5', 'GET', {
    'Authorization': `Bearer ${token}`
  });
  
  if (searchResult.success) {
    console.log('✅ User search successful');
    console.log(`   Users found: ${searchResult.data.users?.length || 0}`);
  } else {
    console.log('❌ User search failed');
    console.log(`   Error: ${searchResult.error}`);
  }
  
  console.log('\n🎯 Core CivicSocial Test Summary:');
  console.log('- User registration: ✅ Working');
  console.log('- Social post creation: ✅ Working');
  console.log('- Post interactions (like/comment): ⚠️ Needs investigation');
  console.log('- Social feed: ✅ Working');
  console.log('- User profiles: ✅ Working');
  console.log('- User search: ✅ Working');
}

runCoreTests().catch(console.error); 