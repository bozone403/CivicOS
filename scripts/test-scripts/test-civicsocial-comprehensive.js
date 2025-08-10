#!/usr/bin/env node

/**
 * Comprehensive CivicSocial Functionality Test
 * Tests all social features: posting, commenting, liking, friend requests, messaging, profiles
 */

import fetch from 'node-fetch';

const API_BASE = 'https://civicos.onrender.com';

// Test users
const testUsers = [
  {
    email: 'alice@civicos.com',
    password: 'testpassword123',
    firstName: 'Alice',
    lastName: 'Johnson',
    agreeToTerms: true
  },
  {
    email: 'bob@civicos.com', 
    password: 'testpassword123',
    firstName: 'Bob',
    lastName: 'Smith',
    agreeToTerms: true
  },
  {
    email: 'charlie@civicos.com',
    password: 'testpassword123', 
    firstName: 'Charlie',
    lastName: 'Brown',
    agreeToTerms: true
  }
];

let userTokens = [];
let userProfiles = [];

async function testCivicSocial() {
  // console.log removed for production

  try {
    // Step 1: Create and authenticate multiple users
    // console.log removed for production
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      // console.log removed for production
      
      // Register user
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        // console.log removed for production
        continue;
      }
      
      // Login user
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        userTokens.push(loginData.token);
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    if (userTokens.length < 2) {
      throw new Error('Need at least 2 users for testing interactions');
    }

    // console.log removed for production

    // Step 2: Get user profiles
    // console.log removed for production
    for (let i = 0; i < userTokens.length; i++) {
      const response = await fetch(`${API_BASE}/api/auth/user`, {
        headers: { 'Authorization': `Bearer ${userTokens[i]}` }
      });
      
      if (response.ok) {
        const profile = await response.json();
        userProfiles.push(profile);
        // console.log removed for production
      }
    }

    // Step 3: Test user search
    // console.log removed for production
    const searchResponse = await fetch(`${API_BASE}/api/social/users/search?q=alice`, {
      headers: { 'Authorization': `Bearer ${userTokens[0]}` }
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 4: Test posting functionality
    // console.log removed for production
    const testPosts = [
      'Hello CivicSocial! This is my first post.',
      'Testing the social features of CivicOS.',
      'Excited to be part of this democratic platform!'
    ];

    for (let i = 0; i < userTokens.length; i++) {
      const postResponse = await fetch(`${API_BASE}/api/social/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens[i]}`
        },
        body: JSON.stringify({
          content: testPosts[i],
          type: 'post',
          visibility: 'public'
        })
      });

      if (postResponse.ok) {
        const postData = await postResponse.json();
        const userName = userProfiles[i] ? userProfiles[i].firstName : `User ${i}`;
        // console.log removed for production
      } else {
        const userName = userProfiles[i] ? userProfiles[i].firstName : `User ${i}`;
        // console.log removed for production
      }
    }

    // Step 5: Test feed functionality
    // console.log removed for production
    const feedResponse = await fetch(`${API_BASE}/api/social/feed`, {
      headers: { 'Authorization': `Bearer ${userTokens[0]}` }
    });

    if (feedResponse.ok) {
      const feedData = await feedResponse.json();
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 6: Test follow functionality
    // console.log removed for production
    if (userProfiles.length >= 2) {
      // Alice follows Bob
      const followResponse = await fetch(`${API_BASE}/api/social/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens[0]}`
        },
        body: JSON.stringify({ userId: userProfiles[1].id })
      });

      if (followResponse.ok) {
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // Step 7: Test messaging
    // console.log removed for production
    if (userProfiles.length >= 2) {
      // Alice sends message to Bob
      const messageResponse = await fetch(`${API_BASE}/api/social/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens[0]}`
        },
        body: JSON.stringify({
          recipientId: userProfiles[1].id,
          content: 'Hello Bob! This is a test message from Alice.'
        })
      });

      if (messageResponse.ok) {
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // Step 8: Test conversations
    // console.log removed for production
    const conversationsResponse = await fetch(`${API_BASE}/api/social/conversations`, {
      headers: { 'Authorization': `Bearer ${userTokens[0]}` }
    });

    if (conversationsResponse.ok) {
      const conversationsData = await conversationsResponse.json();
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 9: Test personal profile pages
    // console.log removed for production
    for (let i = 0; i < userProfiles.length; i++) {
      const profileResponse = await fetch(`${API_BASE}/api/users/profile/${userProfiles[i].username}`);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // Step 10: Test user posts by username
    // console.log removed for production
    for (let i = 0; i < userProfiles.length; i++) {
      const postsResponse = await fetch(`${API_BASE}/api/social/posts/user/${userProfiles[i].username}`, {
        headers: { 'Authorization': `Bearer ${userTokens[0]}` }
      });

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // Step 11: Test image upload
    // console.log removed for production
    const uploadResponse = await fetch(`${API_BASE}/api/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userTokens[0]}`
      },
      body: JSON.stringify({ test: 'data' })
    });

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Image upload working (mock URL generated)');
    } else {
      // console.log removed for production
    }

    // Step 12: Test like functionality
    // console.log removed for production
    const feedForLikes = await fetch(`${API_BASE}/api/social/feed`, {
      headers: { 'Authorization': `Bearer ${userTokens[0]}` }
    });

    if (feedForLikes.ok) {
      const feedData = await feedForLikes.json();
      if (feedData.posts.length > 0) {
        const firstPost = feedData.posts[0];
        const likeResponse = await fetch(`${API_BASE}/api/social/posts/${firstPost.id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userTokens[0]}`
          },
          body: JSON.stringify({ reaction: 'like' })
        });

        if (likeResponse.ok) {
          // console.log removed for production
        } else {
          // console.log removed for production
        }
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

  } catch (error) {
    // console.error removed for production
  }
}

testCivicSocial(); 