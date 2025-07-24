#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// console.log removed for production

// Check if Ollama is installed
function checkOllamaInstallation() {
  return new Promise((resolve) => {
    exec('ollama --version', (error, stdout, stderr) => {
      if (error) {
        // console.log removed for production
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
  // console.log removed for production
  
  return new Promise((resolve, reject) => {
    const installCommand = process.platform === 'win32' 
      ? 'powershell -c "irm https://ollama.ai/install.ps1 | iex"'
      : 'curl -fsSL https://ollama.ai/install.sh | sh';
    
    exec(installCommand, (error, stdout, stderr) => {
      if (error) {
        // console.error removed for production
        reject(error);
      } else {
        // console.log removed for production
        resolve();
      }
    });
  });
}

// Start Ollama service
function startOllama() {
  return new Promise((resolve, reject) => {
    // console.log removed for production
    
    exec('ollama serve', (error, stdout, stderr) => {
      if (error) {
        // console.error removed for production
        reject(error);
      } else {
        // console.log removed for production
        resolve();
      }
    });
  });
}

// Download Mistral model
function downloadMistral() {
  return new Promise((resolve, reject) => {
    // console.log removed for production
    
    exec('ollama pull mistral:latest', (error, stdout, stderr) => {
      if (error) {
        // console.error removed for production
        reject(error);
      } else {
        // console.log removed for production
        resolve();
      }
    });
  });
}

// Test Mistral model
function testMistral() {
  return new Promise((resolve, reject) => {
    // console.log removed for production
    
    const testPrompt = 'Hello, this is a test of the CivicOS AI system. Please respond with "CivicOS AI is ready!"';
    
    exec(`echo '${testPrompt}' | ollama run mistral:latest`, (error, stdout, stderr) => {
      if (error) {
        // console.error removed for production
        reject(error);
      } else {
        // console.log removed for production
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
        // console.error removed for production
        resolve(false);
      } else {
        const models = stdout.split('\n').filter(line => line.includes('mistral'));
        if (models.length > 0) {
          // console.log removed for production
          resolve(true);
        } else {
          // console.log removed for production
          resolve(false);
        }
      }
    });
  });
}

// Main initialization function
async function initializeOllama() {
  try {
    // console.log removed for production
    const isInstalled = await checkOllamaInstallation();
    
    if (!isInstalled) {
      await installOllama();
    }
    
    // Start Ollama service in background
    // console.log removed for production
    const ollamaProcess = exec('ollama serve', (error) => {
      if (error) {
        // console.error removed for production
      }
    });
    
    // Wait a moment for service to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if Mistral is available
    // console.log removed for production
    const modelAvailable = await checkModelAvailability();
    
    if (!modelAvailable) {
      // console.log removed for production
      await downloadMistral();
    }
    
    // Test the model
    await testMistral();
    
    // console.log removed for production
    // console.log removed for production
    
    // Keep the process running
    process.on('SIGINT', () => {
      // console.log removed for production
      ollamaProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    // console.error removed for production
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initializeOllama();
}

module.exports = { initializeOllama }; 