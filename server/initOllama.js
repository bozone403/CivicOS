#!/usr/bin/env node

/**
 * CivicOS Ollama Initialization Script
 * This script ensures Ollama is properly set up in production
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

async function checkOllamaInstallation() {
  try {
    const { stdout } = await execAsync('which ollama');
    console.log('✅ Ollama found at:', stdout.trim());
    return true;
  } catch (error) {
    console.log('❌ Ollama not found, installing...');
    return false;
  }
}

async function installOllama() {
  try {
    console.log('📦 Installing Ollama...');
    await execAsync('curl -fsSL https://ollama.ai/install.sh | sh');
    console.log('✅ Ollama installed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to install Ollama:', error.message);
    return false;
  }
}

async function startOllamaService() {
  try {
    console.log('🔧 Starting Ollama service...');
    await execAsync('ollama serve > /dev/null 2>&1 &');
    
    // Wait for Ollama to be ready
    console.log('⏳ Waiting for Ollama to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return true;
  } catch (error) {
    console.error('❌ Failed to start Ollama service:', error.message);
    return false;
  }
}

async function checkOllamaHealth() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ollama service is healthy');
      return data;
    } else {
      console.error('❌ Ollama service responded with status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Ollama health check failed:', error.message);
    return null;
  }
}

async function pullModel(modelName = 'mistral:latest') {
  try {
    console.log(`📥 Pulling model: ${modelName}`);
    await execAsync(`ollama pull ${modelName}`);
    console.log(`✅ Model ${modelName} pulled successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to pull model ${modelName}:`, error.message);
    return false;
  }
}

async function testModel(modelName = 'mistral:latest') {
  try {
    console.log(`🧪 Testing model: ${modelName}`);
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: 'Hello, I am CivicOS AI assistant. How can I help you with Canadian civic engagement?',
        stream: false
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Model test successful:', data.response?.substring(0, 100) + '...');
      return true;
    } else {
      console.error('❌ Model test failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 CivicOS Ollama Initialization Starting...');
  
  // Check if Ollama is installed
  const isInstalled = await checkOllamaInstallation();
  if (!isInstalled) {
    const installSuccess = await installOllama();
    if (!installSuccess) {
      console.error('❌ Failed to install Ollama, exiting...');
      process.exit(1);
    }
  }
  
  // Start Ollama service
  const startSuccess = await startOllamaService();
  if (!startSuccess) {
    console.error('❌ Failed to start Ollama service, exiting...');
    process.exit(1);
  }
  
  // Check health
  const health = await checkOllamaHealth();
  if (!health) {
    console.error('❌ Ollama health check failed, exiting...');
    process.exit(1);
  }
  
  // Pull model if not available
  const modelName = process.env.OLLAMA_MODEL || 'mistral:latest';
  const models = health.models || [];
  const modelExists = models.some(m => m.name.includes(modelName.split(':')[0]));
  
  if (!modelExists) {
    const pullSuccess = await pullModel(modelName);
    if (!pullSuccess) {
      console.error(`❌ Failed to pull model ${modelName}, exiting...`);
      process.exit(1);
    }
  } else {
    console.log(`✅ Model ${modelName} already available`);
  }
  
  // Test the model
  const testSuccess = await testModel(modelName);
  if (!testSuccess) {
    console.error('❌ Model test failed, exiting...');
    process.exit(1);
  }
  
  console.log('🎉 CivicOS Ollama initialization complete!');
  console.log('🌐 Free AI Service is now available at:');
  console.log('   - Chatbot: /api/ai/chat');
  console.log('   - News Analysis: /api/ai/analyze-news');
  console.log('   - Policy Analysis: /api/ai/analyze-policy');
  console.log('   - Civic Insights: /api/ai/civic-insights');
  console.log('   - Health Check: /api/ai/health');
}

// Run the initialization
main().catch(error => {
  console.error('❌ Ollama initialization failed:', error);
  process.exit(1);
}); 