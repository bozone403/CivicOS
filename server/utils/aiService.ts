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
      // console.log removed for production
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.isHealthy = true;
        // console.log removed for production
      } else {
        this.isHealthy = false;
        // console.log removed for production
      }
    } catch (error) {
      this.isHealthy = false;
      // console.log removed for production
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    // Re-check health before each request
    if (!this.isHealthy) {
      await this.checkHealth();
    }

    // Return offline response if Ollama is not available
    if (!this.isHealthy) {
      // console.log removed for production
      return this.getOfflineResponse(prompt);
    }

    try {
      // console.log removed for production
      
      const requestBody: OllamaRequest = {
        model: this.model,
        prompt: prompt,
        stream: false
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OllamaResponse;
      return data.response;
    } catch (error) {
      // console.error removed for production
      return this.getOfflineResponse(prompt);
    }
  }

  /**
   * CivicOS Chatbot - Specialized for civic engagement
   */
  async civicChatbot(message: string, context?: {
    userLocation?: string;
    userInterests?: string[];
    previousMessages?: string[];
  }): Promise<string> {
    const systemPrompt = `You are CivicOS, a civic engagement AI assistant. You help users understand Canadian politics, government processes, and civic participation opportunities.

Key responsibilities:
- Explain Canadian political processes and institutions
- Help users understand their rights and responsibilities as citizens
- Provide information about voting, petitions, and civic participation
- Answer questions about government services and policies
- Encourage democratic participation and civic engagement
- Be informative, helpful, and non-partisan

Current context:
${context?.userLocation ? `User location: ${context.userLocation}` : ''}
${context?.userInterests ? `User interests: ${context.userInterests.join(', ')}` : ''}

Respond in a helpful, informative tone. Keep responses concise but comprehensive.`;

    const fullPrompt = `${systemPrompt}

User message: ${message}`;

    return this.generateResponse(fullPrompt);
  }

  /**
   * Analyze news content for bias and civic impact
   */
  async analyzeNews(newsContent: string, context?: {
    topic?: string;
    region?: string;
    politicalParty?: string;
  }): Promise<{
    summary: string;
    keyPoints: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    civicImpact: string;
    relatedIssues: string[];
  }> {
    const prompt = `Analyze this Canadian news article for bias, credibility, and civic impact:

${newsContent}

Context: ${context?.topic || 'General news'} | Region: ${context?.region || 'Canada'} | Party: ${context?.politicalParty || 'N/A'}

Provide analysis in JSON format with:
- summary: Brief summary
- keyPoints: Array of key points
- sentiment: positive/negative/neutral
- civicImpact: How this affects citizens
- relatedIssues: Array of related civic issues`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        summary: "News analysis temporarily unavailable",
        keyPoints: ["Analysis service is being optimized"],
        sentiment: "neutral",
        civicImpact: "Impact assessment pending",
        relatedIssues: ["Civic engagement", "Government transparency"]
      };
    }
  }

  /**
   * Analyze policy content
   */
  async analyzePolicy(policyContent: string, context?: {
    jurisdiction?: string;
    affectedGroups?: string[];
    budget?: string;
  }): Promise<{
    summary: string;
    pros: string[];
    cons: string[];
    impact: string;
    recommendations: string[];
  }> {
    const prompt = `Analyze this Canadian policy for civic impact:

${policyContent}

Context: Jurisdiction: ${context?.jurisdiction || 'Federal'} | Affected: ${context?.affectedGroups?.join(', ') || 'General public'} | Budget: ${context?.budget || 'N/A'}

Provide analysis in JSON format with:
- summary: Policy summary
- pros: Array of benefits
- cons: Array of concerns
- impact: Civic impact assessment
- recommendations: Array of recommendations`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        summary: "Policy analysis temporarily unavailable",
        pros: ["Analysis in progress"],
        cons: ["Review pending"],
        impact: "Impact assessment pending",
        recommendations: ["Continue monitoring policy developments"]
      };
    }
  }

  /**
   * Generate civic insights from user data
   */
  async generateCivicInsights(data: {
    userActivity?: any[];
    regionalStats?: any[];
    trendingTopics?: string[];
  }): Promise<{
    insights: string[];
    recommendations: string[];
    trends: string[];
  }> {
    const prompt = `Generate civic insights based on this data:

User Activity: ${JSON.stringify(data.userActivity || [])}
Regional Stats: ${JSON.stringify(data.regionalStats || [])}
Trending Topics: ${data.trendingTopics?.join(', ') || 'None'}

Provide insights in JSON format with:
- insights: Array of civic insights
- recommendations: Array of recommendations
- trends: Array of emerging trends`;

    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return {
        insights: ["Civic engagement patterns are being analyzed"],
        recommendations: ["Continue participating in civic activities"],
        trends: ["Civic participation trends are being monitored"]
      };
    }
  }

  /**
   * Health check for AI service
   */
  async isServiceHealthy(): Promise<boolean> {
    await this.checkHealth();
    return this.isHealthy;
  }

  /**
   * Get service status
   */
  getServiceStatus(): { enabled: boolean; healthy: boolean; url: string; model: string } {
    return {
      enabled: this.isEnabled,
      healthy: this.isHealthy,
      url: this.ollamaUrl,
      model: this.model
    };
  }

  /**
   * Get offline response when Ollama is not available
   */
  private getOfflineResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return "Hello! I'm the CivicOS AI assistant. I'm currently operating in offline mode while our Ollama service is being optimized. How can I help you with civic engagement today?";
    }
    
    if (lowerPrompt.includes('vote') || lowerPrompt.includes('election')) {
      return "Voting is a fundamental civic right in Canada. You can register to vote through Elections Canada. Make sure to bring valid ID when voting. For more information, visit elections.ca";
    }
    
    if (lowerPrompt.includes('petition') || lowerPrompt.includes('petition')) {
      return "Petitions are a great way to engage with government. You can create or sign petitions through the House of Commons website. Make sure petitions follow parliamentary guidelines.";
    }
    
    if (lowerPrompt.includes('bill') || lowerPrompt.includes('legislation')) {
      return "Bills and legislation can be tracked through the Parliament of Canada website. You can search for specific bills and follow their progress through the legislative process.";
    }
    
    if (lowerPrompt.includes('politician') || lowerPrompt.includes('mp')) {
      return "You can contact your Member of Parliament through the House of Commons website. MPs represent your riding and can help with federal government matters.";
    }
    
    return "Thank you for your question about civic engagement. I'm currently operating in offline mode while our Ollama service is being optimized. I'm here to help with Canadian civic information and can direct you to relevant government resources.";
  }
}

export default new AIService(); 