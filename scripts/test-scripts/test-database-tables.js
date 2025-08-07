const API_BASE = 'https://civicos.onrender.com';

async function testDatabaseTables() {
  // console.log removed for production
  
  // Test 1: Check if we can create a user (users table)
  // console.log removed for production
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
    // console.log removed for production
    const userData = await registerResult.json();
    const token = userData.token;
    
    // Test 2: Check if we can create a social post (social_posts table)
    // console.log removed for production
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
      // console.log removed for production
      const postData = await createPostResult.json();
      console.log('Post creation response:', JSON.stringify(postData, null, 2));
      const postId = postData.data?.id || postData.id;
      
      // Test 3: Check if we can like a post (social_likes table)
      // console.log removed for production
      const likeResult = await fetch(`${API_BASE}/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (likeResult.ok) {
        // console.log removed for production
      } else {
        const errorData = await likeResult.json();
        // console.log removed for production
        // console.log removed for production
      }
      
      // Test 4: Check if we can comment on a post (social_comments table)
      // console.log removed for production
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
        // console.log removed for production
      } else {
        const errorData = await commentResult.json();
        // console.log removed for production
        // console.log removed for production
      }
      
    } else {
      // console.log removed for production
      const errorData = await createPostResult.json();
      // console.log removed for production
    }
    
  } else {
    // console.log removed for production
    const errorData = await registerResult.json();
    // console.log removed for production
  }
  
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
}

testDatabaseTables().catch(console.error); 