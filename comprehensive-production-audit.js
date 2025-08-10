const API_BASE = 'https://civicos.onrender.com';

async function comprehensiveProductionAudit() {
  // console.log removed for production
  
  // Step 1: Setup authentication
  // console.log removed for production
  
  // Try to register a new user
  const timestamp = Date.now();
  const testEmail = `audit${timestamp}@civicos.com`;
  
  const registerResult = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
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
    // console.log removed for production
  } else {
    // Try to login with existing user
    // console.log removed for production
    const loginResult = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser2@example.com',
        password: 'password123'
      })
    });
    
    if (loginResult.ok) {
      const loginData = await loginResult.json();
      token = loginData.token;
      // console.log removed for production
    } else {
      // console.log removed for production
      return;
    }
  }
  
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Step 2: Test ALL endpoints systematically
  // console.log removed for production
  
  const testResults = {};
  
  // ===== AUTHENTICATION ENDPOINTS =====
  // console.log removed for production
  
  // Test login
  // console.log removed for production
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
      // console.log removed for production
    } else {
      testResults['Login'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Login'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test user profile
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/auth/user`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['User Profile'] = { status: '✅ Working', user: data.user?.id };
      // console.log removed for production
    } else {
      testResults['User Profile'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['User Profile'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== SOCIAL ENDPOINTS =====
  // console.log removed for production
  
  // Test social feed
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/social/feed`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Social Feed'] = { status: '✅ Working', posts: data.feed?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Social Feed'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Social Feed'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test create post
  // console.log removed for production
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
      // console.log removed for production
    } else {
      testResults['Create Post'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Create Post'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test like post
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
  
  // Test comment on post
  if (testResults['Create Post']?.postId) {
    // console.log removed for production
    try {
      const response = await fetch(`${API_BASE}/api/social/posts/${testResults['Create Post'].postId}/comment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: 'Production audit comment' })
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
  
  // Test friends list
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
  
  // Test user search
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
  
  // Test user stats
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
  
  // ===== POLITICAL ENDPOINTS =====
  // console.log removed for production
  
  // Test politicians
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/politicians`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Politicians'] = { status: '✅ Working', count: data.politicians?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Politicians'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Politicians'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test bills
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/bills`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Bills'] = { status: '✅ Working', count: data.bills?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Bills'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Bills'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test voting
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/voting`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Voting'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['Voting'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Voting'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== NEWS ENDPOINTS =====
  // console.log removed for production
  
  // Test news
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/news`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['News'] = { status: '✅ Working', count: data.news?.length || 0 };
      // console.log removed for production
    } else {
      testResults['News'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['News'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== ANNOUNCEMENTS ENDPOINTS =====
  // console.log removed for production
  
  // Test announcements
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/announcements`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Announcements'] = { status: '✅ Working', count: data.announcements?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Announcements'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Announcements'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== LEGAL ENDPOINTS =====
  // console.log removed for production
  
  // Test legal documents
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/legal/documents`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Legal Documents'] = { status: '✅ Working', count: data.documents?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Legal Documents'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Legal Documents'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== GOVERNMENT INTEGRITY ENDPOINTS =====
  // console.log removed for production
  
  // Test government integrity
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/government/integrity`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Government Integrity'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['Government Integrity'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Government Integrity'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== ENGAGEMENT ENDPOINTS =====
  // console.log removed for production
  
  // Test petitions
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/petitions`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Petitions'] = { status: '✅ Working', count: data.petitions?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Petitions'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Petitions'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test events
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/events`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Events'] = { status: '✅ Working', count: data.events?.length || 0 };
      // console.log removed for production
    } else {
      testResults['Events'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Events'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== SYSTEM ENDPOINTS =====
  // console.log removed for production
  
  // Test system health
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/system/health`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['System Health'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['System Health'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['System Health'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Test analytics
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/analytics`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Analytics'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['Analytics'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Analytics'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== IDENTITY ENDPOINTS =====
  // console.log removed for production
  
  // Test identity verification
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/identity/verify`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Identity Verification'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['Identity Verification'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Identity Verification'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== PERMISSIONS ENDPOINTS =====
  // console.log removed for production
  
  // Test permissions
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/permissions`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Permissions'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['Permissions'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Permissions'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== MEMBERSHIP ENDPOINTS =====
  // console.log removed for production
  
  // Test membership
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/membership`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Membership'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['Membership'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Membership'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== PAYMENTS ENDPOINTS =====
  // console.log removed for production
  
  // Test payments
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/payments`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Payments'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['Payments'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Payments'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== FILE UPLOAD ENDPOINTS =====
  // console.log removed for production
  
  // Test file upload
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/upload`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['File Upload'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['File Upload'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['File Upload'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== WEBHOOKS ENDPOINTS =====
  // console.log removed for production
  
  // Test webhooks
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/webhooks`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Webhooks'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['Webhooks'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Webhooks'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // ===== DEVELOPMENT ENDPOINTS =====
  // console.log removed for production
  
  // Test development tools
  // console.log removed for production
  try {
    const response = await fetch(`${API_BASE}/api/dev/tools`, { headers });
    const data = await response.json();
    if (response.ok) {
      testResults['Development Tools'] = { status: '✅ Working', data: data };
      // console.log removed for production
    } else {
      testResults['Development Tools'] = { status: '❌ Failed', error: data.error };
      // console.log removed for production
    }
  } catch (error) {
    testResults['Development Tools'] = { status: '❌ Error', error: error.message };
    // console.log removed for production
  }
  
  // Step 3: Generate comprehensive report
  // console.log removed for production
  // console.log removed for production
  
  const workingEndpoints = Object.keys(testResults).filter(key => testResults[key].status === '✅ Working');
  const brokenEndpoints = Object.keys(testResults).filter(key => testResults[key].status.startsWith('❌'));
  
  // console.log removed for production
  // console.log removed for production
  console.log(`📊 Total Endpoints Tested: ${Object.keys(testResults).length}`);
  
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
  
  const readinessScore = Math.round((workingEndpoints.length / Object.keys(testResults).length) * 100);
  
  // console.log removed for production
  
  if (readinessScore >= 90) {
    // console.log removed for production
  } else if (readinessScore >= 70) {
    // console.log removed for production
  } else if (readinessScore >= 50) {
    // console.log removed for production
  } else {
    // console.log removed for production
  }
  
  // console.log removed for production
  // console.log removed for production
  
  // Identify critical broken endpoints
  const criticalEndpoints = [
    'Login', 'User Profile', 'Social Feed', 'Create Post', 
    'Politicians', 'News', 'Announcements'
  ];
  
  const criticalBroken = criticalEndpoints.filter(endpoint => 
    testResults[endpoint] && testResults[endpoint].status.startsWith('❌')
  );
  
  if (criticalBroken.length > 0) {
    // console.log removed for production
    criticalBroken.forEach(endpoint => {
      // console.log removed for production
    });
  } else {
    // console.log removed for production
  }
  
  return testResults;
}

comprehensiveProductionAudit().catch(console.error); 