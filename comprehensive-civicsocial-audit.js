const API_BASE = 'https://civicos.onrender.com';

async function comprehensiveCivicSocialAudit() {
  // console.log removed for production
  
  // Step 1: Test authentication and get token
  // console.log removed for production
  const registerResult = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `audit${Date.now()}@civicos.com`,
      password: 'auditpass123',
      firstName: 'Audit',
      lastName: 'User',
      agreeToTerms: true
    })
  });
  
  let token = null;
  if (registerResult.ok) {
    const userData = await registerResult.json();
    token = userData.token;
    // console.log removed for production
  } else {
    // console.log removed for production
    return;
  }
  
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Step 2: Test all CivicSocial endpoints
  // console.log removed for production
  
  const endpoints = [
    // Core social functionality
    { name: 'Social Feed', url: '/api/social/feed', method: 'GET' },
    { name: 'Create Post', url: '/api/social/posts', method: 'POST', body: { content: 'Test post', type: 'text' } },
    { name: 'User Posts', url: '/api/social/posts/user/testuser', method: 'GET' },
    { name: 'Like Post', url: '/api/social/posts/1/like', method: 'POST', body: { reaction: '👍' } },
    { name: 'Comment on Post', url: '/api/social/posts/1/comment', method: 'POST', body: { content: 'Test comment' } },
    
    // Messaging system
    { name: 'Conversations', url: '/api/social/conversations', method: 'GET' },
    { name: 'Messages', url: '/api/social/messages?otherUserId=test', method: 'GET' },
    { name: 'Send Message', url: '/api/social/messages', method: 'POST', body: { recipientId: 'test', content: 'Test message' } },
    
    // Friends system
    { name: 'Friends List', url: '/api/social/friends?status=accepted', method: 'GET' },
    { name: 'Pending Requests', url: '/api/social/friends?status=pending', method: 'GET' },
    { name: 'Add Friend', url: '/api/social/friends', method: 'POST', body: { friendId: 'test' } },
    { name: 'Accept Friend', url: '/api/social/friends/accept', method: 'POST', body: { friendId: 'test' } },
    
    // User search and profiles
    { name: 'User Search', url: '/api/social/users/search?q=test', method: 'GET' },
    { name: 'User Profile', url: '/api/users/profile/testuser', method: 'GET' },
    { name: 'Follow User', url: '/api/social/follow', method: 'POST', body: { userId: 'test' } },
    
    // Notifications
    { name: 'Notifications', url: '/api/social/notifications', method: 'GET' },
    { name: 'Mark Notification Read', url: '/api/social/notifications/1/read', method: 'POST' },
    
    // Activity and engagement
    { name: 'User Activity', url: '/api/social/activity', method: 'GET' },
    { name: 'User Stats', url: '/api/social/stats', method: 'GET' },
    
    // Content management
    { name: 'Bookmarks', url: '/api/social/bookmarks', method: 'GET' },
    { name: 'Add Bookmark', url: '/api/social/bookmarks', method: 'POST', body: { postId: 1 } },
    { name: 'Shares', url: '/api/social/shares', method: 'GET' },
    { name: 'Share Post', url: '/api/social/posts/1/share', method: 'POST' }
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`${API_BASE}${endpoint.url}`, options);
      const data = await response.json();
      
      if (response.ok) {
        results[endpoint.name] = { status: '✅ Working', data: data };
        // console.log removed for production
      } else {
        results[endpoint.name] = { status: '❌ Failed', error: data.error || data.message };
        // console.log removed for production
      }
    } catch (error) {
      results[endpoint.name] = { status: '❌ Error', error: error.message };
      // console.log removed for production
    }
  }
  
  // Step 3: Analyze missing functionality
  // console.log removed for production
  
  const workingEndpoints = Object.keys(results).filter(key => results[key].status === '✅ Working');
  const brokenEndpoints = Object.keys(results).filter(key => results[key].status.startsWith('❌'));
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  
  // console.log removed for production
  // console.log removed for production
  
  // Check for missing core features
  const missingFeatures = [];
  
  if (!workingEndpoints.includes('Conversations')) {
    missingFeatures.push('Messaging System - No conversation management');
  }
  
  if (!workingEndpoints.includes('Messages')) {
    missingFeatures.push('Direct Messaging - Cannot send/receive messages');
  }
  
  if (!workingEndpoints.includes('Friends List')) {
    missingFeatures.push('Friends System - Cannot manage friends');
  }
  
  if (!workingEndpoints.includes('User Search')) {
    missingFeatures.push('User Discovery - Cannot search for other users');
  }
  
  if (!workingEndpoints.includes('User Profile')) {
    missingFeatures.push('Profile Navigation - Cannot view other user profiles');
  }
  
  if (!workingEndpoints.includes('Notifications')) {
    missingFeatures.push('Notification System - No real-time notifications');
  }
  
  if (!workingEndpoints.includes('User Activity')) {
    missingFeatures.push('Activity Feed - No user activity tracking');
  }
  
  if (!workingEndpoints.includes('Bookmarks')) {
    missingFeatures.push('Content Saving - Cannot bookmark posts');
  }
  
  if (!workingEndpoints.includes('Shares')) {
    missingFeatures.push('Content Sharing - Cannot share posts');
  }
  
  missingFeatures.forEach(feature => {
    // console.log removed for production
  });
  
  // Step 4: Check for missing frontend components
  // console.log removed for production
  
  const requiredComponents = [
    'MessagingSystem',
    'FriendsManager', 
    'NotificationsCenter',
    'UserSearch',
    'UserProfile',
    'SocialFeed',
    'CivicSocialLayout',
    'CivicSocialCard',
    'CivicSocialPostCard',
    'CivicSocialProfileCard'
  ];
  
  // console.log removed for production
  // console.log removed for production
  
  // This would need to be checked against actual file system
  // For now, we'll assume they exist but may not be properly integrated
  
  // console.log removed for production
  
  // Step 5: Generate comprehensive fix plan
  // console.log removed for production
  
  // console.log removed for production
  // console.log removed for production
  
  if (missingFeatures.length > 0) {
    // console.log removed for production
    missingFeatures.forEach((feature, index) => {
      // console.log removed for production
    });
  } else {
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
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  
  return {
    workingEndpoints,
    brokenEndpoints,
    missingFeatures,
    results
  };
}

comprehensiveCivicSocialAudit().catch(console.error); 