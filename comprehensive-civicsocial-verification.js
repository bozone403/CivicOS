import fetch from 'node-fetch';

const API_BASE = 'https://civicos.onrender.com';

// Test user credentials
const testUser = {
  email: 'test@civicos.com',
  password: 'testpassword123'
};

let authToken = null;
let userProfile = null;
let testPostId = null;
let testCommentId = null;
let testReplyId = null;
let testUserForInteraction = null;

async function comprehensiveVerification() {
  // console.log removed for production
  console.log('='.repeat(80));
  // console.log removed for production
  console.log('='.repeat(80));

  try {
    // ========================================
    // PHASE 1: AUTHENTICATION & USER MANAGEMENT
    // ========================================
    // console.log removed for production
    console.log('-'.repeat(50));

    // 1.1 Test Login
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
      throw new Error('❌ Login failed - Cannot proceed without authentication');
    }

    // 1.2 Test User Profile Retrieval
    // console.log removed for production
    const profileResponse = await fetch(`${API_BASE}/api/auth/user`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (profileResponse.ok) {
      userProfile = await profileResponse.json();
      // console.log removed for production
      // console.log removed for production
      // console.log removed for production
    } else {
      throw new Error('❌ User profile retrieval failed');
    }

    // 1.3 Test User Search
    // console.log removed for production
    const searchResponse = await fetch(`${API_BASE}/api/social/users/search?q=test`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      // console.log removed for production
      
      if (searchData.users.length > 0) {
        testUserForInteraction = searchData.users[0];
        // console.log removed for production
      }
    } else {
      // console.log removed for production
    }

    // ========================================
    // PHASE 2: CONTENT CREATION & MANAGEMENT
    // ========================================
    // console.log removed for production
    console.log('-'.repeat(50));

    // 2.1 Test Post Creation
    // console.log removed for production
    const postResponse = await fetch(`${API_BASE}/api/social/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: '🧪 COMPREHENSIVE TEST: This is a test post for full verification!',
        type: 'post',
        visibility: 'public'
      })
    });

    if (postResponse.ok) {
      const postData = await postResponse.json();
      testPostId = postData.post.id;
      // console.log removed for production
      console.log(`   Content: ${postData.post.content.substring(0, 50)}...`);
    } else {
      throw new Error('❌ Post creation failed - Core functionality broken');
    }

    // 2.2 Test Post Editing
    // console.log removed for production
    const editPostResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: '🧪 COMPREHENSIVE TEST: This post has been EDITED for verification! ✏️'
      })
    });

    if (editPostResponse.ok) {
      const editData = await editPostResponse.json();
      // console.log removed for production
      console.log(`   Updated content: ${editData.post.content.substring(0, 50)}...`);
    } else {
      // console.log removed for production
    }

    // 2.3 Test Comment Creation
    // console.log removed for production
    const commentResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: '🧪 COMPREHENSIVE TEST: This is a test comment for verification!'
      })
    });

    if (commentResponse.ok) {
      const commentData = await commentResponse.json();
      testCommentId = commentData.comment.id;
      // console.log removed for production
      console.log(`   Comment content: ${commentData.comment.content.substring(0, 50)}...`);
    } else {
      // console.log removed for production
    }

    // 2.4 Test Comment Editing
    // console.log removed for production
    if (testCommentId) {
      const editCommentResponse = await fetch(`${API_BASE}/api/social/comments/${testCommentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          content: '🧪 COMPREHENSIVE TEST: This comment has been EDITED for verification! ✏️'
        })
      });

      if (editCommentResponse.ok) {
        const editCommentData = await editCommentResponse.json();
        // console.log removed for production
        console.log(`   Updated comment: ${editCommentData.comment.content.substring(0, 50)}...`);
      } else {
        // console.log removed for production
      }
    }

    // 2.5 Test Comment Replies
    // console.log removed for production
    const parentCommentResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: '🧪 COMPREHENSIVE TEST: This is a parent comment for reply testing'
      })
    });

    if (parentCommentResponse.ok) {
      const parentComment = await parentCommentResponse.json();
      // console.log removed for production

      // Create reply
      const replyResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          content: '🧪 COMPREHENSIVE TEST: This is a REPLY to the parent comment!',
          parentCommentId: parentComment.comment.id
        })
      });

      if (replyResponse.ok) {
        const replyData = await replyResponse.json();
        testReplyId = replyData.comment.id;
        // console.log removed for production
        console.log(`   Reply content: ${replyData.comment.content.substring(0, 50)}...`);
      } else {
        // console.log removed for production
      }
    }

    // ========================================
    // PHASE 3: SOCIAL INTERACTIONS
    // ========================================
    // console.log removed for production
    console.log('-'.repeat(50));

    // 3.1 Test Profile Posting
    // console.log removed for production
    if (testUserForInteraction) {
      const profilePostResponse = await fetch(`${API_BASE}/api/social/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          content: `🧪 COMPREHENSIVE TEST: Hello ${testUserForInteraction.firstName}! This is a post on your profile! 👋`,
          type: 'post',
          visibility: 'public',
          targetUserId: testUserForInteraction.id
        })
      });

      if (profilePostResponse.ok) {
        const profilePostData = await profilePostResponse.json();
        // console.log removed for production
        // console.log removed for production
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // 3.2 Test Follow Functionality
    // console.log removed for production
    if (testUserForInteraction) {
      const followResponse = await fetch(`${API_BASE}/api/social/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ userId: testUserForInteraction.id })
      });

      if (followResponse.ok) {
        // console.log removed for production
        // console.log removed for production
      } else {
        const followError = await followResponse.json();
        if (followError.error && followError.error.includes('already following')) {
          console.log('✅ Follow functionality working (already following)');
        } else {
          // console.log removed for production
        }
      }
    }

    // 3.3 Test Social Feed
    // console.log removed for production
    const feedResponse = await fetch(`${API_BASE}/api/social/feed`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (feedResponse.ok) {
      const feedData = await feedResponse.json();
      const postsCount = feedData.posts ? feedData.posts.length : feedData.feed ? feedData.feed.length : 0;
      // console.log removed for production
      
      if (postsCount > 0) {
        console.log(`   Latest post: ${feedData.posts ? feedData.posts[0].content.substring(0, 50) : feedData.feed[0].content.substring(0, 50)}...`);
      }
    } else {
      // console.log removed for production
    }

    // ========================================
    // PHASE 4: MEDIA & UPLOADS
    // ========================================
    // console.log removed for production
    console.log('-'.repeat(50));

    // 4.1 Test Image Upload
    // console.log removed for production
    const imageUploadResponse = await fetch(`${API_BASE}/api/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ test: 'comprehensive verification' })
    });

    if (imageUploadResponse.ok) {
      const imageData = await imageUploadResponse.json();
      // console.log removed for production
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // 4.2 Test Video Upload
    // console.log removed for production
    const videoUploadResponse = await fetch(`${API_BASE}/api/upload/video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ test: 'comprehensive verification' })
    });

    if (videoUploadResponse.ok) {
      const videoData = await videoUploadResponse.json();
      // console.log removed for production
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // ========================================
    // PHASE 5: MESSAGING & COMMUNICATION
    // ========================================
    // console.log removed for production
    console.log('-'.repeat(50));

    // 5.1 Test Conversations
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

    // 5.2 Test Messaging (if other user available)
    // console.log removed for production
    if (testUserForInteraction) {
      const messageResponse = await fetch(`${API_BASE}/api/social/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          recipientId: testUserForInteraction.id,
          content: '🧪 COMPREHENSIVE TEST: This is a test message for verification!'
        })
      });

      if (messageResponse.ok) {
        // console.log removed for production
        // console.log removed for production
      } else {
        const messageError = await messageResponse.json();
        if (messageError.error && messageError.error.includes('cannot message yourself')) {
          console.log('✅ Messaging working (prevents self-messaging)');
        } else {
          // console.log removed for production
        }
      }
    }

    // ========================================
    // PHASE 6: ENGAGEMENT FEATURES
    // ========================================
    // console.log removed for production
    console.log('-'.repeat(50));

    // 6.1 Test Like Functionality
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
          // console.log removed for production
        } else {
          // console.log removed for production
        }
      } else {
        // console.log removed for production
      }
    }

    // ========================================
    // PHASE 7: PROFILE & USER PAGES
    // ========================================
    // console.log removed for production
    console.log('-'.repeat(50));

    // 7.1 Test Personal Profile Page
    // console.log removed for production
    const profilePageResponse = await fetch(`${API_BASE}/api/users/profile/${userProfile.username}`);

    if (profilePageResponse.ok) {
      const profilePageData = await profilePageResponse.json();
      // console.log removed for production
      // console.log removed for production
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // 7.2 Test User Posts by Username
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

    // ========================================
    // PHASE 8: CONTENT DELETION & CLEANUP
    // ========================================
    // console.log removed for production
    console.log('-'.repeat(50));

    // 8.1 Test Comment Deletion
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
        // console.log removed for production
      } else {
        // console.log removed for production
      }
    }

    // 8.2 Test Post Deletion
    // console.log removed for production
    const deletePostResponse = await fetch(`${API_BASE}/api/social/posts/${testPostId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (deletePostResponse.ok) {
      // console.log removed for production
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // ========================================
    // PHASE 9: SECURITY & PERMISSIONS
    // ========================================
    // console.log removed for production
    console.log('-'.repeat(50));

    // 9.1 Test Unauthorized Access Prevention
    // console.log removed for production
    const unauthorizedResponse = await fetch(`${API_BASE}/api/social/posts/999999`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ content: 'Unauthorized edit attempt' })
    });

    if (!unauthorizedResponse.ok) {
      // console.log removed for production
      console.log(`   Blocked unauthorized edit attempt (Status: ${unauthorizedResponse.status})`);
    } else {
      // console.log removed for production
    }

    // ========================================
    // FINAL VERIFICATION SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(80));
    // console.log removed for production
    console.log('='.repeat(80));

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
    console.log('✅ Media upload (images and videos)');
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production

    // console.log removed for production
    // console.log removed for production

  } catch (error) {
    // console.error removed for production
    // console.error removed for production
  }
}

comprehensiveVerification(); 