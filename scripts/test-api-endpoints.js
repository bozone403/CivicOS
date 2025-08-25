#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'https://civicos.onrender.com';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`🔍 Testing: ${description}`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`  ✅ Status: ${response.status}`);
      if (data.success !== undefined) {
        console.log(`  📊 Success: ${data.success}`);
      }
      if (data.data && Array.isArray(data.data)) {
        console.log(`  📈 Records: ${data.data.length}`);
      }
      if (data.count !== undefined) {
        console.log(`  🔢 Count: ${data.count}`);
      }
      if (data.message) {
        console.log(`  💬 Message: ${data.message}`);
      }
    } else {
      console.log(`  ❌ Status: ${response.status}`);
      if (data.error) {
        console.log(`  🚨 Error: ${data.error}`);
      }
    }
    console.log('');
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    console.log('');
  }
}

async function testAllEndpoints() {
  console.log('🚀 Testing CivicOS API Endpoints\n');
  
  const endpoints = [
    { path: '/api/health', desc: 'Health Check' },
    { path: '/api/dashboard', desc: 'Dashboard Data' },
    { path: '/api/politicians?limit=5', desc: 'Politicians (5 records)' },
    { path: '/api/petitions', desc: 'Petitions' },
    { path: '/api/news', desc: 'News Articles' },
    { path: '/api/legal', desc: 'Legal Data' },
    { path: '/api/contacts/officials', desc: 'Contact Officials' },
    { path: '/api/announcements', desc: 'Announcements' },
    { path: '/api/social/posts', desc: 'Social Posts' },
    { path: '/api/voting/records', desc: 'Voting Records' }
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.path, endpoint.desc);
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✅ API endpoint testing complete!');
}

testAllEndpoints().catch(console.error);
