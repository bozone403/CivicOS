const API_BASE = 'https://civicos.onrender.com';

async function testAllCivicSocialEndpoints() {
  console.log('🔍 COMPREHENSIVE CIVICSOCIAL ENDPOINT TESTING\n');
  
  // Step 1: Setup authentication
  console.log('📋 Step 1: Setting up authentication...');
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
    console.log('✅ Authentication successful');
  } else {
    console.log('❌ Authentication failed');
    return;
  }
  
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Step 2: Test all endpoints systematically
  console.log('\n📋 Step 2: Testing all CivicSocial endpoints...\n');
  
  const testResults = {};
  
  // Test 1: Social Feed
  console.log('🔍 Testing Social Feed...');
  try {
    const response = await fetch(`${API_BASE}/api/social/feed`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Social Feed'] = { status: '✅ Working', data: data.feed?.length || 0 };
      console.log(`✅ Social Feed: ${data.feed?.length || 0} posts`);
    } else {
      testResults['Social Feed'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Social Feed: ${data.error}`);
    }
  } catch (error) {
    testResults['Social Feed'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Social Feed: ${error.message}`);
  }
  
  // Test 2: Create Post
  console.log('🔍 Testing Create Post...');
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
      console.log(`✅ Create Post: Post ID ${data.post?.id}`);
    } else {
      testResults['Create Post'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Create Post: ${data.error}`);
    }
  } catch (error) {
    testResults['Create Post'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Create Post: ${error.message}`);
  }
  
  // Test 3: Like Post (if post was created)
  if (testResults['Create Post']?.postId) {
    console.log('🔍 Testing Like Post...');
    try {
      const response = await fetch(`${API_BASE}/api/social/posts/${testResults['Create Post'].postId}/like`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reaction: '👍' })
      });
      const data = await response.json();
      if (response.ok) {
        testResults['Like Post'] = { status: '✅ Working', liked: data.liked };
        console.log(`✅ Like Post: ${data.liked ? 'Liked' : 'Unliked'}`);
      } else {
        testResults['Like Post'] = { status: '❌ Failed', error: data.error };
        console.log(`❌ Like Post: ${data.error}`);
      }
    } catch (error) {
      testResults['Like Post'] = { status: '❌ Error', error: error.message };
      console.log(`❌ Like Post: ${error.message}`);
    }
  }
  
  // Test 4: Comment on Post
  if (testResults['Create Post']?.postId) {
    console.log('🔍 Testing Comment on Post...');
    try {
      const response = await fetch(`${API_BASE}/api/social/posts/${testResults['Create Post'].postId}/comment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: 'Comprehensive test comment' })
      });
      const data = await response.json();
      if (response.ok) {
        testResults['Comment on Post'] = { status: '✅ Working', commentId: data.comment?.id };
        console.log(`✅ Comment on Post: Comment ID ${data.comment?.id}`);
      } else {
        testResults['Comment on Post'] = { status: '❌ Failed', error: data.error };
        console.log(`❌ Comment on Post: ${data.error}`);
      }
    } catch (error) {
      testResults['Comment on Post'] = { status: '❌ Error', error: error.message };
      console.log(`❌ Comment on Post: ${error.message}`);
    }
  }
  
  // Test 5: Conversations
  console.log('🔍 Testing Conversations...');
  try {
    const response = await fetch(`${API_BASE}/api/social/conversations`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Conversations'] = { status: '✅ Working', count: data.conversations?.length || 0 };
      console.log(`✅ Conversations: ${data.conversations?.length || 0} conversations`);
    } else {
      testResults['Conversations'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Conversations: ${data.error}`);
    }
  } catch (error) {
    testResults['Conversations'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Conversations: ${error.message}`);
  }
  
  // Test 6: Friends List
  console.log('🔍 Testing Friends List...');
  try {
    const response = await fetch(`${API_BASE}/api/social/friends`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Friends List'] = { status: '✅ Working', count: data.friends?.length || 0 };
      console.log(`✅ Friends List: ${data.friends?.length || 0} friends`);
    } else {
      testResults['Friends List'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Friends List: ${data.error}`);
    }
  } catch (error) {
    testResults['Friends List'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Friends List: ${error.message}`);
  }
  
  // Test 7: Add Friend (search a real user first)
  console.log('🔍 Searching for user to add as friend...');
  let friendIdToAdd = null;
  try {
    const searchRes = await fetch(`${API_BASE}/api/social/users/search?q=test`, { headers });
    const searchData = await searchRes.json();
    if (searchRes.ok && Array.isArray(searchData.users) && searchData.users.length > 0) {
      friendIdToAdd = searchData.users[0]?.id || null;
      console.log(`✅ Found candidate friend: ${friendIdToAdd}`);
    } else {
      console.log('⚠️ No users found to add as friend');
    }
  } catch (e) {
    console.log('❌ User search for friend failed:', e.message);
  }

  console.log('🔍 Testing Add Friend...');
  try {
    const response = await fetch(`${API_BASE}/api/social/friends`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ friendId: friendIdToAdd || 'invalid' })
    });
    const data = await response.json();
    if (response.ok) {
      testResults['Add Friend'] = { status: '✅ Working', friendshipId: data.friendship?.id };
      console.log(`✅ Add Friend: Friendship ID ${data.friendship?.id}`);
    } else {
      testResults['Add Friend'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Add Friend: ${data.error}`);
    }
  } catch (error) {
    testResults['Add Friend'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Add Friend: ${error.message}`);
  }
  
  // Test 8: User Search
  console.log('🔍 Testing User Search...');
  try {
    const response = await fetch(`${API_BASE}/api/social/users/search?q=test`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['User Search'] = { status: '✅ Working', count: data.users?.length || 0 };
      console.log(`✅ User Search: ${data.users?.length || 0} users found`);
    } else {
      testResults['User Search'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ User Search: ${data.error}`);
    }
  } catch (error) {
    testResults['User Search'] = { status: '❌ Error', error: error.message };
    console.log(`❌ User Search: ${error.message}`);
  }
  
  // Test 9: Notifications
  console.log('🔍 Testing Notifications...');
  try {
    const response = await fetch(`${API_BASE}/api/social/notifications`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Notifications'] = { status: '✅ Working', count: data.notifications?.length || 0 };
      console.log(`✅ Notifications: ${data.notifications?.length || 0} notifications`);
    } else {
      testResults['Notifications'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Notifications: ${data.error}`);
    }
  } catch (error) {
    testResults['Notifications'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Notifications: ${error.message}`);
  }
  
  // Test 10: User Activity
  console.log('🔍 Testing User Activity...');
  try {
    const response = await fetch(`${API_BASE}/api/social/activity`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['User Activity'] = { status: '✅ Working', count: data.activities?.length || 0 };
      console.log(`✅ User Activity: ${data.activities?.length || 0} activities`);
    } else {
      testResults['User Activity'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ User Activity: ${data.error}`);
    }
  } catch (error) {
    testResults['User Activity'] = { status: '❌ Error', error: error.message };
    console.log(`❌ User Activity: ${error.message}`);
  }
  
  // Test 11: Bookmarks
  console.log('🔍 Testing Bookmarks...');
  try {
    const response = await fetch(`${API_BASE}/api/social/bookmarks`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Bookmarks'] = { status: '✅ Working', count: data.bookmarks?.length || 0 };
      console.log(`✅ Bookmarks: ${data.bookmarks?.length || 0} bookmarks`);
    } else {
      testResults['Bookmarks'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Bookmarks: ${data.error}`);
    }
  } catch (error) {
    testResults['Bookmarks'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Bookmarks: ${error.message}`);
  }
  
  // Test 12: Add Bookmark (if post exists)
  if (testResults['Create Post']?.postId) {
    console.log('🔍 Testing Add Bookmark...');
    try {
      const response = await fetch(`${API_BASE}/api/social/bookmarks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ postId: testResults['Create Post'].postId })
      });
      const data = await response.json();
      if (response.ok) {
        testResults['Add Bookmark'] = { status: '✅ Working', bookmarked: data.bookmarked };
        console.log(`✅ Add Bookmark: ${data.bookmarked ? 'Bookmarked' : 'Unbookmarked'}`);
      } else {
        testResults['Add Bookmark'] = { status: '❌ Failed', error: data.error };
        console.log(`❌ Add Bookmark: ${data.error}`);
      }
    } catch (error) {
      testResults['Add Bookmark'] = { status: '❌ Error', error: error.message };
      console.log(`❌ Add Bookmark: ${error.message}`);
    }
  }
  
  // Test 13: Shares
  console.log('🔍 Testing Shares...');
  try {
    const response = await fetch(`${API_BASE}/api/social/shares`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Shares'] = { status: '✅ Working', count: data.shares?.length || 0 };
      console.log(`✅ Shares: ${data.shares?.length || 0} shares`);
    } else {
      testResults['Shares'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Shares: ${data.error}`);
    }
  } catch (error) {
    testResults['Shares'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Shares: ${error.message}`);
  }
  
  // Test 14: Share Post (if post exists)
  if (testResults['Create Post']?.postId) {
    console.log('🔍 Testing Share Post...');
    try {
      const response = await fetch(`${API_BASE}/api/social/posts/${testResults['Create Post'].postId}/share`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ platform: 'internal' })
      });
      const data = await response.json();
      if (response.ok) {
        testResults['Share Post'] = { status: '✅ Working', shareId: data.share?.id };
        console.log(`✅ Share Post: Share ID ${data.share?.id}`);
      } else {
        testResults['Share Post'] = { status: '❌ Failed', error: data.error };
        console.log(`❌ Share Post: ${data.error}`);
      }
    } catch (error) {
      testResults['Share Post'] = { status: '❌ Error', error: error.message };
      console.log(`❌ Share Post: ${error.message}`);
    }
  }
  
  // Test 15: User Stats
  console.log('🔍 Testing User Stats...');
  try {
    const response = await fetch(`${API_BASE}/api/social/stats`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['User Stats'] = { status: '✅ Working', stats: data.stats };
      console.log(`✅ User Stats: Posts ${data.stats?.postsCount}, Friends ${data.stats?.friendsCount}`);
    } else {
      testResults['User Stats'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ User Stats: ${data.error}`);
    }
  } catch (error) {
    testResults['User Stats'] = { status: '❌ Error', error: error.message };
    console.log(`❌ User Stats: ${error.message}`);
  }
  
  // Step 3: Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
  console.log('=====================================');
  
  const workingEndpoints = Object.keys(testResults).filter(key => testResults[key].status === '✅ Working');
  const brokenEndpoints = Object.keys(testResults).filter(key => testResults[key].status.startsWith('❌'));
  
  console.log(`✅ Working Endpoints: ${workingEndpoints.length}`);
  console.log(`❌ Broken Endpoints: ${brokenEndpoints.length}`);
  
  console.log('\n🎯 WORKING ENDPOINTS:');
  workingEndpoints.forEach(endpoint => {
    console.log(`✅ ${endpoint}`);
  });
  
  console.log('\n❌ BROKEN ENDPOINTS:');
  brokenEndpoints.forEach(endpoint => {
    console.log(`❌ ${endpoint}: ${testResults[endpoint].error}`);
  });
  
  console.log('\n📈 IMPROVEMENT SUMMARY:');
  console.log('=====================================');
  console.log(`Previous Status: 10/23 working (43%)`);
  console.log(`Current Status: ${workingEndpoints.length}/15 tested`);
  console.log(`Improvement: +${workingEndpoints.length - 10} endpoints`);
  
  console.log('\n🎉 FINAL STATUS:');
  if (workingEndpoints.length >= 12) {
    console.log('🟢 EXCELLENT - Most endpoints working correctly');
  } else if (workingEndpoints.length >= 8) {
    console.log('🟡 GOOD - Core functionality working');
  } else {
    console.log('🔴 NEEDS WORK - Multiple endpoints broken');
  }
  
  return testResults;
}

testAllCivicSocialEndpoints().catch(console.error); 