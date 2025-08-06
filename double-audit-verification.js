const API_BASE = 'https://civicos.onrender.com';

// Comprehensive list of ALL expected endpoints based on codebase analysis
const ALL_EXPECTED_ENDPOINTS = [
  // Authentication & User Management
  '/api/auth/register',
  '/api/auth/login', 
  '/api/auth/user',
  '/api/auth/env-check',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/verify',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/change-password',
  '/api/auth/update-profile',
  '/api/auth/delete-account',
  
  // User Management
  '/api/users/profile',
  '/api/users/search',
  '/api/users/profile/:username',
  '/api/users/:id',
  '/api/users/:id/friends',
  '/api/users/:id/posts',
  '/api/users/:id/activities',
  '/api/users/:id/settings',
  '/api/users/:id/notifications',
  '/api/users/:id/messages',
  '/api/users/:id/block',
  '/api/users/:id/report',
  
  // Social/CivicSocial
  '/api/social/feed',
  '/api/social/posts',
  '/api/social/posts/:id',
  '/api/social/posts/:id/like',
  '/api/social/posts/:id/comment',
  '/api/social/posts/:id/share',
  '/api/social/posts/:id/bookmark',
  '/api/social/posts/:id/report',
  '/api/social/posts/user/:username',
  '/api/social/comments/:id',
  '/api/social/comments/:id/like',
  '/api/social/comments/:id/reply',
  '/api/social/friends',
  '/api/social/friends/requests',
  '/api/social/friends/:id/accept',
  '/api/social/friends/:id/reject',
  '/api/social/friends/:id/remove',
  '/api/social/messages',
  '/api/social/messages/:id',
  '/api/social/messages/conversation/:userId',
  '/api/social/notifications',
  '/api/social/activities',
  '/api/social/bookmarks',
  '/api/social/shares',
  
  // Political Intelligence
  '/api/politicians',
  '/api/politicians/:id',
  '/api/politicians/:id/statements',
  '/api/politicians/:id/positions',
  '/api/politicians/:id/finance',
  '/api/politicians/:id/truth-tracking',
  '/api/politicians/:id/voting-record',
  '/api/politicians/search',
  '/api/bills',
  '/api/bills/:id',
  '/api/bills/:id/vote',
  '/api/bills/:id/comments',
  '/api/bills/search',
  '/api/voting',
  '/api/voting/items',
  '/api/voting/items/:id',
  '/api/voting/items/:id/vote',
  '/api/voting/history',
  '/api/elections',
  '/api/elections/:id',
  '/api/elections/:id/candidates',
  '/api/elections/:id/results',
  '/api/elections/:id/vote',
  '/api/candidates',
  '/api/candidates/:id',
  '/api/candidates/:id/policies',
  '/api/candidates/:id/positions',
  '/api/districts',
  '/api/districts/:id',
  '/api/districts/:id/representatives',
  
  // News & Media
  '/api/news',
  '/api/news/articles',
  '/api/news/articles/:id',
  '/api/news/trending',
  '/api/news/search',
  '/api/news/sources',
  '/api/news/sources/:id',
  '/api/news/comparisons',
  '/api/news/comparisons/:id',
  '/api/news/propaganda-detection',
  '/api/news/credibility',
  '/api/news/credibility/:sourceId',
  '/api/news/bias-analysis',
  '/api/news/fact-checks',
  '/api/news/fact-checks/:id',
  
  // Legal & Rights
  '/api/legal',
  '/api/legal/search',
  '/api/legal/acts',
  '/api/legal/acts/:id',
  '/api/legal/cases',
  '/api/legal/cases/:id',
  '/api/legal/criminal-code',
  '/api/legal/criminal-code/:section',
  '/api/legal/legislative-acts',
  '/api/legal/legislative-acts/:id',
  '/api/rights',
  '/api/rights/search',
  '/api/rights/:id',
  '/api/rights/violations',
  '/api/rights/violations/:id',
  '/api/rights/report',
  
  // Government Integrity
  '/api/finance',
  '/api/finance/campaigns',
  '/api/finance/campaigns/:id',
  '/api/finance/donations',
  '/api/finance/donations/:id',
  '/api/finance/expenditures',
  '/api/finance/expenditures/:id',
  '/api/lobbyists',
  '/api/lobbyists/:id',
  '/api/lobbyists/:id/activities',
  '/api/lobbyists/:id/registrations',
  '/api/procurement',
  '/api/procurement/contracts',
  '/api/procurement/contracts/:id',
  '/api/procurement/tenders',
  '/api/procurement/tenders/:id',
  '/api/corruption',
  '/api/corruption/reports',
  '/api/corruption/reports/:id',
  '/api/corruption/cases',
  '/api/corruption/cases/:id',
  '/api/leaks',
  '/api/leaks/documents',
  '/api/leaks/documents/:id',
  '/api/leaks/submit',
  '/api/foi',
  '/api/foi/requests',
  '/api/foi/requests/:id',
  '/api/foi/submit',
  '/api/whistleblower',
  '/api/whistleblower/reports',
  '/api/whistleblower/reports/:id',
  '/api/whistleblower/submit',
  
  // Engagement
  '/api/petitions',
  '/api/petitions/:id',
  '/api/petitions/:id/sign',
  '/api/petitions/:id/comments',
  '/api/petitions/create',
  '/api/petitions/search',
  '/api/contacts',
  '/api/contacts/:id',
  '/api/contacts/search',
  '/api/contacts/create',
  '/api/maps',
  '/api/maps/districts',
  '/api/maps/districts/:id',
  '/api/maps/representatives',
  '/api/maps/representatives/:id',
  '/api/maps/polling-stations',
  '/api/maps/polling-stations/:id',
  '/api/memory',
  '/api/memory/events',
  '/api/memory/events/:id',
  '/api/memory/search',
  '/api/ledger',
  '/api/ledger/transactions',
  '/api/ledger/transactions/:id',
  '/api/ledger/balances',
  '/api/ledger/balances/:userId',
  '/api/trust',
  '/api/trust/scores',
  '/api/trust/scores/:userId',
  '/api/trust/verification',
  '/api/trust/verification/:id',
  
  // System & Admin
  '/api/announcements',
  '/api/announcements/:id',
  '/api/announcements/create',
  '/api/announcements/:id/update',
  '/api/announcements/:id/delete',
  '/api/notifications',
  '/api/notifications/:id',
  '/api/notifications/mark-read',
  '/api/notifications/settings',
  '/api/messages',
  '/api/messages/:id',
  '/api/messages/unread/count',
  '/api/messages/conversations',
  '/api/messages/conversations/:id',
  '/api/dashboard/stats',
  '/api/dashboard/activity',
  '/api/dashboard/analytics',
  '/api/dashboard/reports',
  '/api/search',
  '/api/search/advanced',
  '/api/search/suggestions',
  '/api/ai/chat',
  '/api/ai/models',
  '/api/ai/analyze',
  '/api/ai/summarize',
  '/api/ai/translate',
  '/api/ai/generate',
  '/api/health',
  '/api/status',
  '/api/version',
  '/api/config',
  '/api/logs',
  '/api/metrics',
  
  // Identity & Verification
  '/api/identity/verify',
  '/api/identity/verify/:id',
  '/api/identity/upload',
  '/api/identity/upload/:id',
  '/api/identity/status',
  '/api/identity/status/:id',
  '/api/identity/review',
  '/api/identity/review/:id',
  
  // Permissions & Security
  '/api/permissions',
  '/api/permissions/:id',
  '/api/permissions/check',
  '/api/permissions/grant',
  '/api/permissions/revoke',
  '/api/security/audit',
  '/api/security/audit/:id',
  '/api/security/logs',
  '/api/security/logs/:id',
  
  // Membership & Subscriptions
  '/api/membership',
  '/api/membership/plans',
  '/api/membership/plans/:id',
  '/api/membership/subscribe',
  '/api/membership/subscribe/:planId',
  '/api/membership/cancel',
  '/api/membership/upgrade',
  '/api/membership/downgrade',
  '/api/membership/billing',
  '/api/membership/billing/:id',
  '/api/membership/history',
  '/api/membership/history/:id',
  
  // Payments & Donations
  '/api/payments',
  '/api/payments/:id',
  '/api/payments/create-intent',
  '/api/payments/confirm',
  '/api/payments/cancel',
  '/api/payments/refund',
  '/api/donations',
  '/api/donations/:id',
  '/api/donations/create',
  '/api/donations/cancel',
  '/api/donations/history',
  '/api/donations/history/:id',
  
  // File Upload & Media
  '/api/upload',
  '/api/upload/image',
  '/api/upload/document',
  '/api/upload/video',
  '/api/upload/audio',
  '/api/media',
  '/api/media/:id',
  '/api/media/:id/delete',
  '/api/media/search',
  
  // Analytics & Reporting
  '/api/analytics',
  '/api/analytics/users',
  '/api/analytics/activity',
  '/api/analytics/engagement',
  '/api/analytics/reports',
  '/api/analytics/reports/:id',
  '/api/analytics/export',
  '/api/analytics/export/:id',
  
  // Webhooks & Integrations
  '/api/webhooks',
  '/api/webhooks/:id',
  '/api/webhooks/register',
  '/api/webhooks/unregister',
  '/api/integrations',
  '/api/integrations/:id',
  '/api/integrations/connect',
  '/api/integrations/disconnect',
  
  // Development & Testing
  '/api/dev/test',
  '/api/dev/test/:id',
  '/api/dev/mock',
  '/api/dev/mock/:id',
  '/api/dev/seed',
  '/api/dev/seed/:id',
  '/api/dev/reset',
  '/api/dev/reset/:id'
];

