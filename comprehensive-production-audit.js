const API_BASE = 'https://civicos.onrender.com';

async function comprehensiveProductionAudit() {
  console.log('🔍 COMPREHENSIVE PRODUCTION AUDIT - TESTING EVERY ENDPOINT\n');
  
  // Step 1: Setup authentication
  console.log('📋 Step 1: Setting up authentication...');
  const registerResult = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `audit${Date.now()}@civicos.com`,
      password: 'auditpass123',
      firstName: 'Audit',
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
  
  // Step 2: Test ALL endpoints systematically
  console.log('\n📋 Step 2: Testing ALL endpoints across the platform...\n');
  
  const testResults = {};
  
  // ===== AUTHENTICATION ENDPOINTS =====
  console.log('🔐 AUTHENTICATION ENDPOINTS:');
  
  // Test login
  console.log('🔍 Testing Login...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `audit${Date.now()}@civicos.com`,
        password: 'auditpass123'
      })
    });
    const data = await response.json();
    if (response.ok) {
      testResults['Login'] = { status: '✅ Working', token: !!data.token };
      console.log(`✅ Login: ${data.token ? 'Token received' : 'No token'}`);
    } else {
      testResults['Login'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Login: ${data.error}`);
    }
  } catch (error) {
    testResults['Login'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Login: ${error.message}`);
  }
  
  // Test user profile
  console.log('🔍 Testing User Profile...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/user`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['User Profile'] = { status: '✅ Working', user: data.user?.id };
      console.log(`✅ User Profile: User ID ${data.user?.id}`);
    } else {
      testResults['User Profile'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ User Profile: ${data.error}`);
    }
  } catch (error) {
    testResults['User Profile'] = { status: '❌ Error', error: error.message };
    console.log(`❌ User Profile: ${error.message}`);
  }
  
  // ===== SOCIAL ENDPOINTS =====
  console.log('\n📱 SOCIAL ENDPOINTS:');
  
  // Test social feed
  console.log('🔍 Testing Social Feed...');
  try {
    const response = await fetch(`${API_BASE}/api/social/feed`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Social Feed'] = { status: '✅ Working', posts: data.feed?.length || 0 };
      console.log(`✅ Social Feed: ${data.feed?.length || 0} posts`);
    } else {
      testResults['Social Feed'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Social Feed: ${data.error}`);
    }
  } catch (error) {
    testResults['Social Feed'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Social Feed: ${error.message}`);
  }
  
  // Test create post
  console.log('🔍 Testing Create Post...');
  try {
    const response = await fetch(`${API_BASE}/api/social/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: 'Production audit test post',
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
  
  // Test like post
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
  
  // Test comment on post
  if (testResults['Create Post']?.postId) {
    console.log('🔍 Testing Comment on Post...');
    try {
      const response = await fetch(`${API_BASE}/api/social/posts/${testResults['Create Post'].postId}/comment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: 'Production audit comment' })
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
  
  // Test friends list
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
  
  // Test user search
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
  
  // Test user stats
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
  
  // ===== POLITICAL ENDPOINTS =====
  console.log('\n🏛️ POLITICAL ENDPOINTS:');
  
  // Test politicians
  console.log('🔍 Testing Politicians...');
  try {
    const response = await fetch(`${API_BASE}/api/politicians`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Politicians'] = { status: '✅ Working', count: data.politicians?.length || 0 };
      console.log(`✅ Politicians: ${data.politicians?.length || 0} politicians`);
    } else {
      testResults['Politicians'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Politicians: ${data.error}`);
    }
  } catch (error) {
    testResults['Politicians'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Politicians: ${error.message}`);
  }
  
  // Test bills
  console.log('🔍 Testing Bills...');
  try {
    const response = await fetch(`${API_BASE}/api/bills`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Bills'] = { status: '✅ Working', count: data.bills?.length || 0 };
      console.log(`✅ Bills: ${data.bills?.length || 0} bills`);
    } else {
      testResults['Bills'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Bills: ${data.error}`);
    }
  } catch (error) {
    testResults['Bills'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Bills: ${error.message}`);
  }
  
  // Test voting
  console.log('🔍 Testing Voting...');
  try {
    const response = await fetch(`${API_BASE}/api/voting`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Voting'] = { status: '✅ Working', data: data };
      console.log(`✅ Voting: System accessible`);
    } else {
      testResults['Voting'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Voting: ${data.error}`);
    }
  } catch (error) {
    testResults['Voting'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Voting: ${error.message}`);
  }
  
  // ===== NEWS ENDPOINTS =====
  console.log('\n📰 NEWS ENDPOINTS:');
  
  // Test news
  console.log('🔍 Testing News...');
  try {
    const response = await fetch(`${API_BASE}/api/news`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['News'] = { status: '✅ Working', count: data.news?.length || 0 };
      console.log(`✅ News: ${data.news?.length || 0} articles`);
    } else {
      testResults['News'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ News: ${data.error}`);
    }
  } catch (error) {
    testResults['News'] = { status: '❌ Error', error: error.message };
    console.log(`❌ News: ${error.message}`);
  }
  
  // ===== ANNOUNCEMENTS ENDPOINTS =====
  console.log('\n📢 ANNOUNCEMENTS ENDPOINTS:');
  
  // Test announcements
  console.log('🔍 Testing Announcements...');
  try {
    const response = await fetch(`${API_BASE}/api/announcements`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Announcements'] = { status: '✅ Working', count: data.announcements?.length || 0 };
      console.log(`✅ Announcements: ${data.announcements?.length || 0} announcements`);
    } else {
      testResults['Announcements'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Announcements: ${data.error}`);
    }
  } catch (error) {
    testResults['Announcements'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Announcements: ${error.message}`);
  }
  
  // ===== LEGAL ENDPOINTS =====
  console.log('\n⚖️ LEGAL ENDPOINTS:');
  
  // Test legal documents
  console.log('🔍 Testing Legal Documents...');
  try {
    const response = await fetch(`${API_BASE}/api/legal/documents`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Legal Documents'] = { status: '✅ Working', count: data.documents?.length || 0 };
      console.log(`✅ Legal Documents: ${data.documents?.length || 0} documents`);
    } else {
      testResults['Legal Documents'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Legal Documents: ${data.error}`);
    }
  } catch (error) {
    testResults['Legal Documents'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Legal Documents: ${error.message}`);
  }
  
  // ===== GOVERNMENT INTEGRITY ENDPOINTS =====
  console.log('\n🛡️ GOVERNMENT INTEGRITY ENDPOINTS:');
  
  // Test government integrity
  console.log('🔍 Testing Government Integrity...');
  try {
    const response = await fetch(`${API_BASE}/api/government/integrity`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Government Integrity'] = { status: '✅ Working', data: data };
      console.log(`✅ Government Integrity: System accessible`);
    } else {
      testResults['Government Integrity'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Government Integrity: ${data.error}`);
    }
  } catch (error) {
    testResults['Government Integrity'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Government Integrity: ${error.message}`);
  }
  
  // ===== ENGAGEMENT ENDPOINTS =====
  console.log('\n🤝 ENGAGEMENT ENDPOINTS:');
  
  // Test petitions
  console.log('🔍 Testing Petitions...');
  try {
    const response = await fetch(`${API_BASE}/api/petitions`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Petitions'] = { status: '✅ Working', count: data.petitions?.length || 0 };
      console.log(`✅ Petitions: ${data.petitions?.length || 0} petitions`);
    } else {
      testResults['Petitions'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Petitions: ${data.error}`);
    }
  } catch (error) {
    testResults['Petitions'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Petitions: ${error.message}`);
  }
  
  // Test events
  console.log('🔍 Testing Events...');
  try {
    const response = await fetch(`${API_BASE}/api/events`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Events'] = { status: '✅ Working', count: data.events?.length || 0 };
      console.log(`✅ Events: ${data.events?.length || 0} events`);
    } else {
      testResults['Events'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Events: ${data.error}`);
    }
  } catch (error) {
    testResults['Events'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Events: ${error.message}`);
  }
  
  // ===== SYSTEM ENDPOINTS =====
  console.log('\n⚙️ SYSTEM ENDPOINTS:');
  
  // Test system health
  console.log('🔍 Testing System Health...');
  try {
    const response = await fetch(`${API_BASE}/api/system/health`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['System Health'] = { status: '✅ Working', data: data };
      console.log(`✅ System Health: System accessible`);
    } else {
      testResults['System Health'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ System Health: ${data.error}`);
    }
  } catch (error) {
    testResults['System Health'] = { status: '❌ Error', error: error.message };
    console.log(`❌ System Health: ${error.message}`);
  }
  
  // Test analytics
  console.log('🔍 Testing Analytics...');
  try {
    const response = await fetch(`${API_BASE}/api/analytics`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Analytics'] = { status: '✅ Working', data: data };
      console.log(`✅ Analytics: System accessible`);
    } else {
      testResults['Analytics'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Analytics: ${data.error}`);
    }
  } catch (error) {
    testResults['Analytics'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Analytics: ${error.message}`);
  }
  
  // ===== IDENTITY ENDPOINTS =====
  console.log('\n🆔 IDENTITY ENDPOINTS:');
  
  // Test identity verification
  console.log('🔍 Testing Identity Verification...');
  try {
    const response = await fetch(`${API_BASE}/api/identity/verify`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Identity Verification'] = { status: '✅ Working', data: data };
      console.log(`✅ Identity Verification: System accessible`);
    } else {
      testResults['Identity Verification'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Identity Verification: ${data.error}`);
    }
  } catch (error) {
    testResults['Identity Verification'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Identity Verification: ${error.message}`);
  }
  
  // ===== PERMISSIONS ENDPOINTS =====
  console.log('\n🔐 PERMISSIONS ENDPOINTS:');
  
  // Test permissions
  console.log('🔍 Testing Permissions...');
  try {
    const response = await fetch(`${API_BASE}/api/permissions`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Permissions'] = { status: '✅ Working', data: data };
      console.log(`✅ Permissions: System accessible`);
    } else {
      testResults['Permissions'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Permissions: ${data.error}`);
    }
  } catch (error) {
    testResults['Permissions'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Permissions: ${error.message}`);
  }
  
  // ===== MEMBERSHIP ENDPOINTS =====
  console.log('\n👥 MEMBERSHIP ENDPOINTS:');
  
  // Test membership
  console.log('🔍 Testing Membership...');
  try {
    const response = await fetch(`${API_BASE}/api/membership`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Membership'] = { status: '✅ Working', data: data };
      console.log(`✅ Membership: System accessible`);
    } else {
      testResults['Membership'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Membership: ${data.error}`);
    }
  } catch (error) {
    testResults['Membership'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Membership: ${error.message}`);
  }
  
  // ===== PAYMENTS ENDPOINTS =====
  console.log('\n💳 PAYMENTS ENDPOINTS:');
  
  // Test payments
  console.log('🔍 Testing Payments...');
  try {
    const response = await fetch(`${API_BASE}/api/payments`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Payments'] = { status: '✅ Working', data: data };
      console.log(`✅ Payments: System accessible`);
    } else {
      testResults['Payments'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Payments: ${data.error}`);
    }
  } catch (error) {
    testResults['Payments'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Payments: ${error.message}`);
  }
  
  // ===== FILE UPLOAD ENDPOINTS =====
  console.log('\n📁 FILE UPLOAD ENDPOINTS:');
  
  // Test file upload
  console.log('🔍 Testing File Upload...');
  try {
    const response = await fetch(`${API_BASE}/api/upload`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['File Upload'] = { status: '✅ Working', data: data };
      console.log(`✅ File Upload: System accessible`);
    } else {
      testResults['File Upload'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ File Upload: ${data.error}`);
    }
  } catch (error) {
    testResults['File Upload'] = { status: '❌ Error', error: error.message };
    console.log(`❌ File Upload: ${error.message}`);
  }
  
  // ===== WEBHOOKS ENDPOINTS =====
  console.log('\n🔗 WEBHOOKS ENDPOINTS:');
  
  // Test webhooks
  console.log('🔍 Testing Webhooks...');
  try {
    const response = await fetch(`${API_BASE}/api/webhooks`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Webhooks'] = { status: '✅ Working', data: data };
      console.log(`✅ Webhooks: System accessible`);
    } else {
      testResults['Webhooks'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Webhooks: ${data.error}`);
    }
  } catch (error) {
    testResults['Webhooks'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Webhooks: ${error.message}`);
  }
  
  // ===== DEVELOPMENT ENDPOINTS =====
  console.log('\n🛠️ DEVELOPMENT ENDPOINTS:');
  
  // Test development tools
  console.log('🔍 Testing Development Tools...');
  try {
    const response = await fetch(`${API_BASE}/api/dev/tools`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Development Tools'] = { status: '✅ Working', data: data };
      console.log(`✅ Development Tools: System accessible`);
    } else {
      testResults['Development Tools'] = { status: '❌ Failed', error: data.error };
      console.log(`❌ Development Tools: ${data.error}`);
    }
  } catch (error) {
    testResults['Development Tools'] = { status: '❌ Error', error: error.message };
    console.log(`❌ Development Tools: ${error.message}`);
  }
  
  // Step 3: Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE PRODUCTION AUDIT RESULTS:');
  console.log('==============================================');
  
  const workingEndpoints = Object.keys(testResults).filter(key => testResults[key].status === '✅ Working');
  const brokenEndpoints = Object.keys(testResults).filter(key => testResults[key].status.startsWith('❌'));
  
  console.log(`✅ Working Endpoints: ${workingEndpoints.length}`);
  console.log(`❌ Broken Endpoints: ${brokenEndpoints.length}`);
  console.log(`📊 Total Endpoints Tested: ${Object.keys(testResults).length}`);
  
  console.log('\n🎯 WORKING ENDPOINTS:');
  workingEndpoints.forEach(endpoint => {
    console.log(`✅ ${endpoint}`);
  });
  
  console.log('\n❌ BROKEN ENDPOINTS:');
  brokenEndpoints.forEach(endpoint => {
    console.log(`❌ ${endpoint}: ${testResults[endpoint].error}`);
  });
  
  console.log('\n📈 PRODUCTION READINESS ASSESSMENT:');
  console.log('=====================================');
  
  const readinessScore = Math.round((workingEndpoints.length / Object.keys(testResults).length) * 100);
  
  console.log(`Overall Readiness Score: ${readinessScore}%`);
  
  if (readinessScore >= 90) {
    console.log('🟢 EXCELLENT - Platform is production ready');
  } else if (readinessScore >= 70) {
    console.log('🟡 GOOD - Platform needs minor fixes');
  } else if (readinessScore >= 50) {
    console.log('🟠 FAIR - Platform needs significant work');
  } else {
    console.log('🔴 POOR - Platform needs major fixes');
  }
  
  console.log('\n🎯 CRITICAL AREAS TO FIX:');
  console.log('==========================');
  
  // Identify critical broken endpoints
  const criticalEndpoints = [
    'Login', 'User Profile', 'Social Feed', 'Create Post', 
    'Politicians', 'News', 'Announcements'
  ];
  
  const criticalBroken = criticalEndpoints.filter(endpoint => 
    testResults[endpoint] && testResults[endpoint].status.startsWith('❌')
  );
  
  if (criticalBroken.length > 0) {
    console.log('🔴 CRITICAL ENDPOINTS BROKEN:');
    criticalBroken.forEach(endpoint => {
      console.log(`❌ ${endpoint}: ${testResults[endpoint].error}`);
    });
  } else {
    console.log('✅ All critical endpoints are working');
  }
  
  return testResults;
}

comprehensiveProductionAudit().catch(console.error); 