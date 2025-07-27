import fetch from 'node-fetch';

async function testDashboardServer() {
  try {
    console.log('Testing dashboard server endpoint...');
    
    // Test the dashboard stats endpoint
    const response = await fetch('http://localhost:5001/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dashboard server endpoint working!');
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Server endpoint error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard server:', error.message);
  }
}

testDashboardServer(); 