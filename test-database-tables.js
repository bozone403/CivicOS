const API_BASE = 'https://civicos.onrender.com';

async function testDatabaseTables() {
  console.log('🔍 Testing Database Tables\n');
  
  // Test 1: Check if we can create a user (users table)
  console.log('📋 Test 1: Users Table');
  const registerResult = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${Date.now()}@civicos.com`,
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'User',
      agreeToTerms: true
    })
  });
  
  if (registerResult.ok) {
    console.log('✅ Users table - WORKING');
    const userData = await registerResult.json();
    const token = userData.token;
    
    // Test 2: Check if we can create a social post (social_posts table)
    console.log('\n📋 Test 2: Social Posts Table');
    const createPostResult = await fetch(`${API_BASE}/api/social/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: 'Database table test post',
        type: 'text',
        visibility: 'public'
      })
    });
    
    if (createPostResult.ok) {
      console.log('✅ Social posts table - WORKING');
      const postData = await createPostResult.json();
      console.log('Post creation response:', JSON.stringify(postData, null, 2));
      const postId = postData.data?.id || postData.id;
      
      // Test 3: Check if we can like a post (social_likes table)
      console.log('\n📋 Test 3: Social Likes Table');
      const likeResult = await fetch(`${API_BASE}/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (likeResult.ok) {
        console.log('✅ Social likes table - WORKING');
      } else {
        const errorData = await likeResult.json();
        console.log('❌ Social likes table - FAILED');
        console.log(`   Error: ${errorData.error}`);
      }
      
      // Test 4: Check if we can comment on a post (social_comments table)
      console.log('\n📋 Test 4: Social Comments Table');
      const commentResult = await fetch(`${API_BASE}/api/social/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: 'Database table test comment'
        })
      });
      
      if (commentResult.ok) {
        console.log('✅ Social comments table - WORKING');
      } else {
        const errorData = await commentResult.json();
        console.log('❌ Social comments table - FAILED');
        console.log(`   Error: ${errorData.error}`);
      }
      
    } else {
      console.log('❌ Social posts table - FAILED');
      const errorData = await createPostResult.json();
      console.log(`   Error: ${errorData.error}`);
    }
    
  } else {
    console.log('❌ Users table - FAILED');
    const errorData = await registerResult.json();
    console.log(`   Error: ${errorData.error}`);
  }
  
  console.log('\n🎯 Database Table Test Summary:');
  console.log('- Users table: Core functionality');
  console.log('- Social posts table: Post creation');
  console.log('- Social likes table: Post interactions');
  console.log('- Social comments table: Post interactions');
}

testDatabaseTables().catch(console.error); 