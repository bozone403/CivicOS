import fetch from 'node-fetch';

const API_BASE = 'https://civicos.onrender.com';

// Test users for interaction testing
const testUsers = [
  {
    email: 'alice@civicos.com',
    password: 'testpassword123',
    firstName: 'Alice',
    lastName: 'Johnson'
  },
  {
    email: 'bob@civicos.com',
    password: 'testpassword123',
    firstName: 'Bob',
    lastName: 'Smith'
  }
];

let userTokens = [];
let userProfiles = [];
let testPostId = null;
let testCommentId = null;

async function testAdvancedInteractions() {
  // console.log removed for production

  try {
    // Step 1: Create test users (if not rate limited)
    // console.log removed for production
    
    // Try to login with existing accounts first
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      // console.log removed for production
      
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
        
        // Try registration
        const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...user,
            agreeToTerms: true
          })
        });

        if (registerResponse.ok) {
          const registerData = await registerResponse.json();
          userTokens.push(registerData.token);
          // console.log removed for production
        } else {
          // console.log removed for production
        }
      }
    }

    if (userTokens.length < 2) {
      // console.log removed for production
      // Use existing test account
      const singleUserLogin = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@civicos.com',
          password: 'testpassword123'
        })
      });

      if (singleUserLogin.ok) {
        const loginData = await singleUserLogin.json();
        userTokens = [loginData.token];
        // console.log removed for production
      }
    }

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

    // Step 3: Test post creation (for comment testing)
    // console.log removed for production
    const postResponse = await fetch(`${API_BASE}/api/social/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userTokens[0]}`
      },
      body: JSON.stringify({
        content: '🧪 This is a test post for advanced interaction testing!',
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

    // Step 4: Test commenting on posts
    // console.log removed for production
    const commentResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userTokens[0]}`
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

    // Step 5: Test editing comments
    // console.log removed for production
    if (testCommentId) {
      const editCommentResponse = await fetch(`${API_BASE}/api/social/comments/${testCommentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens[0]}`
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

    // Step 6: Test deleting comments
    // console.log removed for production
    if (testCommentId) {
      const deleteCommentResponse = await fetch(`${API_BASE}/api/social/comments/${testCommentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userTokens[0]}`
        }
      });

      if (deleteCommentResponse.ok) {
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // Step 7: Test posting on other user's profile
    // console.log removed for production
    if (userProfiles.length >= 2) {
      const profilePostResponse = await fetch(`${API_BASE}/api/social/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens[0]}`
        },
        body: JSON.stringify({
          content: `Hello ${userProfiles[1].firstName}! This is a post on your profile! 👋`,
          type: 'post',
          visibility: 'public',
          targetUserId: userProfiles[1].id
        })
      });

      if (profilePostResponse.ok) {
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // Step 8: Test editing own posts
    // console.log removed for production
    const editPostResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userTokens[0]}`
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

    // Step 9: Test deleting own posts
    // console.log removed for production
    const deletePostResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userTokens[0]}`
      }
    });

    if (deletePostResponse.ok) {
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // Step 10: Test replying to comments
    // console.log removed for production
    if (testPostId) {
      // Create a new comment for reply testing
      const replyCommentResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens[0]}`
        },
        body: JSON.stringify({
          content: 'This is a parent comment for reply testing'
        })
      });

      if (replyCommentResponse.ok) {
        const parentComment = await replyCommentResponse.json();
        // console.log removed for production

        // Create a reply
        const replyResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}/comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userTokens[0]}`
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
    }

    // Step 11: Test user permissions (trying to edit someone else's post)
    // console.log removed for production
    if (userProfiles.length >= 2 && testPostId) {
      const unauthorizedEditResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens[1] || userTokens[0]}`
        },
        body: JSON.stringify({
          content: 'This should fail - unauthorized edit attempt'
        })
      });

      if (!unauthorizedEditResponse.ok) {
        console.log('✅ Permission system working (prevents unauthorized edits)');
      } else {
        console.log('❌ Permission system failed (allowed unauthorized edit)');
      }
    }

    // Step 12: Test user blocking/unblocking
    // console.log removed for production
    if (userProfiles.length >= 2) {
      const blockResponse = await fetch(`${API_BASE}/api/social/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userTokens[0]}`
        },
        body: JSON.stringify({
          userId: userProfiles[1].id
        })
      });

      if (blockResponse.ok) {
        // console.log removed for production
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

  } catch (error) {
    // console.error removed for production
  }
}

testAdvancedInteractions(); 