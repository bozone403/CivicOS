#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing Ollama for CivicOS Production...');

// Check if Ollama is installed
function checkOllamaInstallation() {
  return new Promise((resolve) => {
    exec('ollama --version', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Ollama not found. Installing...');
        resolve(false);
      } else {
        console.log(`✅ Ollama found: ${stdout.trim()}`);
        resolve(true);
      }
    });
  });
}

// Install Ollama if not present
async function installOllama() {
  console.log('📦 Installing Ollama...');
  
  return new Promise((resolve, reject) => {
    const installCommand = process.platform === 'win32' 
      ? 'powershell -c "irm https://ollama.ai/install.ps1 | iex"'
      : 'curl -fsSL https://ollama.ai/install.sh | sh';
    
    exec(installCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to install Ollama:', error);
        reject(error);
      } else {
        console.log('✅ Ollama installed successfully');
        resolve();
      }
    });
  });
}

// Start Ollama service
function startOllama() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Starting Ollama service...');
    
    exec('ollama serve', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to start Ollama service:', error);
        reject(error);
      } else {
        console.log('✅ Ollama service started');
        resolve();
      }
    });
  });
}

// Download Mistral model
function downloadMistral() {
  return new Promise((resolve, reject) => {
    console.log('📥 Downloading Mistral model...');
    
    exec('ollama pull mistral:latest', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to download Mistral:', error);
        reject(error);
      } else {
        console.log('✅ Mistral model downloaded successfully');
        resolve();
      }
    });
  });
}

// Test Mistral model
function testMistral() {
  return new Promise((resolve, reject) => {
    console.log('🧪 Testing Mistral model...');
    
    const testPrompt = 'Hello, this is a test of the CivicOS AI system. Please respond with "CivicOS AI is ready!"';
    
    exec(`echo '${testPrompt}' | ollama run mistral:latest`, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Mistral test failed:', error);
        reject(error);
      } else {
        console.log('✅ Mistral model test successful');
        console.log('📝 Test response:', stdout.trim());
        resolve();
      }
    });
  });
}

// Check model availability
function checkModelAvailability() {
  return new Promise((resolve) => {
    exec('ollama list', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to list models:', error);
        resolve(false);
      } else {
        const models = stdout.split('\n').filter(line => line.includes('mistral'));
        if (models.length > 0) {
          console.log('✅ Mistral model found:', models[0]);
          resolve(true);
        } else {
          console.log('❌ Mistral model not found');
          resolve(false);
        }
      }
    });
  });
}

// Main initialization function
async function initializeOllama() {
  try {
    console.log('🔍 Checking Ollama installation...');
    const isInstalled = await checkOllamaInstallation();
    
    if (!isInstalled) {
      await installOllama();
    }
    
    // Start Ollama service in background
    console.log('🔄 Starting Ollama service...');
    const ollamaProcess = exec('ollama serve', (error) => {
      if (error) {
        console.error('❌ Ollama service error:', error);
      }
    });
    
    // Wait a moment for service to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if Mistral is available
    console.log('🔍 Checking Mistral model availability...');
    const modelAvailable = await checkModelAvailability();
    
    if (!modelAvailable) {
      console.log('📥 Mistral model not found, downloading...');
      await downloadMistral();
    }
    
    // Test the model
    await testMistral();
    
    console.log('🎉 Ollama initialization complete!');
    console.log('📋 CivicOS AI is ready for production use.');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down Ollama...');
      ollamaProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Ollama initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initializeOllama();
}

module.exports = { initializeOllama }; 