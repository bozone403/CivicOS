#!/usr/bin/env node

/**
 * Comprehensive Production Fixes Test Script
 * Tests all the critical fixes implemented for CivicOS platform
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.API_URL || 'https://civicos-backend.onrender.com';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    // console.log removed for production
  } else {
    testResults.failed++;
    // console.log removed for production
    if (details) // console.log removed for production
  }
  testResults.details.push({ name, passed, details });
}

async function testEndpoint(endpoint, expectedStatus = 200, description = '') {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const passed = response.status === expectedStatus;
    logTest(`${endpoint} ${description}`, passed, `Status: ${response.status}`);
    
    if (passed && response.status === 200) {
      try {
        const data = await response.json();
        // Check if response has proper structure
        if (data && typeof data === 'object') {
          if (data.success !== undefined) {
            logTest(`${endpoint} response structure`, true, 'Has success field');
          }
          if (data.data !== undefined || data.message !== undefined) {
            logTest(`${endpoint} response content`, true, 'Has data or message field');
          }
        }
      } catch (parseError) {
        logTest(`${endpoint} JSON parsing`, false, parseError.message);
      }
    }
    
    return response;
  } catch (error) {
    logTest(`${endpoint} ${description}`, false, error.message);
    return null;
  }
}

async function runTests() {
  // console.log removed for production
  // console.log removed for production

  // Test 1: API Health
  // console.log removed for production
  await testEndpoint('/api/health', 200, 'Health Check');

  // Test 2: Dashboard (should now be public)
  // console.log removed for production
  await testEndpoint('/api/dashboard', 200, 'Public Dashboard');
  await testEndpoint('/api/dashboard/public', 200, 'Public Stats');
  await testEndpoint('/api/dashboard/public-stats', 200, 'Public Stats Endpoint');

  // Test 3: Procurement (should not crash)
  // console.log removed for production
  await testEndpoint('/api/procurement', 200, 'Procurement Data');
  await testEndpoint('/api/procurement/stats', 200, 'Procurement Stats');
  await testEndpoint('/api/procurement/federal', 200, 'Procurement by Department');

  // Test 4: Bills (should not have templated data)
  // console.log removed for production
  const billsResponse = await testEndpoint('/api/bills', 200, 'Bills Data');
  if (billsResponse && billsResponse.status === 200) {
    try {
      const billsData = await billsResponse.json();
      if (billsData && billsData.data) {
        const hasRealData = billsData.data.length > 0 && 
          billsData.data.some(bill => 
            bill.title && 
            bill.title !== 'Generic Bill Title' &&
            bill.description &&
            bill.description !== 'Generic bill description'
          );
        logTest('Bills real data check', hasRealData, 
          hasRealData ? 'Contains real bill data' : 'May contain templated data');
      }
    } catch (error) {
      logTest('Bills data validation', false, error.message);
    }
  }

  // Test 5: AI Service (should indicate mock status clearly)
  // console.log removed for production
  const aiStatusResponse = await testEndpoint('/api/ai/status', 200, 'AI Status');
  if (aiStatusResponse && aiStatusResponse.status === 200) {
    try {
      const aiData = await aiStatusResponse.json();
      if (aiData && aiData.isMock !== undefined) {
        logTest('AI mock status transparency', true, 
          `Mock status clearly indicated: ${aiData.isMock}`);
      } else {
        logTest('AI mock status transparency', false, 'Missing isMock field');
      }
    } catch (error) {
      logTest('AI status validation', false, error.message);
    }
  }

  // Test 6: Politicians (should work)
  // console.log removed for production
  await testEndpoint('/api/politicians', 200, 'Politicians Data');

  // Test 7: Petitions (should work)
  // console.log removed for production
  await testEndpoint('/api/petitions', 200, 'Petitions Data');

  // Test 8: News (should work)
  // console.log removed for production
  await testEndpoint('/api/news', 200, 'News Data');

  // Test 9: Legal (should work)
  // console.log removed for production
  await testEndpoint('/api/legal', 200, 'Legal Data');

  // Test 10: Social (should not crash)
  // console.log removed for production
  await testEndpoint('/api/social/feed', 401, 'Social Feed (Auth Required)');

  // Test 11: Error Handling
  // console.log removed for production
  await testEndpoint('/api/nonexistent', 404, '404 Handling');

  // Summary
  // console.log removed for production
  console.log('='.repeat(50));
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    // console.log removed for production
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.details}`));
  }

  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production

  if (testResults.failed === 0) {
    // console.log removed for production
    process.exit(0);
  } else {
    // console.log removed for production
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  // console.error removed for production
  process.exit(1);
});
