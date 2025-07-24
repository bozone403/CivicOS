#!/usr/bin/env node

/**
 * API Endpoint Audit Script
 * Tests all API endpoints for functionality and response format
 */

import https from 'https';
import http from 'http';

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'https://civicos.onrender.com';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token';

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test function
async function testEndpoint(name, url, expectedStatus = 200, options = {}) {
  try {
    console.log(`Testing ${name}...`);
    const response = await makeRequest(url, options);
    
    // Check status code
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }
    
    // Check response format for success responses
    if (response.status >= 200 && response.status < 300) {
      if (!response.data.success && response.data.success !== undefined) {
        throw new Error('Response missing success field');
      }
      
      if (response.data.success && !response.data.message) {
        throw new Error('Success response missing message field');
      }
      
      if (response.data.success && !response.data.timestamp) {
        throw new Error('Success response missing timestamp field');
      }
    }
    
    // Check error format for error responses
    if (response.status >= 400) {
      if (response.data.success !== false) {
        throw new Error('Error response should have success: false');
      }
      
      if (!response.data.error) {
        throw new Error('Error response missing error object');
      }
    }
    
    console.log(`✅ ${name} - PASSED`);
    results.passed++;
    return true;
  } catch (error) {
    console.log(`❌ ${name} - FAILED: ${error.message}`);
    results.failed++;
    results.errors.push({ endpoint: name, error: error.message });
    return false;
  }
}

// Test suites
async function testCoreEndpoints() {
  console.log('\n🔍 Testing Core Endpoints...');
  
  await testEndpoint('Health Check', `${BASE_URL}/api/health`);
  await testEndpoint('Database Health', `${BASE_URL}/api/monitoring/db`);
  await testEndpoint('Dashboard Stats (Unauthorized)', `${BASE_URL}/api/dashboard/stats`, 401);
  await testEndpoint('User Profile (Unauthorized)', `${BASE_URL}/api/users/profile`, 401);
  await testEndpoint('Notifications', `${BASE_URL}/api/notifications`);
}

async function testDemocracyEndpoints() {
  console.log('\n🗳️ Testing Democracy Endpoints...');
  
  await testEndpoint('Elections', `${BASE_URL}/api/elections`);
  await testEndpoint('Elections Stats', `${BASE_URL}/api/elections/stats`);
  await testEndpoint('Politicians', `${BASE_URL}/api/politicians`);
  await testEndpoint('Politicians Stats', `${BASE_URL}/api/politicians/stats`);
  await testEndpoint('Bills', `${BASE_URL}/api/bills`);
  await testEndpoint('Bills Stats', `${BASE_URL}/api/bills/stats`);
  await testEndpoint('Contacts Officials', `${BASE_URL}/api/contacts/officials`);
}

async function testLegalEndpoints() {
  console.log('\n⚖️ Testing Legal Endpoints...');
  
  await testEndpoint('Legal Acts', `${BASE_URL}/api/legal/acts`);
  await testEndpoint('Legal Stats', `${BASE_URL}/api/legal/stats`);
  await testEndpoint('Rights Charter', `${BASE_URL}/api/rights/charter`);
  await testEndpoint('Rights Provincial', `${BASE_URL}/api/rights/provincial`);
  await testEndpoint('Cases', `${BASE_URL}/api/cases`);
}

async function testTransparencyEndpoints() {
  console.log('\n🔍 Testing Transparency Endpoints...');
  
  await testEndpoint('Finance', `${BASE_URL}/api/finance`);
  await testEndpoint('Finance Stats', `${BASE_URL}/api/finance/stats`);
  await testEndpoint('Lobbyists', `${BASE_URL}/api/lobbyists`);
  await testEndpoint('Procurement', `${BASE_URL}/api/procurement`);
  await testEndpoint('Procurement Stats', `${BASE_URL}/api/procurement/stats`);
  await testEndpoint('Leaks', `${BASE_URL}/api/leaks`);
  await testEndpoint('FOI', `${BASE_URL}/api/foi`);
  await testEndpoint('Whistleblower', `${BASE_URL}/api/whistleblower`);
  await testEndpoint('Corruption', `${BASE_URL}/api/corruption`);
}

async function testAnalysisEndpoints() {
  console.log('\n📊 Testing Analysis Endpoints...');
  
  await testEndpoint('Memory', `${BASE_URL}/api/memory`);
  await testEndpoint('Pulse', `${BASE_URL}/api/pulse`);
  await testEndpoint('Trust Politicians', `${BASE_URL}/api/trust/politicians`);
  await testEndpoint('Trust Stats', `${BASE_URL}/api/trust/stats`);
  await testEndpoint('Maps Districts', `${BASE_URL}/api/maps/districts`);
  await testEndpoint('Maps Stats', `${BASE_URL}/api/maps/stats`);
  await testEndpoint('Ledger', `${BASE_URL}/api/ledger`);
}

async function testSocialEndpoints() {
  console.log('\n👥 Testing Social Endpoints...');
  
  await testEndpoint('Social Posts (Unauthorized)', `${BASE_URL}/api/social/posts`, 401);
  await testEndpoint('Friends (Unauthorized)', `${BASE_URL}/api/friends`, 401);
  await testEndpoint('Messages (Unauthorized)', `${BASE_URL}/api/messages/conversations`, 401);
  await testEndpoint('Petitions', `${BASE_URL}/api/petitions`);
  await testEndpoint('Petitions Stats', `${BASE_URL}/api/petitions`);
}

async function testNewsEndpoints() {
  console.log('\n📰 Testing News Endpoints...');
  
  await testEndpoint('News', `${BASE_URL}/api/news`);
  await testEndpoint('News Stats', `${BASE_URL}/api/news/stats`);
  await testEndpoint('News Sources', `${BASE_URL}/api/news/sources`);
  await testEndpoint('AI Health', `${BASE_URL}/api/ai/health`);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Endpoint Audit...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  try {
    await testCoreEndpoints();
    await testDemocracyEndpoints();
    await testLegalEndpoints();
    await testTransparencyEndpoints();
    await testAnalysisEndpoints();
    await testSocialEndpoints();
    await testNewsEndpoints();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
  
  const duration = Date.now() - startTime;
  
  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log(`⏱️ Duration: ${duration}ms`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(error => {
      console.log(`  - ${error.endpoint}: ${error.error}`);
    });
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  if (results.failed === 0) {
    console.log('✅ All endpoints are working correctly!');
  } else {
    console.log('🔧 Some endpoints need attention:');
    console.log('  - Check authentication on protected routes');
    console.log('  - Verify database connectivity');
    console.log('  - Ensure proper error handling');
    console.log('  - Standardize response formats');
  }
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests, testEndpoint }; 