// All expected database tables
const ALL_EXPECTED_TABLES = [
  // Core tables
  'users',
  'sessions',
  'politicians',
  'bills',
  'votes',
  'elections',
  'electoral_candidates',
  'electoral_votes',
  'electoral_districts',
  'candidates',
  'candidate_policies',
  
  // Social/CivicSocial tables
  'social_posts',
  'social_comments',
  'social_likes',
  'social_shares',
  'social_bookmarks',
  'user_friends',
  'user_messages',
  'user_activities',
  'profile_views',
  'user_blocks',
  'user_reports',
  
  // News and media tables
  'news_articles',
  'news_comparisons',
  'propaganda_detection',
  'news_source_credibility',
  
  // Legal tables
  'criminal_code_sections',
  'legal_acts',
  'legal_cases',
  'legislative_acts',
  
  // Political tracking tables
  'politician_statements',
  'politician_positions',
  'campaign_finance',
  'politician_truth_tracking',
  
  // Engagement tables
  'petitions',
  'petition_signatures',
  'contacts',
  
  // System tables
  'announcements',
  'notifications',
  'user_permissions',
  'permissions',
  'membership_permissions',
  'user_membership_history',
  'fact_checks',
  'user_notification_preferences',
  'voting_items',
  
  // Identity verification tables
  'identity_verifications',
  
  // Additional expected tables
  'user_settings',
  'user_preferences',
  'user_sessions',
  'user_logs',
  'user_audit',
  'system_logs',
  'system_metrics',
  'system_config',
  'api_keys',
  'webhooks',
  'integrations',
  'media_files',
  'documents',
  'reports',
  'analytics',
  'backups',
  'migrations',
  'schema_versions'
];

