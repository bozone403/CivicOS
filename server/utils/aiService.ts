import fetch from 'node-fetch';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
}

class AIService {
  private ollamaUrl: string;
  private model: string;
  private isEnabled: boolean;
  private isHealthy: boolean = false;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    this.model = process.env.OLLAMA_MODEL || 'mistral:latest';
    this.isEnabled = process.env.AI_SERVICE_ENABLED === 'true';
    
    // Check Ollama health on startup
    this.checkHealth();
  }

  private async checkHealth(): Promise<void> {
    if (!this.isEnabled) {
      console.log('🤖 AI Service disabled');
      return;
    }

    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: 'GET'
      });
      
      if (response.ok) {
        this.isHealthy = true;
        console.log('✅ Ollama is healthy and ready');
      } else {
        this.isHealthy = false;
        console.log('❌ Ollama health check failed');
      }
    } catch (error) {
      this.isHealthy = false;
      console.log('❌ Ollama health check error:', error);
    }
  }

  private getFallbackResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Provide contextually appropriate fallback responses
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return "Hello! I'm the CivicOS AI assistant. I'm currently operating in fallback mode while our AI service is being optimized. How can I help you with civic engagement today?";
    }
    
    if (lowerPrompt.includes('civic') || lowerPrompt.includes('government') || lowerPrompt.includes('politics')) {
      return "I'm here to help with civic engagement and government transparency. While our AI service is being optimized, I can still assist with general civic information and direct you to relevant resources.";
    }
    
    if (lowerPrompt.includes('vote') || lowerPrompt.includes('election')) {
      return "Voting is a fundamental civic right. I can help you understand the voting process and find information about elections. Please check your local election office for specific details.";
    }
    
    if (lowerPrompt.includes('bill') || lowerPrompt.includes('legislation')) {
      return "I can help you find information about bills and legislation. You can search for specific bills on government websites or contact your representatives for more details.";
    }
    
    return "Thank you for your question. I'm currently operating in fallback mode while our AI service is being optimized. I'm here to help with civic engagement and government transparency. Please try again later for full AI capabilities.";
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!this.isEnabled) {
      return this.getFallbackResponse(prompt);
    }

    // Re-check health before each request
    if (!this.isHealthy) {
      await this.checkHealth();
    }

    if (!this.isHealthy) {
      console.log('🤖 Using fallback response - Ollama unavailable');
      return this.getFallbackResponse(prompt);
    }

    try {
      console.log(`🤖 Calling Ollama Mistral at ${this.ollamaUrl} with model ${this.model}`);
      
      const requestBody: OllamaRequest = {
        model: this.model,
        prompt: prompt,
        stream: false
      };

      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Ollama API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as OllamaResponse;
      console.log('✅ Ollama response generated successfully');
      return data.response;

    } catch (error) {
      console.log('Error calling Ollama Mistral:', error);
      this.isHealthy = false; // Mark as unhealthy for next request
      return this.getFallbackResponse(prompt);
    }
  }

  async isServiceHealthy(): Promise<boolean> {
    if (!this.isEnabled) return false;
    
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: 'GET'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  getServiceStatus(): { enabled: boolean; healthy: boolean; url: string; model: string } {
    return {
      enabled: this.isEnabled,
      healthy: this.isHealthy,
      url: this.ollamaUrl,
      model: this.model
    };
  }
}

export default new AIService(); 