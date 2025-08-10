import fetch from 'node-fetch';

const API_BASE = 'https://civicos.onrender.com';

// Test user credentials
const testUser = {
  email: 'test@civicos.com',
  password: 'testpassword123'
};

async function testProfileSystem() {
  // console.log removed for production
  console.log('='.repeat(60));

  try {
    // 1. Test Login
    // console.log removed for production
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const authToken = loginData.token;
    // console.log removed for production

    // 2. Test User Profile Retrieval
    // console.log removed for production
    const profileResponse = await fetch(`${API_BASE}/api/auth/user`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!profileResponse.ok) {
      throw new Error('Profile retrieval failed');
    }

    const userProfile = await profileResponse.json();
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production

    // 3. Test User Search with Username
    // console.log removed for production
    const searchResponse = await fetch(`${API_BASE}/api/users/search?q=${userProfile.username}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      // console.log removed for production
      
      if (searchData.users.length > 0) {
        const foundUser = searchData.users[0];
        console.log(`   Found user: ${foundUser.displayName} (@${foundUser.username})`);
      }
    } else {
      // console.log removed for production
    }

    // 4. Test Profile by Username
    // console.log removed for production
    const profileByUsernameResponse = await fetch(`${API_BASE}/api/users/profile/${userProfile.username}`);

    if (profileByUsernameResponse.ok) {
      const profileData = await profileByUsernameResponse.json();
      // console.log removed for production
      // console.log removed for production
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // 5. Test User Posts by Username
    // console.log removed for production
    const userPostsResponse = await fetch(`${API_BASE}/api/social/posts/user/${userProfile.username}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (userPostsResponse.ok) {
      const userPostsData = await userPostsResponse.json();
      // console.log removed for production
    } else {
      // console.log removed for production
    }

    // 6. Test General User Search
    // console.log removed for production
    const generalSearchResponse = await fetch(`${API_BASE}/api/users/search?q=test`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (generalSearchResponse.ok) {
      const generalSearchData = await generalSearchResponse.json();
      // console.log removed for production
      
      if (generalSearchData.users.length > 0) {
        // console.log removed for production
        generalSearchData.users.slice(0, 3).forEach((user, index) => {
          console.log(`     ${index + 1}. ${user.displayName} (@${user.username || 'no-username'})`);
        });
      }
    } else {
      // console.log removed for production
    }

    console.log('\n' + '='.repeat(60));
    // console.log removed for production
    console.log('='.repeat(60));
    
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production

    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production
    // console.log removed for production

    // console.log removed for production

  } catch (error) {
    // console.error removed for production
  }
}

testProfileSystem(); 