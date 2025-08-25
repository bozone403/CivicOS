import axios from 'axios';
/**
 * Fallback AI Service - Provides reliable AI responses when Ollama is unavailable
 * Uses multiple fallback strategies to ensure AI functionality is always available
 */
export class FallbackAIService {
    baseUrl;
    apiKey;
    isAvailable = true;
    constructor() {
        // Use environment variables or defaults
        this.baseUrl = process.env.FALLBACK_AI_URL || 'https://api.openai.com/v1';
        this.apiKey = process.env.FALLBACK_AI_KEY || '';
        this.checkAvailability();
    }
    /**
     * Check if the fallback AI service is available
     */
    async checkAvailability() {
        try {
            if (!this.apiKey) {
                this.isAvailable = false;
                return;
            }
            const response = await axios.get(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            this.isAvailable = response.status === 200;
        }
        catch (error) {
            this.isAvailable = false;
        }
    }
    /**
     * Generate AI response using fallback service
     */
    async generateResponse(prompt, options) {
        try {
            if (!this.isAvailable || !this.apiKey) {
                return this.getOfflineResponse(prompt);
            }
            const request = {
                prompt,
                model: options?.model || 'gpt-3.5-turbo',
                temperature: options?.temperature || 0.7,
                maxTokens: options?.maxTokens || 500
            };
            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                model: request.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are CivicOS, a civic engagement AI assistant. You help users understand Canadian politics, government processes, and civic participation opportunities. Be informative, helpful, and non-partisan.'
                    },
                    {
                        role: 'user',
                        content: request.prompt
                    }
                ],
                temperature: request.temperature,
                max_tokens: request.maxTokens
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            return response.data.choices?.[0]?.message?.content || this.getOfflineResponse(prompt);
        }
        catch (error) {
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

Respond in a helpful, informative manner.`;
        const fullPrompt = `${systemPrompt}

User: ${message}

CivicOS:`;
        return this.generateResponse(fullPrompt, { temperature: 0.7 });
    }
    /**
     * News Analysis - Analyze political news and provide insights
     */
    async analyzeNews(newsContent, context) {
        const systemPrompt = `You are a civic intelligence analyst. Analyze the following news content and provide insights relevant to Canadian civic engagement.

Provide your analysis in this exact JSON format:
{
  "summary": "Brief summary of the news",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "sentiment": "positive|negative|neutral",
  "civicImpact": "How this affects civic engagement",
  "relatedIssues": ["Issue 1", "Issue 2"]
}

Context:
${context?.topic ? `Topic: ${context.topic}` : ''}
${context?.region ? `Region: ${context.region}` : ''}
${context?.politicalParty ? `Political Party: ${context.politicalParty}` : ''}

Analyze this news content: ${newsContent}`;
        try {
            const response = await this.generateResponse(systemPrompt, { temperature: 0.5 });
            const analysis = JSON.parse(response);
            return {
                summary: analysis.summary || 'Analysis unavailable',
                keyPoints: analysis.keyPoints || [],
                sentiment: analysis.sentiment || 'neutral',
                civicImpact: analysis.civicImpact || 'Impact analysis unavailable',
                relatedIssues: analysis.relatedIssues || []
            };
        }
        catch (error) {
            return {
                summary: 'News analysis temporarily unavailable',
                keyPoints: ['Analysis service is down'],
                sentiment: 'neutral',
                civicImpact: 'Unable to determine civic impact',
                relatedIssues: []
            };
        }
    }
    /**
     * Get offline response when AI service is unavailable
     */
    getOfflineResponse(prompt) {
        const promptLower = prompt.toLowerCase();
        // Provide helpful offline responses based on common queries
        if (promptLower.includes('vote') || promptLower.includes('election')) {
            return "I can help you with voting information! In Canada, you can vote in federal, provincial, and municipal elections. To vote, you need to be 18+ and a Canadian citizen. You can register online or at your polling station. For more details, visit elections.ca or contact your local Elections Canada office.";
        }
        if (promptLower.includes('bill') || promptLower.includes('legislation')) {
            return "I can help you understand Canadian legislation! Bills go through several stages: introduction, committee review, readings, and royal assent. You can track bills at parl.ca/legisinfo. To get involved, contact your MP or submit comments during committee hearings.";
        }
        if (promptLower.includes('politician') || promptLower.includes('mp')) {
            return "I can help you find information about Canadian politicians! You can search for MPs, MLAs, and municipal representatives. Each has voting records, contact information, and policy positions. Visit parl.ca for federal politicians or your provincial legislature website.";
        }
        if (promptLower.includes('petition') || promptLower.includes('petition')) {
            return "I can help you with petitions! You can create and sign petitions on CivicOS. Petitions can be directed to Parliament, provincial legislatures, or municipal councils. Effective petitions are clear, specific, and include supporting evidence.";
        }
        if (promptLower.includes('rights') || promptLower.includes('charter')) {
            return "I can help you understand your rights! The Canadian Charter of Rights and Freedoms protects fundamental rights like freedom of expression, assembly, and religion. If you believe your rights have been violated, you can file a complaint with the Canadian Human Rights Commission.";
        }
        return "I'm currently experiencing technical difficulties, but I'm here to help with Canadian civic engagement! I can assist with voting, legislation, politicians, petitions, and your rights. Please try again in a few moments, or visit our help section for immediate assistance.";
    }
    /**
     * Health check for the AI service
     */
    async healthCheck() {
        try {
            await this.checkAvailability();
            if (this.isAvailable) {
                return {
                    status: 'online',
                    service: 'fallback-ai',
                    models: ['gpt-3.5-turbo', 'gpt-4'],
                    message: 'AI service is operational',
                    timestamp: new Date().toISOString()
                };
            }
            else {
                return {
                    status: 'offline',
                    service: 'fallback-ai',
                    models: [],
                    message: 'AI service is unavailable, using offline responses',
                    timestamp: new Date().toISOString()
                };
            }
        }
        catch (error) {
            return {
                status: 'degraded',
                service: 'fallback-ai',
                models: [],
                message: 'AI service health check failed',
                timestamp: new Date().toISOString()
            };
        }
    }
}
// Export singleton instance
export const fallbackAiService = new FallbackAIService();
