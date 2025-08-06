const API_BASE = 'https://civicos.onrender.com';

async function testCivicSocialProfile() {
  console.log('🔍 Testing CivicSocial Profile Loading Issue\n');
  
  // Step 1: Test authentication
  console.log('📋 Step 1: Testing Authentication...');
  const registerResult = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `profilefix${Date.now()}@civicos.com`,
      password: 'profilefixpass123',
      firstName: 'Profile',
      lastName: 'Fix',
      agreeToTerms: true
    })
  });
  
  let token = null;
  if (registerResult.ok) {
    const userData = await registerResult.json();
    token = userData.token;
    console.log('✅ User registration successful');
    console.log(`   User ID: ${userData.user.id}`);
  } else {
    const errorData = await registerResult.json();
    console.log('❌ User registration failed');
    console.log(`   Error: ${errorData.error || errorData.message}`);
    return;
  }
  
  // Step 2: Test social feed endpoint
  console.log('\n📋 Step 2: Testing Social Feed Endpoint...');
  const feedResult = await fetch(`${API_BASE}/api/social/feed`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (feedResult.ok) {
    const feedData = await feedResult.json();
    console.log('✅ Social feed endpoint working');
    console.log(`   Posts in feed: ${feedData.feed?.length || 0}`);
  } else {
    const errorData = await feedResult.json();
    console.log('❌ Social feed endpoint failed');
    console.log(`   Error: ${errorData.error || errorData.message}`);
  }
  
  // Step 3: Test user posts endpoint
  console.log('\n📋 Step 3: Testing User Posts Endpoint...');
  const userPostsResult = await fetch(`${API_BASE}/api/social/posts/user/testuser`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (userPostsResult.ok) {
    const postsData = await userPostsResult.json();
    console.log('✅ User posts endpoint working');
    console.log(`   User posts: ${postsData.posts?.length || 0}`);
  } else {
    const errorData = await userPostsResult.json();
    console.log('❌ User posts endpoint failed');
    console.log(`   Error: ${errorData.error || errorData.message}`);
  }
  
  // Step 4: Test user profile endpoint
  console.log('\n📋 Step 4: Testing User Profile Endpoint...');
  const profileResult = await fetch(`${API_BASE}/api/users/profile`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (profileResult.ok) {
    const profileData = await profileResult.json();
    console.log('✅ User profile endpoint working');
    console.log(`   Username: ${profileData.username}`);
  } else {
    const errorData = await profileResult.json();
    console.log('❌ User profile endpoint failed');
    console.log(`   Error: ${errorData.error || errorData.message}`);
  }
  
  // Step 5: Create a test post to verify functionality
  console.log('\n📋 Step 5: Testing Post Creation...');
  const createPostResult = await fetch(`${API_BASE}/api/social/posts`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: 'Test post for profile fix verification',
      type: 'text',
      visibility: 'public'
    })
  });
  
  if (createPostResult.ok) {
    const postData = await createPostResult.json();
    console.log('✅ Post creation working');
    console.log(`   Post ID: ${postData.post.id}`);
    
    // Test like functionality
    const likeResult = await fetch(`${API_BASE}/api/social/posts/${postData.post.id}/like`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (likeResult.ok) {
      console.log('✅ Post like functionality working');
    } else {
      const errorData = await likeResult.json();
      console.log('❌ Post like functionality failed');
      console.log(`   Error: ${errorData.error || errorData.message}`);
    }
    
  } else {
    const errorData = await createPostResult.json();
    console.log('❌ Post creation failed');
    console.log(`   Error: ${errorData.error || errorData.message}`);
  }
  
  console.log('\n📊 CIVICSOCIAL PROFILE DIAGNOSIS SUMMARY:');
  console.log('=====================================');
  console.log('The issue is likely one of the following:');
  console.log('1. Authentication token not being sent properly from frontend');
  console.log('2. Token expiration causing authentication failures');
  console.log('3. Frontend not handling authentication state correctly');
  console.log('4. Social feed endpoint requiring valid authentication');
  
  console.log('\n🔧 RECOMMENDED FIXES:');
  console.log('=====================================');
  console.log('1. Ensure frontend sends valid JWT token in Authorization header');
  console.log('2. Check token expiration and refresh logic');
  console.log('3. Verify authentication state management in React');
  console.log('4. Add proper error handling for authentication failures');
  console.log('5. Implement token refresh mechanism');
}

testCivicSocialProfile().catch(console.error); 