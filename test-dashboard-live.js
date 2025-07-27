import fetch from 'node-fetch';

async function testDashboardLive() {
  try {
    console.log('Testing LIVE dashboard endpoint...');
    
    // Test the live dashboard stats endpoint
    const response = await fetch('https://civicos.onrender.com/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ LIVE Dashboard endpoint working!');
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Live server endpoint error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing live dashboard:', error.message);
  }
}

testDashboardLive(); 