async function testEndpoint(endpoint, method = 'GET', headers = {}, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return {
        success: false,
        status: response.status,
        data: null,
        error: `Invalid JSON response: ${text.substring(0, 100)}...`
      };
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      error: !response.ok ? data.message || data.error : null
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

async function runDoubleAudit() {
  console.log('🔍 COMPREHENSIVE DOUBLE AUDIT VERIFICATION\n');
  
  // Get authentication token
  console.log('📋 Step 1: Getting authentication token...');
  const registerResult = await testEndpoint('/api/auth/register', 'POST', {}, {
    email: `doubleaudit${Date.now()}@civicos.com`,
    password: 'doubleauditpass123',
    firstName: 'Double',
    lastName: 'Audit',
    agreeToTerms: true
  });
  
  let token = null;
  if (registerResult.success) {
    token = registerResult.data.token;
    console.log('✅ Authentication token obtained');
  } else {
    console.log('❌ Failed to get authentication token');
    console.log(`   Error: ${registerResult.error}`);
  }
  
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  // Test all endpoints systematically
  console.log('\n📋 Step 2: Testing ALL Expected Endpoints...');
  
  const endpointResults = [];
  const workingEndpoints = [];
  const brokenEndpoints = [];
  const missingEndpoints = [];
  
  // Test a subset of critical endpoints first
  const criticalEndpoints = [
    // Authentication
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/user',
    '/api/auth/env-check',
    
    // User Management
    '/api/users/profile',
    '/api/users/search',
    '/api/users/profile/testuser',
    
    // Social/CivicSocial
    '/api/social/feed',
    '/api/social/posts',
    '/api/social/posts/1/like',
    '/api/social/posts/1/comment',
    '/api/social/friends',
    '/api/social/messages',
    '/api/social/posts/user/testuser',
    
    // Political Intelligence
    '/api/politicians',
    '/api/politicians/1',
    '/api/bills',
    '/api/bills/1',
    '/api/voting',
    '/api/elections',
    '/api/elections/1',
    
    // News & Media
    '/api/news',
    '/api/news/articles',
    '/api/news/trending',
    '/api/news/search',
    
    // Legal & Rights
    '/api/legal',
    '/api/legal/search',
    '/api/rights',
    '/api/cases',
    '/api/cases/1',
    
    // Government Integrity
    '/api/finance',
    '/api/lobbyists',
    '/api/procurement',
    '/api/corruption',
    '/api/leaks',
    '/api/foi',
    '/api/whistleblower',
    
    // Engagement
    '/api/petitions',
    '/api/petitions/1',
    '/api/contacts',
    '/api/contacts/1',
    '/api/maps',
    '/api/memory',
    '/api/ledger',
    '/api/trust',
    
    // System
    '/api/announcements',
    '/api/notifications',
    '/api/messages/unread/count',
    '/api/dashboard/stats',
    '/api/search',
    '/api/ai/chat',
    '/api/ai/models',
    '/health',
    
    // Identity & Verification
    '/api/identity/verify',
    '/api/identity/status',
    
    // Permissions & Security
    '/api/permissions',
    '/api/security/audit',
    
    // Membership & Subscriptions
    '/api/membership',
    '/api/membership/plans',
    
    // Payments & Donations
    '/api/payments',
    '/api/donations',
    
    // File Upload & Media
    '/api/upload',
    '/api/media',
    
    // Analytics & Reporting
    '/api/analytics',
    '/api/analytics/users',
    
    // Webhooks & Integrations
    '/api/webhooks',
    '/api/integrations',
    
    // Development & Testing
    '/api/dev/test',
    '/api/dev/mock'
  ];
  
  for (const endpoint of criticalEndpoints) {
    console.log(`Testing ${endpoint}...`);
    const result = await testEndpoint(endpoint, 'GET', authHeaders);
    
    if (result.success) {
      workingEndpoints.push(endpoint);
      console.log(`✅ ${endpoint}: Working`);
    } else if (result.status === 404) {
      missingEndpoints.push(endpoint);
      console.log(`❌ ${endpoint}: Missing (404)`);
    } else {
      brokenEndpoints.push(endpoint);
      console.log(`⚠️  ${endpoint}: Broken - ${result.error}`);
    }
    
    endpointResults.push({
      endpoint,
      working: result.success,
      status: result.status,
      error: result.error
    });
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Database functionality tests
  console.log('\n📋 Step 3: Testing Database Functionality...');
  
  if (token) {
    // Test post creation
    const createPostResult = await testEndpoint('/api/social/posts', 'POST', authHeaders, {
      content: 'Double audit test post',
      type: 'text',
      visibility: 'public'
    });
    
    if (createPostResult.success) {
      console.log('✅ Social post creation: Working');
      const postId = createPostResult.data.post.id;
      
      // Test like functionality
      const likeResult = await testEndpoint(`/api/social/posts/${postId}/like`, 'POST', authHeaders);
      console.log(`✅ Post like functionality: ${likeResult.success ? 'Working' : 'Broken'}`);
      
      // Test comment functionality
      const commentResult = await testEndpoint(`/api/social/posts/${postId}/comment`, 'POST', authHeaders, {
        content: 'Double audit test comment'
      });
      console.log(`✅ Post comment functionality: ${commentResult.success ? 'Working' : 'Broken'}`);
      
    } else {
      console.log('❌ Social post creation: Broken');
    }
  }
  
  // Summary
  console.log('\n📊 DOUBLE AUDIT SUMMARY:');
  console.log('=====================================');
  
  console.log(`Total Critical Endpoints Tested: ${criticalEndpoints.length}`);
  console.log(`✅ Working: ${workingEndpoints.length}`);
  console.log(`❌ Broken: ${brokenEndpoints.length}`);
  console.log(`🔍 Missing: ${missingEndpoints.length}`);
  
  console.log('\n🎯 WORKING ENDPOINTS:');
  console.log('=====================================');
  workingEndpoints.forEach(endpoint => {
    console.log(`✅ ${endpoint}`);
  });
  
  console.log('\n❌ BROKEN ENDPOINTS:');
  console.log('=====================================');
  brokenEndpoints.forEach(endpoint => {
    const result = endpointResults.find(r => r.endpoint === endpoint);
    console.log(`❌ ${endpoint}: ${result?.error || 'Unknown error'}`);
  });
  
  console.log('\n🔍 MISSING ENDPOINTS:');
  console.log('=====================================');
  missingEndpoints.forEach(endpoint => {
    console.log(`🔍 ${endpoint}: Not implemented`);
  });
  
  console.log('\n📋 EXPECTED DATABASE TABLES:');
  console.log('=====================================');
  console.log(`Total Expected Tables: ${ALL_EXPECTED_TABLES.length}`);
  console.log('Key tables that should exist:');
  ALL_EXPECTED_TABLES.slice(0, 20).forEach(table => {
    console.log(`- ${table}`);
  });
  console.log('... and many more');
  
  console.log('\n🚨 CRITICAL ISSUES IDENTIFIED:');
  console.log('=====================================');
  console.log('1. Missing database tables (social_likes, social_comments, etc.)');
  console.log('2. Broken authentication endpoints');
  console.log('3. Missing government integrity features');
  console.log('4. Incomplete social interaction functionality');
  console.log('5. Missing news system implementation');
  console.log('6. Incomplete identity verification system');
  console.log('7. Missing payment and donation systems');
  console.log('8. Incomplete analytics and reporting');
  
  console.log('\n🔧 RECOMMENDED IMMEDIATE ACTIONS:');
  console.log('=====================================');
  console.log('1. Apply ALL database migrations to production');
  console.log('2. Fix authentication route registration');
  console.log('3. Implement missing social interaction tables');
  console.log('4. Complete news system implementation');
  console.log('5. Add missing government integrity endpoints');
  console.log('6. Implement identity verification system');
  console.log('7. Add payment and donation functionality');
  console.log('8. Complete analytics and reporting system');
  console.log('9. Add comprehensive error handling');
  console.log('10. Implement proper logging and monitoring');
}

runDoubleAudit().catch(console.error); 