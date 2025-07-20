import fetch from 'node-fetch';

// Add your API keys here
const API_KEYS = [
  "AIzaSyDryuKLEW9WR0aOZUQhh4DJxFd75RXTBDc"
];

async function testModelsEndpoint(apiKey) {
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
      return { success: true, models: data.data.length };
    } else {
      const error = await response.text();
      return { success: false, error: error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testChatCompletion(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hello! This is a test message. Please respond with "Test successful" if you can read this.'
          }
        ],
        max_tokens: 50
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        response: data.choices[0]?.message?.content || 'No response content',
        usage: data.usage
      };
    } else {
      const error = await response.text();
      return { success: false, error: error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testOpenAIKey(apiKey) {
  console.log(`\n🔍 Testing key: ${apiKey.substring(0, 20)}...`);
  
  // Test 1: Models endpoint
  console.log('  📋 Testing models endpoint...');
  const modelsTest = await testModelsEndpoint(apiKey);
  
  if (!modelsTest.success) {
    console.log(`  ❌ Models test failed: ${modelsTest.error}`);
    return { success: false, key: apiKey, error: modelsTest.error };
  }
  
  console.log(`  ✅ Models test passed (${modelsTest.models} models available)`);
  
  // Test 2: Chat completion
  console.log('  💬 Testing chat completion...');
  const chatTest = await testChatCompletion(apiKey);
  
  if (!chatTest.success) {
    console.log(`  ❌ Chat test failed: ${chatTest.error}`);
    return { success: false, key: apiKey, error: chatTest.error };
  }
  
  console.log(`  ✅ Chat test passed: "${chatTest.response}"`);
  console.log(`  📊 Usage: ${chatTest.usage?.total_tokens || 'unknown'} tokens`);
  
  return { 
    success: true, 
    key: apiKey, 
    models: modelsTest.models,
    chatResponse: chatTest.response,
    usage: chatTest.usage
  };
}

async function testAllKeys() {
  console.log('🚀 Comprehensive OpenAI API Key Testing');
  console.log('=====================================\n');
  
  if (API_KEYS.length === 0) {
    console.log('❌ No API keys provided! Please add your keys to the API_KEYS array.');
    return;
  }
  
  const results = [];
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    console.log(`\n${i + 1}/${API_KEYS.length} Testing key: ${key.substring(0, 20)}...`);
    
    const result = await testOpenAIKey(key);
    results.push(result);
    
    // Delay between requests to avoid rate limiting
    if (i < API_KEYS.length - 1) {
      console.log('  ⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n📊 Final Results Summary:');
  console.log('==========================');
  
  const workingKeys = results.filter(r => r.success);
  const failedKeys = results.filter(r => !r.success);
  
  console.log(`✅ Working keys: ${workingKeys.length}`);
  console.log(`❌ Failed keys: ${failedKeys.length}`);
  
  if (workingKeys.length > 0) {
    console.log('\n🎉 Working API Keys:');
    workingKeys.forEach((result, index) => {
      console.log(`${index + 1}. ${result.key}`);
      console.log(`   Models: ${result.models}`);
      console.log(`   Chat Test: "${result.chatResponse}"`);
      console.log(`   Usage: ${result.usage?.total_tokens || 'unknown'} tokens`);
      console.log('');
    });
    
    console.log('💡 Recommended .env configuration:');
    console.log(`OPENAI_API_KEY=${workingKeys[0].key}`);
    console.log('\n🔧 To use this in CivicOS:');
    console.log('1. Copy the working key above');
    console.log('2. Add it to your .env file');
    console.log('3. Restart your backend server');
    console.log('4. The AI features will now use OpenAI!');
  } else {
    console.log('\n😞 No working keys found.');
    console.log('Please check:');
    console.log('- API key format (should start with sk-)');
    console.log('- API key validity');
    console.log('- Account billing status');
    console.log('- Rate limits');
  }
}

// Run the comprehensive test
testAllKeys().catch(console.error); 