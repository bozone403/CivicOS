const API_BASE = 'https://civicos.onrender.com';

async function testAllCivicSocialEndpoints() {
  // console.log removed for production
  
  // Step 1: Setup authentication
  // console.log removed for production
  const registerResult = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `comprehensive${Date.now()}@civicos.com`,
      password: 'comprehensivepass123',
      firstName: 'Comprehensive',
      lastName: 'Test',
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
  
  // Step 2: Test all endpoints systematically
  // console.log removed for production
  
  const testResults = {};
  
  // Test 1: Social Feed
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/feed`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Social Feed'] = { status: '✅ Working', data: data.feed?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Social Feed'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Social Feed'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test 2: Create Post
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: 'Comprehensive test post for endpoint verification',
        type: 'text',
        visibility: 'public'
      })
    });
    const data = await response.json();
    if (response.ok) {
      testResults['Create Post'] = { status: '✅ Working', postId: data.post?.id };
      // console.log removed for production
    } else {
      testResults['Create Post'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Create Post'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test 3: Like Post (if post was created)
  if (testResults['Create Post']?.postId) {
    // console.log removed for production
    try {
      const response = await fetch(`${API_BASE}/api/social/posts/${testResults['Create Post'].postId}/like`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reaction: '👍' })
      });
      const data = await response.json();
      if (response.ok) {
        testResults['Like Post'] = { status: '✅ Working', liked: data.liked };
        // console.log removed for production
      } else {
        testResults['Like Post'] = { status: '❌ Failed', error: data.error };
        // console.log removed for production
      }
    } catch (error) {
      testResults['Like Post'] = { status: '❌ Error', error: error.message };
      // console.log removed for production
    }
  }
  
  // Test 4: Comment on Post
  if (testResults['Create Post']?.postId) {
    // console.log removed for production
    try {
      const response = await fetch(`${API_BASE}/api/social/posts/${testResults['Create Post'].postId}/comment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: 'Comprehensive test comment' })
      });
      const data = await response.json();
      if (response.ok) {
        testResults['Comment on Post'] = { status: '✅ Working', commentId: data.comment?.id };
        // console.log removed for production
      } else {
        testResults['Comment on Post'] = { status: '❌ Failed', error: data.error };
        // console.log removed for production
      }
    } catch (error) {
      testResults['Comment on Post'] = { status: '❌ Error', error: error.message };
      // console.log removed for production
    }
  }
  
  // Test 5: Conversations
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/conversations`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Conversations'] = { status: '✅ Working', count: data.conversations?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Conversations'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Conversations'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test 6: Friends List
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/friends`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Friends List'] = { status: '✅ Working', count: data.friends?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Friends List'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Friends List'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test 7: Add Friend (search a real user first)
  // console.log removed for production
  let friendIdToAdd = null;
  try {
    const searchRes = await fetch(`${API_BASE}/api/social/users/search?q=test`, { headers });
    const searchData = await searchRes.json();
    if (searchRes.ok && Array.isArray(searchData.users) && searchData.users.length > 0) {
      friendIdToAdd = searchData.users[0]?.id || null;
      // console.log removed for production
    } else {
      // console.log removed for production
    }
  } catch (e) {
    // console.log removed for production
  }

  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/friends`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ friendId: friendIdToAdd || 'invalid' })
    });
    const data = await response.json();
    if (response.ok) {
      testResults['Add Friend'] = { status: '✅ Working', friendshipId: data.friendship?.id };
      // console.log removed for production
    } else {
      testResults['Add Friend'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Add Friend'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test 8: User Search
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/users/search?q=test`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['User Search'] = { status: '✅ Working', count: data.users?.length || 0 };
      // console.log removed for production
    } else {
      testResults['User Search'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['User Search'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test 9: Notifications
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/notifications`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Notifications'] = { status: '✅ Working', count: data.notifications?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Notifications'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Notifications'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test 10: User Activity
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/activity`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['User Activity'] = { status: '✅ Working', count: data.activities?.length || 0 };
      // console.log removed for production
    } else {
      testResults['User Activity'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['User Activity'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test 11: Bookmarks
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/bookmarks`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Bookmarks'] = { status: '✅ Working', count: data.bookmarks?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Bookmarks'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Bookmarks'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test 12: Add Bookmark (if post exists)
  if (testResults['Create Post']?.postId) {
    // console.log removed for production
    try {
      const response = await fetch(`${API_BASE}/api/social/bookmarks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ postId: testResults['Create Post'].postId })
      });
      const data = await response.json();
      if (response.ok) {
        testResults['Add Bookmark'] = { status: '✅ Working', bookmarked: data.bookmarked };
        // console.log removed for production
      } else {
        testResults['Add Bookmark'] = { status: '❌ Failed', error: data.error };
        // console.log removed for production
      }
    } catch (error) {
      testResults['Add Bookmark'] = { status: '❌ Error', error: error.message };
      // console.log removed for production
    }
  }
  
  // Test 13: Shares
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/shares`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Shares'] = { status: '✅ Working', count: data.shares?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Shares'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Shares'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test 14: Share Post (if post exists)
  if (testResults['Create Post']?.postId) {
    // console.log removed for production
    try {
      const response = await fetch(`${API_BASE}/api/social/posts/${testResults['Create Post'].postId}/share`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ platform: 'internal' })
      });
      const data = await response.json();
      if (response.ok) {
        testResults['Share Post'] = { status: '✅ Working', shareId: data.share?.id };
        // console.log removed for production
      } else {
        testResults['Share Post'] = { status: '❌ Failed', error: data.error };
        // console.log removed for production
      }
    } catch (error) {
      testResults['Share Post'] = { status: '❌ Error', error: error.message };
      // console.log removed for production
    }
  }
  
  // Test 15: User Stats
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/stats`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['User Stats'] = { status: '✅ Working', stats: data.stats };
      // console.log removed for production
    } else {
      testResults['User Stats'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['User Stats'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Step 3: Generate comprehensive report
  // console.log removed for production
  // console.log removed for production
  
  const workingEndpoints = Object.keys(testResults).filter(key => testResults[key].status === '✅ Working');
  const brokenEndpoints = Object.keys(testResults).filter(key => testResults[key].status.startsWith('❌'));
  
  // console.log removed for production
  // console.log removed for production
  
  // console.log removed for production
  workingEndpoints.forEach(endpoint => {
    // console.log removed for production
  });
  
  // console.log removed for production
  brokenEndpoints.forEach(endpoint => {
    // console.log removed for production
  });
  
  // console.log removed for production
  // console.log removed for production
  console.log(`Previous Status: 10/23 working (43%)`);
  // console.log removed for production
  // console.log removed for production
  
  // console.log removed for production
  if (workingEndpoints.length >= 12) {
    // console.log removed for production
  } else if (workingEndpoints.length >= 8) {
    // console.log removed for production
  } else {
    // console.log removed for production
  }
  
  return testResults;
}

testAllCivicSocialEndpoints().catch(console.error); 