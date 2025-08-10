const API_BASE = 'https://civicos.onrender.com';

async function testCivicSocialProfile() {
  // console.log removed for production
  
  // Step 1: Test authentication
  // console.log removed for production
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
    // console.log removed for production
    // console.log removed for production
  } else {
    const errorData = await registerResult.json();
    // console.log removed for production
    // console.log removed for production
    return;
  }
  
  // Step 2: Test social feed endpoint
  // console.log removed for production
  const feedResult = await fetch(`${API_BASE}/api/social/feed`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (feedResult.ok) {
    const feedData = await feedResult.json();
    // console.log removed for production
    // console.log removed for production
  } else {
    const errorData = await feedResult.json();
    // console.log removed for production
    // console.log removed for production
  }
  
  // Step 3: Test user posts endpoint
  // console.log removed for production
  const userPostsResult = await fetch(`${API_BASE}/api/social/posts/user/testuser`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (userPostsResult.ok) {
    const postsData = await userPostsResult.json();
    // console.log removed for production
    // console.log removed for production
  } else {
    const errorData = await userPostsResult.json();
    // console.log removed for production
    // console.log removed for production
  }
  
  // Step 4: Test user profile endpoint
  // console.log removed for production
  const profileResult = await fetch(`${API_BASE}/api/users/profile`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (profileResult.ok) {
    const profileData = await profileResult.json();
    // console.log removed for production
    // console.log removed for production
  } else {
    const errorData = await profileResult.json();
    // console.log removed for production
    // console.log removed for production
  }
  
  // Step 5: Create a test post to verify functionality
  // console.log removed for production
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
    // console.log removed for production
    // console.log removed for production
    
    // Test like functionality
    const likeResult = await fetch(`${API_BASE}/api/social/posts/${postData.post.id}/like`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (likeResult.ok) {
      // console.log removed for production
    } else {
      const errorData = await likeResult.json();
      // console.log removed for production
      // console.log removed for production
    }
    
  } else {
    const errorData = await createPostResult.json();
    // console.log removed for production
    // console.log removed for production
  }
  
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

testCivicSocialProfile().catch(console.error); 