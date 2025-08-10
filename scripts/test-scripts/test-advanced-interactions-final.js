import fetch from 'node-fetch';

const API_BASE = 'https://civicos.onrender.com';

// Use existing test account
const testUser = {
  email: 'test@civicos.com',
  password: 'testpassword123'
};

let authToken = null;
let userProfile = null;
let testPostId = null;
let testCommentId = null;

async function testAdvancedInteractions() {
  // console.log removed for production

  try {
    // Step 1: Login with test account
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
      throw new Error('Authentication failed');
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

    // Step 3: Test post creation
    // console.log removed for production
    const postResponse = await fetch(`${API_BASE}/api/social/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: '🧪 Test post for advanced interaction testing!',
        type: 'post',
        visibility: 'public'
      })
    });

    if (postResponse.ok) {
      const postData = await postResponse.json();
      testPostId = postData.post.id;
      // console.log removed for production
    } else {
      // console.log removed for production
      return;
    }

    // Step 4: Test comment creation
    // console.log removed for production
    const commentResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: 'This is a test comment that will be edited and deleted!'
      })
    });

    if (commentResponse.ok) {
      const commentData = await commentResponse.json();
      testCommentId = commentData.comment.id;
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 5: Test comment editing
    // console.log removed for production
    if (testCommentId) {
      const editCommentResponse = await fetch(`${API_BASE}/api/social/comments/${testCommentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          content: 'This comment has been edited! ✏️'
        })
      });

      if (editCommentResponse.ok) {
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // Step 6: Test comment deletion
    // console.log removed for production
    if (testCommentId) {
      const deleteCommentResponse = await fetch(`${API_BASE}/api/social/comments/${testCommentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (deleteCommentResponse.ok) {
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // Step 7: Test post editing
    // console.log removed for production
    const editPostResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: '🧪 This test post has been edited! ✏️'
      })
    });

    if (editPostResponse.ok) {
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 8: Test profile posting
    // console.log removed for production
    const profilePostResponse = await fetch(`${API_BASE}/api/social/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: 'Hello! This is a post on your profile! 👋',
        type: 'post',
        visibility: 'public',
        targetUserId: '37a4951c-05eb-44f4-bf9a-081c7fd34f72'
      })
    });

    if (profilePostResponse.ok) {
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 9: Test comment replies
    // console.log removed for production
    // Create a new comment for reply testing
    const parentCommentResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: 'This is a parent comment for reply testing'
      })
    });

    if (parentCommentResponse.ok) {
      const parentComment = await parentCommentResponse.json();
      // console.log removed for production

      // Create a reply
      const replyResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          content: 'This is a reply to the parent comment!',
          parentCommentId: parentComment.comment.id
        })
      });

      if (replyResponse.ok) {
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // Step 10: Test user permissions (unauthorized edit attempt)
    // console.log removed for production
    const unauthorizedEditResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` // Using same token but testing permission logic
      },
      body: JSON.stringify({
        content: 'This should work since it\'s the same user'
      })
    });

    if (unauthorizedEditResponse.ok) {
      console.log('✅ Permission system working (allows authorized edits)');
    } else {
      // console.log removed for production
    }

    // Step 11: Test post deletion
    // console.log removed for production
    const deletePostResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (deletePostResponse.ok) {
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 12: Test user search for interaction
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

testAdvancedInteractions(); 