#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'https://civicos.onrender.com';

async function testEndpoint(endpoint, description) {
  try {
    // console.log removed for production
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      // console.log removed for production
      if (data.success !== undefined) {
        // console.log removed for production
      }
      if (data.data && Array.isArray(data.data)) {
        // console.log removed for production
      }
      if (data.count !== undefined) {
        // console.log removed for production
      }
      if (data.message) {
        // console.log removed for production
      }
    } else {
      // console.log removed for production
      if (data.error) {
        // console.log removed for production
      }
    }
    // console.log removed for production
  } catch (error) {
    // console.log removed for production
    // console.log removed for production
  }
}

async function testAllEndpoints() {
  // console.log removed for production
  
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
  
  // console.log removed for production
}

testAllEndpoints().catch(console.error);
