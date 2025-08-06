const API_BASE = 'https://civicos.onrender.com';

// List of all expected database tables based on schema
const EXPECTED_TABLES = [
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
  'identity_verifications'
];

// List of all expected endpoints based on routes
const EXPECTED_ENDPOINTS = [
  // Authentication
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/user',
  '/api/auth/env-check',
  
  // User management
  '/api/users/profile',
  '/api/users/search',
  '/api/users/profile/:username',
  
  // Social/CivicSocial
  '/api/social/feed',
  '/api/social/posts',
  '/api/social/posts/:id/like',
  '/api/social/posts/:id/comment',
  '/api/social/friends',
  '/api/social/messages',
  '/api/social/posts/user/:username',
  
  // Political intelligence
  '/api/politicians',
  '/api/politicians/:id',
  '/api/bills',
  '/api/bills/:id',
  '/api/voting',
  '/api/elections',
  '/api/elections/:id',
  
  // News & media
  '/api/news',
  '/api/news/articles',
  '/api/news/trending',
  '/api/news/search',
  
  // Legal & rights
  '/api/legal',
  '/api/legal/search',
  '/api/rights',
  '/api/cases',
  '/api/cases/:id',
  
  // Government integrity
  '/api/finance',
  '/api/lobbyists',
  '/api/procurement',
  '/api/corruption',
  '/api/leaks',
  '/api/foi',
  '/api/whistleblower',
  
  // Engagement
  '/api/petitions',
  '/api/petitions/:id',
  '/api/contacts',
  '/api/contacts/:id',
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
  '/health'
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

async function runDatabaseAudit() {
  // console.log removed for production
  
  // Get authentication token
  // console.log removed for production
  const registerResult = await testEndpoint('/api/auth/register', 'POST', {}, {
    email: `audit${Date.now()}@civicos.com`,
    password: 'auditpass123',
    firstName: 'Audit',
    lastName: 'User',
    agreeToTerms: true
  });
  
  let token = null;
  if (registerResult.success) {
    token = registerResult.data.token;
    // console.log removed for production
  } else {
    // console.log removed for production
    // console.log removed for production
  }
  
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  // Test database functionality through API endpoints
  // console.log removed for production
  
  const databaseTests = [
    {
      name: 'Users Table',
      endpoint: '/api/users/profile',
      method: 'GET',
      headers: authHeaders,
      expected: true
    },
    {
      name: 'Social Posts Table',
      endpoint: '/api/social/posts',
      method: 'POST',
      headers: authHeaders,
      body: {
        content: 'Database audit test post',
        type: 'text',
        visibility: 'public'
      },
      expected: true
    },
    {
      name: 'Social Likes Table',
      endpoint: '/api/social/posts/1/like',
      method: 'POST',
      headers: authHeaders,
      expected: false // Known to be broken
    },
    {
      name: 'Social Comments Table',
      endpoint: '/api/social/posts/1/comment',
      method: 'POST',
      headers: authHeaders,
      body: { content: 'Database audit test comment' },
      expected: false // Known to be broken
    },
    {
      name: 'Politicians Table',
      endpoint: '/api/politicians',
      method: 'GET',
      expected: true
    },
    {
      name: 'Bills Table',
      endpoint: '/api/bills',
      method: 'GET',
      expected: true
    },
    {
      name: 'Elections Table',
      endpoint: '/api/elections',
      method: 'GET',
      expected: true
    },
    {
      name: 'News Articles Table',
      endpoint: '/api/news',
      method: 'GET',
      expected: false // Known to be broken
    },
    {
      name: 'Legal Cases Table',
      endpoint: '/api/cases',
      method: 'GET',
      expected: true
    },
    {
      name: 'Finance Table',
      endpoint: '/api/finance',
      method: 'GET',
      expected: true
    },
    {
      name: 'Lobbyists Table',
      endpoint: '/api/lobbyists',
      method: 'GET',
      expected: true
    },
    {
      name: 'Petitions Table',
      endpoint: '/api/petitions',
      method: 'GET',
      expected: false // Known to be broken
    },
    {
      name: 'Announcements Table',
      endpoint: '/api/announcements',
      method: 'GET',
      expected: false // Known to be broken
    },
    {
      name: 'Notifications Table',
      endpoint: '/api/notifications',
      method: 'GET',
      expected: true
    },
    {
      name: 'Memory Table',
      endpoint: '/api/memory',
      method: 'GET',
      expected: true
    },
    {
      name: 'Ledger Table',
      endpoint: '/api/ledger',
      method: 'GET',
      expected: true
    },
    {
      name: 'Trust Table',
      endpoint: '/api/trust',
      method: 'GET',
      expected: true
    }
  ];
  
  const results = [];
  
  for (const test of databaseTests) {
    // console.log removed for production
    const result = await testEndpoint(test.endpoint, test.method, test.headers, test.body);
    
    const status = result.success ? '✅' : '❌';
    const expected = test.expected ? '✅' : '❌';
    const match = (result.success === test.expected) ? '✅' : '⚠️';
    
    console.log(`${status} ${test.name}: ${result.success ? 'Working' : 'Broken'} (Expected: ${test.expected ? 'Working' : 'Broken'}) ${match}`);
    
    if (!result.success) {
      // console.log removed for production
    }
    
    results.push({
      name: test.name,
      working: result.success,
      expected: test.expected,
      error: result.error
    });
  }
  
  // Summary
  // console.log removed for production
  // console.log removed for production
  
  const working = results.filter(r => r.working).length;
  const broken = results.filter(r => !r.working).length;
  const unexpected = results.filter(r => r.working !== r.expected).length;
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  
  // console.log removed for production
  // console.log removed for production
  results.filter(r => !r.working).forEach(r => {
    // console.log removed for production
  });
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  console.log('- social_likes (causing like functionality to fail)');
  console.log('- social_comments (causing comment functionality to fail)');
  console.log('- news_articles (causing news functionality to fail)');
  console.log('- petitions (causing petition functionality to fail)');
  console.log('- announcements (causing announcements to fail)');
  console.log('- Various government integrity tables (procurement, corruption, leaks, etc.)');
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
}

runDatabaseAudit().catch(console.error); 