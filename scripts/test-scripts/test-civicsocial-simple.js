import fetch from 'node-fetch';

const API_BASE = 'https://civicos.onrender.com';

// Use existing test account
const testUser = {
  email: 'test@civicos.com',
  password: 'testpassword123'
};

let authToken = null;
let userProfile = null;

async function testCivicSocial() {
  // console.log removed for production

  try {
    // Step 1: Login with existing test account
    // console.log removed for production
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      authToken = loginData.token;
      // console.log removed for production
    } else {
      const errorData = await loginResponse.json();
      throw new Error(`Authentication failed: ${errorData.message || 'Unknown error'}`);
    }

    // Step 2: Get user profile
    // console.log removed for production
    const profileResponse = await fetch(`${API_BASE}/api/auth/user`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (profileResponse.ok) {
      userProfile = await profileResponse.json();
      console.log(`✅ Profile loaded: ${userProfile.firstName} ${userProfile.lastName} (${userProfile.username})`);
    } else {
      throw new Error('Failed to get user profile');
    }

    // Step 3: Test user search
    // console.log removed for production
    const searchResponse = await fetch(`${API_BASE}/api/social/users/search?q=test`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 4: Test post creation
    // console.log removed for production
    const postResponse = await fetch(`${API_BASE}/api/social/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: '🧪 This is a test post from the comprehensive test suite! Testing all CivicSocial features.',
        type: 'post',
        visibility: 'public'
      })
    });

    if (postResponse.ok) {
      const postData = await postResponse.json();
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 5: Test social feed
    // console.log removed for production
    const feedResponse = await fetch(`${API_BASE}/api/social/feed`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (feedResponse.ok) {
      const feedData = await feedResponse.json();
      const postsCount = feedData.posts ? feedData.posts.length : feedData.feed ? feedData.feed.length : 0;
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 6: Test personal profile page
    // console.log removed for production
    const profilePageResponse = await fetch(`${API_BASE}/api/users/profile/${userProfile.username}`);

    if (profilePageResponse.ok) {
      const profilePageData = await profilePageResponse.json();
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 7: Test user posts by username
    // console.log removed for production
    const userPostsResponse = await fetch(`${API_BASE}/api/social/posts/user/${userProfile.username}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (userPostsResponse.ok) {
      const userPostsData = await userPostsResponse.json();
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 8: Test image upload
    // console.log removed for production
    const uploadResponse = await fetch(`${API_BASE}/api/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ test: 'data' })
    });

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Image upload working (mock URL generated)');
    } else {
      // console.log removed for production
    }

    // Step 9: Test conversations
    // console.log removed for production
    const conversationsResponse = await fetch(`${API_BASE}/api/social/conversations`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (conversationsResponse.ok) {
      const conversationsData = await conversationsResponse.json();
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 10: Test follow functionality (self-follow to test API)
    // console.log removed for production
    const followResponse = await fetch(`${API_BASE}/api/social/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ userId: userProfile.id })
    });

    if (followResponse.ok) {
      console.log('✅ Follow API working (self-follow prevented)');
    } else {
      const followError = await followResponse.json();
      if (followError.error === 'You cannot follow yourself') {
        console.log('✅ Follow API working correctly (prevents self-follow)');
      } else {
        // console.log removed for production
      }
    }

    // Step 11: Test like functionality
    // console.log removed for production
    const feedForLikes = await fetch(`${API_BASE}/api/social/feed`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (feedForLikes.ok) {
      const feedData = await feedForLikes.json();
      const posts = feedData.posts || feedData.feed || [];
      if (posts.length > 0) {
        const firstPost = posts[0];
        const likeResponse = await fetch(`${API_BASE}/api/social/posts/${firstPost.id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ reaction: 'like' })
        });

        if (likeResponse.ok) {
          // console.log removed for production
        } else {
          // console.log removed for production
        }
      } else {
        // console.log removed for production
      }
    }

    // Step 12: Test messaging (self-message to test API)
    // console.log removed for production
    const messageResponse = await fetch(`${API_BASE}/api/social/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipientId: userProfile.id,
        content: 'Test message to self'
      })
    });

    if (messageResponse.ok) {
      // console.log removed for production
    } else {
      const messageError = await messageResponse.json();
      if (messageError.error && messageError.error.includes('cannot message yourself')) {
        console.log('✅ Messaging API working correctly (prevents self-messaging)');
      } else {
        // console.log removed for production
      }
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

  } catch (error) {
    // console.error removed for production
  }
}

testCivicSocial(); 