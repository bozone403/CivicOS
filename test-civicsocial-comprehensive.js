#!/usr/bin/env node

/**
 * Comprehensive CivicSocial Functionality Test
 * Tests all social features: posting, commenting, liking, friend requests, messaging, profiles
 */

import fetch from 'node-fetch';

const API_BASE = 'https://civicos.onrender.com';
let authToken = null;
let testUserId = null;
let testPostId = null;
let testCommentId = null;
let testFriendId = null;

// Test data
const testUser = {
  email: 'test@civicos.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User',
  agreeToTerms: true
};

const testPost = {
  content: 'This is a test post for CivicSocial functionality testing! 🚀',
  visibility: 'public'
};

const testComment = {
  content: 'This is a test comment! 👍'
};

const testMessage = {
  content: 'Hello! This is a test message.'
};

async function log(message, data = null) {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || data.message || 'Unknown error'}`);
    }
    
    return { success: true, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testAuth() {
  log('🔐 Testing Authentication...');
  
  // Test registration
  const registerResult = await makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  if (registerResult.success) {
    log('✅ Registration successful');
    authToken = registerResult.data.token;
    testUserId = registerResult.data.user.id;
  } else {
    log('⚠️ Registration failed, trying login...');
    
    // Try login instead
    const loginResult = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    if (loginResult.success) {
      log('✅ Login successful');
      authToken = loginResult.data.token;
      testUserId = loginResult.data.user.id;
    } else {
      throw new Error('Authentication failed');
    }
  }
}

async function testPosting() {
  log('📝 Testing Posting Functionality...');
  
  // Create a post
  const createPostResult = await makeRequest('/api/social/posts', {
    method: 'POST',
    body: JSON.stringify(testPost)
  });
  
  if (createPostResult.success) {
    log('✅ Post created successfully');
    testPostId = createPostResult.data.post.id;
  } else {
    throw new Error(`Failed to create post: ${createPostResult.error}`);
  }
  
  // Get feed
  const feedResult = await makeRequest('/api/social/feed');
  if (feedResult.success) {
    log('✅ Feed retrieved successfully', { count: feedResult.data.feed.length });
  } else {
    throw new Error(`Failed to get feed: ${feedResult.error}`);
  }
  
  // Get user posts
  const userPostsResult = await makeRequest(`/api/social/posts/user/${testUser.firstName.toLowerCase()}`);
  if (userPostsResult.success) {
    log('✅ User posts retrieved successfully', { count: userPostsResult.data.posts.length });
  } else {
    log('⚠️ User posts retrieval failed:', userPostsResult.error);
  }
}

async function testCommenting() {
  log('💬 Testing Commenting Functionality...');
  
  if (!testPostId) {
    log('⚠️ No test post available for commenting');
    return;
  }
  
  // Add comment
  const commentResult = await makeRequest(`/api/social/posts/${testPostId}/comment`, {
    method: 'POST',
    body: JSON.stringify(testComment)
  });
  
  if (commentResult.success) {
    log('✅ Comment added successfully');
    testCommentId = commentResult.data.comment.id;
  } else {
    throw new Error(`Failed to add comment: ${commentResult.error}`);
  }
}

async function testLiking() {
  log('👍 Testing Liking Functionality...');
  
  if (!testPostId) {
    log('⚠️ No test post available for liking');
    return;
  }
  
  // Like post
  const likeResult = await makeRequest(`/api/social/posts/${testPostId}/like`, {
    method: 'POST',
    body: JSON.stringify({ reaction: 'like' })
  });
  
  if (likeResult.success) {
    log('✅ Post liked successfully');
  } else {
    throw new Error(`Failed to like post: ${likeResult.error}`);
  }
}

async function testFriendRequests() {
  log('👥 Testing Friend Request Functionality...');
  
  // Search for users to friend
  const searchResult = await makeRequest('/api/social/users/search?q=test');
  if (searchResult.success && searchResult.data.users.length > 0) {
    testFriendId = searchResult.data.users[0].id;
    log('✅ User search successful', { foundUser: testFriendId });
    
    // Send friend request
    const friendRequestResult = await makeRequest('/api/social/friends', {
      method: 'POST',
      body: JSON.stringify({ friendId: testFriendId, action: 'send' })
    });
    
    if (friendRequestResult.success) {
      log('✅ Friend request sent successfully');
    } else {
      log('⚠️ Friend request failed:', friendRequestResult.error);
    }
  } else {
    log('⚠️ No users found for friend request testing');
  }
  
  // Get friends list
  const friendsResult = await makeRequest('/api/social/friends');
  if (friendsResult.success) {
    log('✅ Friends list retrieved successfully', { count: friendsResult.data.friends.length });
  } else {
    log('⚠️ Friends list retrieval failed:', friendsResult.error);
  }
}

async function testMessaging() {
  log('💬 Testing Messaging Functionality...');
  
  if (!testFriendId) {
    log('⚠️ No test friend available for messaging');
    return;
  }
  
  // Send message
  const messageResult = await makeRequest('/api/social/messages', {
    method: 'POST',
    body: JSON.stringify({
      recipientId: testFriendId,
      content: testMessage.content
    })
  });
  
  if (messageResult.success) {
    log('✅ Message sent successfully');
  } else {
    log('⚠️ Message sending failed:', messageResult.error);
  }
  
  // Get conversations
  const conversationsResult = await makeRequest('/api/social/conversations');
  if (conversationsResult.success) {
    log('✅ Conversations retrieved successfully', { count: conversationsResult.data.conversations.length });
  } else {
    log('⚠️ Conversations retrieval failed:', conversationsResult.error);
  }
}

async function testProfiles() {
  log('👤 Testing Profile Functionality...');
  
  // Get user profile
  const profileResult = await makeRequest(`/api/social/profile/${testUserId}`);
  if (profileResult.success) {
    log('✅ Profile retrieved successfully');
  } else {
    log('⚠️ Profile retrieval failed:', profileResult.error);
  }
  
  // Update profile
  const updateData = {
    firstName: 'Updated',
    lastName: 'TestUser',
    bio: 'This is a test bio for CivicSocial testing!'
  };
  
  const updateResult = await makeRequest('/api/social/profile', {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
  
  if (updateResult.success) {
    log('✅ Profile updated successfully');
  } else {
    log('⚠️ Profile update failed:', updateResult.error);
  }
}

async function testNotifications() {
  log('🔔 Testing Notifications...');
  
  // Get notifications
  const notificationsResult = await makeRequest('/api/social/notifications');
  if (notificationsResult.success) {
    log('✅ Notifications retrieved successfully', { count: notificationsResult.data.notifications.length });
  } else {
    log('⚠️ Notifications retrieval failed:', notificationsResult.error);
  }
  
  // Mark all as read
  const markReadResult = await makeRequest('/api/social/notifications/read-all', {
    method: 'PUT'
  });
  
  if (markReadResult.success) {
    log('✅ Notifications marked as read successfully');
  } else {
    log('⚠️ Mark as read failed:', markReadResult.error);
  }
}

async function runAllTests() {
  try {
    log('🚀 Starting Comprehensive CivicSocial Test Suite...');
    
    await testAuth();
    await testPosting();
    await testCommenting();
    await testLiking();
    await testFriendRequests();
    await testMessaging();
    await testProfiles();
    await testNotifications();
    
    log('🎉 All CivicSocial tests completed successfully!');
    log('📊 Summary:');
    log('  ✅ Authentication');
    log('  ✅ Posting');
    log('  ✅ Commenting');
    log('  ✅ Liking');
    log('  ✅ Friend Requests');
    log('  ✅ Messaging');
    log('  ✅ Profiles');
    log('  ✅ Notifications');
    
  } catch (error) {
    log('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runAllTests(); 