import fetch from 'node-fetch';
class AIService {
    ollamaUrl;
    model;
    isEnabled;
    isHealthy = false;
    lastHealthCheck = 0;
    healthCheckInterval = 30000; // Check every 30 seconds
    failureCount = 0;
    circuitBreakerThreshold = 5;
    constructor() {
        this.ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
        this.model = process.env.OLLAMA_MODEL || 'mistral:latest';
        this.isEnabled = process.env.AI_SERVICE_ENABLED === 'true';
        // Check Ollama health on startup with delay
        setTimeout(() => {
            this.checkHealth();
        }, 30000); // Wait 30 seconds before first health check
    }
    async checkHealth() {
        if (!this.isEnabled) {
            return;
        }
        // Circuit breaker: if too many failures, don't try for a while
        if (this.failureCount >= this.circuitBreakerThreshold) {
            const timeSinceLastCheck = Date.now() - this.lastHealthCheck;
            if (timeSinceLastCheck < 5 * 60 * 1000) { // Wait 5 minutes before retry
                return;
            }
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            const response = await fetch(`${this.ollamaUrl}/api/tags`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                this.isHealthy = true;
                this.failureCount = 0; // Reset failure count on success
            }
            else {
                this.isHealthy = false;
                this.failureCount++;
            }
        }
        catch (error) {
            this.isHealthy = false;
            this.failureCount++;
        }
        this.lastHealthCheck = Date.now();
    }
    async generateResponse(prompt) {
        // Re-check health before each request only if it's been a while
        const timeSinceLastCheck = Date.now() - this.lastHealthCheck;
        if (timeSinceLastCheck > this.healthCheckInterval) {
            await this.checkHealth();
        }
        // Return offline response if Ollama is not available or circuit breaker is open
        if (!this.isHealthy || this.failureCount >= this.circuitBreakerThreshold) {
            return this.getOfflineResponse(prompt);
        }
        try {
            const requestBody = {
                model: this.model,
                prompt: prompt,
                stream: false
            };
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // Reduced to 20 seconds
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
                this.failureCount++;
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            this.failureCount = 0; // Reset on success
            return data.response;
        }
        catch (error) {
            this.failureCount++;
            return this.getOfflineResponse(prompt);
        }
    }
    /**
     * CivicOS Chatbot - Specialized for civic engagement
     */
    async civicChatbot(message, context) {
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
    async analyzeNews(newsContent, context) {
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
        }
        catch {
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
    async analyzePolicy(policyContent, context) {
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
        }
        catch {
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
    async generateCivicInsights(data) {
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
        }
        catch {
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
    async isServiceHealthy() {
        await this.checkHealth();
        return this.isHealthy;
    }
    /**
     * Get service status
     */
    getServiceStatus() {
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
    getOfflineResponse(prompt) {
        // Check if this appears to be a crash/resource issue
        const isCrashRelated = this.failureCount >= this.circuitBreakerThreshold;
        if (isCrashRelated) {
            return `I apologize, but the AI service is currently unavailable due to server resource limitations. 
      
Your CivicOS platform is fully operational for all other features including:
• Browsing politicians and their voting records
• Reading bills and legislation 
• Accessing government transparency data
• Using the civic engagement tools
• Exploring procurement and finance data

For AI-powered analysis and chatbot features, please try again later or contact support about upgrading server resources.

In the meantime, you can find detailed information using the search and navigation tools throughout the platform.`;
        }
        // Provide context-aware responses based on prompt content
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('politician') || lowerPrompt.includes('mp') || lowerPrompt.includes('representative')) {
            return `I'm currently experiencing technical difficulties with AI processing. However, you can explore politician information directly using the Politicians section of CivicOS, where you'll find voting records, contact information, and detailed profiles.`;
        }
        if (lowerPrompt.includes('bill') || lowerPrompt.includes('legislation') || lowerPrompt.includes('law')) {
            return `While AI analysis is temporarily unavailable, you can browse current and historical bills in the Bills & Voting section, where you'll find summaries, voting results, and full text of legislation.`;
        }
        if (lowerPrompt.includes('vote') || lowerPrompt.includes('voting')) {
            return `AI voting analysis is currently offline, but you can access detailed voting records and participate in civic discussions through the Voting section and CivicSocial features.`;
        }
        if (lowerPrompt.includes('news') || lowerPrompt.includes('media')) {
            return `AI news analysis is temporarily unavailable. You can access curated news sources and fact-checking information in the News section of the platform.`;
        }
        // Default response
        return `I apologize, but I'm currently experiencing technical difficulties. Please try again later or contact support if the issue persists.
    
While AI features are offline, all other CivicOS functionality remains available including government data, politician information, bills, voting records, and civic engagement tools.`;
    }
}
export default new AIService();
