const fetch = require('node-fetch');

// Add your API keys here
const API_KEYS = [
  // Add your keys here, for example:
  // "sk-1234567890abcdef1234567890abcdef1234567890abcdef",
  // "sk-0987654321fedcba0987654321fedcba0987654321fedcba",
];

async function testOpenAIKey(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Key works! Available models: ${data.data.length}`);
      return { success: true, key: apiKey, models: data.data.length };
    } else {
      const error = await response.text();
      console.log(`❌ Key failed: ${response.status} - ${error}`);
      return { success: false, key: apiKey, error: error };
    }
  } catch (error) {
    console.log(`❌ Key failed with error: ${error.message}`);
    return { success: false, key: apiKey, error: error.message };
  }
}

async function testAllKeys() {
  console.log('🔍 Testing OpenAI API Keys...\n');
  
  const results = [];
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    console.log(`Testing key ${i + 1}/${API_KEYS.length}: ${key.substring(0, 20)}...`);
    
    const result = await testOpenAIKey(key);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Results Summary:');
  console.log('==================');
  
  const workingKeys = results.filter(r => r.success);
  const failedKeys = results.filter(r => !r.success);
  
  console.log(`✅ Working keys: ${workingKeys.length}`);
  console.log(`❌ Failed keys: ${failedKeys.length}`);
  
  if (workingKeys.length > 0) {
    console.log('\n🎉 Working API Keys:');
    workingKeys.forEach((result, index) => {
      console.log(`${index + 1}. ${result.key} (${result.models} models available)`);
    });
    
    console.log('\n💡 Recommended: Use the first working key in your .env file:');
    console.log(`OPENAI_API_KEY=${workingKeys[0].key}`);
  } else {
    console.log('\n😞 No working keys found. Please check your API keys.');
  }
}

// Run the test
testAllKeys().catch(console.error); 