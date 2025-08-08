#!/usr/bin/env node

/**
 * Ollama Initialization and Health Monitoring Script
 * This script helps ensure Ollama is properly set up and running
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class OllamaManager {
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'mistral:latest';
        this.maxRetries = 5;
        this.retryDelay = 10000; // 10 seconds
    }

    log(level, message, data = '') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        console.log(logMessage + (data ? ` ${data}` : ''));
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checkOllamaHealth() {
        // Ensure fetch is available in this environment
        if (typeof fetch === 'undefined') {
            global.fetch = require('node-fetch');
        }
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                this.log('info', 'Ollama health check passed', `Models: ${data.models?.length || 0}`);
                return true;
            } else {
                this.log('warn', `Ollama health check failed with status ${response.status}`);
                return false;
            }
        } catch (error) {
            this.log('warn', 'Ollama health check failed', error.message);
            return false;
        }
    }

    async checkModelAvailability() {
        if (typeof fetch === 'undefined') {
            global.fetch = require('node-fetch');
        }
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                const models = data.models || [];
                const hasModel = models.some(model => 
                    model.name === this.model || 
                    model.name.startsWith(this.model.split(':')[0])
                );
                
                this.log('info', `Model check: ${hasModel ? 'Found' : 'Not found'}`, 
                    `Looking for: ${this.model}, Available: ${models.map(m => m.name).join(', ')}`);
                return hasModel;
            }
        } catch (error) {
            this.log('error', 'Model availability check failed', error.message);
        }
        return false;
    }

    async pullModel() {
        this.log('info', `Attempting to pull model: ${this.model}`);
        
        return new Promise((resolve, reject) => {
            const pullProcess = spawn('curl', [
                '-X', 'POST',
                `${this.baseUrl}/api/pull`,
                '-H', 'Content-Type: application/json',
                '-d', JSON.stringify({ name: this.model })
            ], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let hasStarted = false;

            pullProcess.stdout.on('data', (data) => {
                output += data.toString();
                const lines = data.toString().trim().split('\n');
                
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const json = JSON.parse(line);
                            if (json.status) {
                                if (!hasStarted && json.status.includes('pulling')) {
                                    hasStarted = true;
                                    this.log('info', 'Model download started');
                                }
                                if (json.completed && json.total) {
                                    const percent = Math.round((json.completed / json.total) * 100);
                                    this.log('info', `Download progress: ${percent}%`);
                                }
                                if (json.status === 'success') {
                                    this.log('info', 'Model download completed successfully');
                                }
                            }
                        } catch (e) {
                            // Not JSON, just log the line
                            this.log('debug', 'Pull output:', line.trim());
                        }
                    }
                }
            });

            pullProcess.stderr.on('data', (data) => {
                this.log('warn', 'Pull stderr:', data.toString().trim());
            });

            pullProcess.on('close', (code) => {
                if (code === 0) {
                    this.log('info', 'Model pull completed');
                    resolve(true);
                } else {
                    this.log('error', `Model pull failed with exit code ${code}`);
                    resolve(false);
                }
            });

            pullProcess.on('error', (error) => {
                this.log('error', 'Model pull process error', error.message);
                reject(error);
            });

            // Set a timeout for the pull operation (20 minutes)
            setTimeout(() => {
                pullProcess.kill('SIGTERM');
                this.log('warn', 'Model pull timed out after 20 minutes');
                resolve(false);
            }, 20 * 60 * 1000);
        });
    }

    async testModel() {
        this.log('info', 'Testing model functionality...');
        
        try {
            if (typeof fetch === 'undefined') {
                global.fetch = require('node-fetch');
            }
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: 'Hello, respond with "AI service is working"',
                    stream: false
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.log('info', 'Model test successful', `Response: ${data.response?.substring(0, 100)}...`);
                return true;
            } else {
                this.log('warn', `Model test failed with status ${response.status}`);
                return false;
            }
        } catch (error) {
            this.log('error', 'Model test failed', error.message);
            return false;
        }
    }

    async waitForOllama(maxWaitSeconds = 120) {
        this.log('info', `Waiting for Ollama to be ready (max ${maxWaitSeconds}s)...`);
        
        for (let i = 0; i < maxWaitSeconds; i += 5) {
            if (await this.checkOllamaHealth()) {
                this.log('info', `Ollama is ready after ${i}s`);
                return true;
            }
            
            if (i % 30 === 0) {
                this.log('info', `Still waiting for Ollama... (${i}/${maxWaitSeconds}s)`);
            }
            
            await this.sleep(5000);
        }
        
        this.log('error', `Ollama failed to start after ${maxWaitSeconds}s`);
        return false;
    }

    async getSystemInfo() {
        this.log('info', 'Gathering system information...');
        
        return new Promise((resolve) => {
            exec('uname -a && free -h && df -h /', (error, stdout, stderr) => {
                if (error) {
                    this.log('warn', 'Failed to get system info', error.message);
                    resolve('System info unavailable');
                } else {
                    const info = stdout.trim();
                    this.log('info', 'System info gathered');
                    resolve(info);
                }
            });
        });
    }

    async initialize() {
        this.log('info', '🚀 Starting Ollama initialization...');
        
        // Get system information
        await this.getSystemInfo();
        
        // Wait for Ollama to be available
        const isOllamaReady = await this.waitForOllama();
        
        if (!isOllamaReady) {
            this.log('error', 'Ollama is not available - AI service will use fallbacks');
            return false;
        }

        // Check if model is already available
        const hasModel = await this.checkModelAvailability();
        
        if (!hasModel) {
            this.log('info', 'Model not found, attempting to download...');
            const pullSuccess = await this.pullModel();
            
            if (!pullSuccess) {
                this.log('error', 'Failed to download model - AI service will use fallbacks');
                return false;
            }
            
            // Wait a bit for model to be fully loaded
            await this.sleep(5000);
        }

        // Test the model
        const testSuccess = await this.testModel();
        
        if (testSuccess) {
            this.log('info', '🎉 Ollama initialization completed successfully!');
            return true;
        } else {
            this.log('warn', 'Model test failed - AI service may have limited functionality');
            return false;
        }
    }

    async healthCheck() {
        this.log('info', 'Running Ollama health check...');
        
        const isHealthy = await this.checkOllamaHealth();
        const hasModel = await this.checkModelAvailability();
        
        this.log('info', `Health check results: Service ${isHealthy ? 'UP' : 'DOWN'}, Model ${hasModel ? 'AVAILABLE' : 'MISSING'}`);
        
        return {
            service: isHealthy,
            model: hasModel,
            timestamp: new Date().toISOString()
        };
    }
}

// Main execution
async function main() {
    const manager = new OllamaManager();
    
    const command = process.argv[2] || 'init';
    
    try {
        switch (command) {
            case 'init':
                const success = await manager.initialize();
                process.exit(success ? 0 : 1);
                break;
                
            case 'health':
                const health = await manager.healthCheck();
                console.log(JSON.stringify(health, null, 2));
                process.exit(health.service && health.model ? 0 : 1);
                break;
                
            case 'pull':
                const pullResult = await manager.pullModel();
                process.exit(pullResult ? 0 : 1);
                break;
                
            default:
                // console.log removed for production
                process.exit(1);
        }
    } catch (error) {
        manager.log('error', 'Unexpected error', error.message);
        process.exit(1);
    }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

if (require.main === module) {
    main();
}

module.exports = OllamaManager; 