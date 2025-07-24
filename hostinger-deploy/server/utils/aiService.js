import pino from 'pino';
import { mockAiService } from './mockAiService.js';
const logger = pino({ name: 'ai-service' });
class AiService {
    config;
    useMockAi;
    constructor() {
        this.config = {
            baseUrl: 'disabled', // Ollama permanently disabled
            model: 'mock-ai',
            timeout: 30000,
            retries: 3
        };
        // Force mock AI permanently - no external AI dependencies
        this.useMockAi = true;
        logger.info('AI Service initialized with MOCK data only - Ollama permanently disabled');
    }
    async healthCheck() {
        return {
            service: true,
            model: true,
            message: 'Mock AI service is operational with comprehensive Canadian political data (Ollama disabled)'
        };
    }
    async generateResponse(prompt, context) {
        // Always use mock AI - no external dependencies
        return this.generateMockResponse(prompt, context);
    }
    generateMockResponse(prompt, context) {
        const lowerPrompt = prompt.toLowerCase();
        // Politician analysis
        if (lowerPrompt.includes('politician') || lowerPrompt.includes('trudeau') || lowerPrompt.includes('poilievre') || lowerPrompt.includes('singh') || lowerPrompt.includes('carney')) {
            const politicianId = this.extractPoliticianId(prompt);
            const result = mockAiService.generatePoliticianAnalysis(politicianId);
            return result.response;
        }
        // Bill analysis
        if (lowerPrompt.includes('bill') || lowerPrompt.includes('c-21') || lowerPrompt.includes('c-60') || lowerPrompt.includes('c-56') || lowerPrompt.includes('legislation')) {
            const billId = this.extractBillId(prompt);
            const result = mockAiService.generateBillSummary(billId);
            return result.response;
        }
        // Fact checking
        if (lowerPrompt.includes('fact check') || lowerPrompt.includes('housing crisis') || lowerPrompt.includes('inflation')) {
            const topic = this.extractFactCheckTopic(prompt);
            const result = mockAiService.factCheckClaim(topic);
            return result.response;
        }
        // Economic questions
        if (lowerPrompt.includes('economy') || lowerPrompt.includes('budget') || lowerPrompt.includes('deficit') || lowerPrompt.includes('inflation')) {
            const result = mockAiService.generateEconomicSummary();
            return result.response;
        }
        // Current events
        if (lowerPrompt.includes('current') || lowerPrompt.includes('news') || lowerPrompt.includes('today')) {
            const result = mockAiService.generateChatbotResponse(prompt);
            return result.response;
        }
        // General chatbot response
        const result = mockAiService.generateChatbotResponse(prompt);
        return result.response;
    }
    extractPoliticianId(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('carney'))
            return 'mark-carney';
        if (lowerPrompt.includes('trudeau'))
            return 'justin-trudeau';
        if (lowerPrompt.includes('poilievre'))
            return 'pierre-poilievre';
        if (lowerPrompt.includes('singh'))
            return 'jagmeet-singh';
        if (lowerPrompt.includes('blanchet'))
            return 'yves-francois-blanchet';
        if (lowerPrompt.includes('may'))
            return 'elizabeth-may';
        return 'mark-carney'; // Default to current PM
    }
    extractBillId(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('c-60'))
            return 'C-60';
        if (lowerPrompt.includes('c-56'))
            return 'C-56';
        if (lowerPrompt.includes('c-21'))
            return 'C-21';
        if (lowerPrompt.includes('c-61'))
            return 'C-61';
        return 'C-60'; // Default to climate finance bill
    }
    extractFactCheckTopic(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('carney'))
            return 'carney-transition';
        if (lowerPrompt.includes('housing'))
            return 'housing-crisis';
        if (lowerPrompt.includes('inflation'))
            return 'inflation-rates';
        if (lowerPrompt.includes('deficit'))
            return 'federal-deficit';
        return 'carney-transition';
    }
    // Offline response for any remaining edge cases
    getOfflineResponse(prompt) {
        return `I understand you're asking about "${prompt}". I'm currently operating with comprehensive Canadian political data from July 2025. Here's what I can help with:

**Current Information Available:**
• Prime Minister Mark Carney and all federal politicians
• Current bills: C-60 (Climate Finance), C-56 (Housing), C-21 (Firearms)
• Economic data: GDP, inflation, housing prices, unemployment
• Government transition details from Trudeau to Carney era
• News analysis and fact-checking

**For specific questions, try:**
• "Who is the current Prime Minister?"
• "What's in Bill C-60?"
• "How is the Canadian economy doing?"
• "What changed with Mark Carney becoming PM?"

Would you like me to help with any of these topics?`;
    }
}
export const aiService = new AiService();
