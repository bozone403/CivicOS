import pino from 'pino';
const logger = pino({ name: 'enhanced-ai-service' });
class EnhancedAiService {
    ollamaUrl;
    model;
    isOllamaAvailable = false;
    hfToken;
    hfModel;
    isHfAvailable = false;
    constructor() {
        this.ollamaUrl = process.env.OLLAMA_URL ?? '';
        this.model = process.env.OLLAMA_MODEL ?? '';
        this.hfToken = process.env.HUGGINGFACE_API_TOKEN;
        this.hfModel = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';
        this.isHfAvailable = Boolean(this.hfToken && this.hfModel);
        this.checkOllamaAvailability();
        logger.info('Enhanced AI Service initialized', {
            ollamaEnabled: !!this.ollamaUrl,
            ollamaModel: this.model,
            ollamaAvailable: this.isOllamaAvailable,
            hfEnabled: this.isHfAvailable,
            hfModel: this.hfModel
        });
    }
    async checkOllamaAvailability() {
        try {
            if (!this.ollamaUrl) {
                this.isOllamaAvailable = false;
                return;
            }
            if (typeof globalThis.fetch === 'undefined') {
                const nodeFetch = await import('node-fetch');
                globalThis.fetch = nodeFetch.default || nodeFetch;
            }
            const response = await fetch(`${this.ollamaUrl}/api/tags`);
            if (response.ok) {
                this.isOllamaAvailable = true;
                logger.info('Ollama is available and ready');
            }
            else {
                this.isOllamaAvailable = false;
                logger.warn('Ollama is not available, using mock data');
            }
        }
        catch (error) {
            this.isOllamaAvailable = false;
            logger.warn('Ollama connection failed, using mock data', { error: error instanceof Error ? error.message : String(error) });
        }
    }
    async generateResponse(message, context) {
        if (this.isOllamaAvailable) {
            try {
                return await this.generateOllamaResponse(message, context);
            }
            catch (error) {
                logger.error('Ollama generation failed, falling back to mock', { error: error instanceof Error ? error.message : String(error) });
                // Try HF before mock
                if (this.isHfAvailable) {
                    try {
                        return await this.generateHfResponse(message, context);
                    }
                    catch (e) {
                        logger.error('Hugging Face generation failed after Ollama fallback', { error: e instanceof Error ? e.message : String(e) });
                    }
                }
                return this.generateMockResponse(message, context);
            }
        }
        else {
            // Prefer HF if configured
            if (this.isHfAvailable) {
                try {
                    return await this.generateHfResponse(message, context);
                }
                catch (error) {
                    logger.error('Hugging Face generation failed, falling back to mock', { error: error instanceof Error ? error.message : String(error) });
                    return this.generateMockResponse(message, context);
                }
            }
            return this.generateMockResponse(message, context);
        }
    }
    async generateOllamaResponse(message, context) {
        const prompt = this.buildPrompt(message, context);
        try {
            const response = await fetch(`${this.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false
                })
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }
            const data = await response.json();
            return {
                response: data.response || 'No response generated',
                confidence: 0.9,
                provider: 'ollama',
                model: this.model,
                isMock: false
            };
        }
        catch (error) {
            logger.error('Ollama API call failed', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    async generateHfResponse(message, context) {
        if (!this.hfToken || !this.hfModel) {
            throw new Error('Hugging Face not configured');
        }
        const prompt = this.buildPrompt(message, context);
        try {
            const response = await fetch(`https://api-inference.huggingface.co/models/${this.hfModel}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.hfToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: prompt })
            });
            if (!response.ok) {
                throw new Error(`Hugging Face API error: ${response.status}`);
            }
            const data = await response.json();
            // Common HF text-generation output is an array with { generated_text }
            const generated = Array.isArray(data) ? (data[0]?.generated_text ?? '') : (data?.generated_text ?? '');
            return {
                response: typeof generated === 'string' && generated.length > 0 ? generated : 'No response generated',
                confidence: 0.8,
                provider: 'huggingface',
                model: this.hfModel,
                isMock: false
            };
        }
        catch (error) {
            logger.error('Hugging Face API call failed', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    buildPrompt(message, context) {
        let prompt = `You are CivicOS, a Canadian civic engagement AI assistant. Provide helpful, accurate, and non-partisan information about Canadian politics, government, and civic matters.

User question: ${message}

`;
        if (context) {
            if (context.politician) {
                prompt += `Context: Analyzing politician ${context.politician}\n`;
            }
            if (context.bill) {
                prompt += `Context: Analyzing bill ${context.bill}\n`;
            }
            if (context.topic) {
                prompt += `Context: Topic is ${context.topic}\n`;
            }
        }
        prompt += `\nPlease provide a comprehensive, factual response:`;
        return prompt;
    }
    generateMockResponse(message, context) {
        const mockResponses = {
            'trudeau': 'Justin Trudeau served as the 23rd Prime Minister of Canada from 2015-2025. He was replaced by Mark Carney in July 2025 and now serves as a Member of Parliament for Papineau. He remains active in the Liberal Party. For current information, please check the Politicians section of CivicOS.',
            'bills': 'Canadian bills go through a rigorous legislative process including multiple readings in Parliament, committee review, and Royal Assent. The process ensures thorough debate and consideration of all perspectives. You can view current bills in the Bills & Voting section.',
            'voting': 'Canadian citizens 18 and older can vote in federal elections. You can register to vote online or at your polling station. Elections Canada provides information about candidates and voting procedures. Check the Voting section for current electoral information.',
            'parliament': 'The Parliament of Canada consists of the House of Commons and Senate. The House of Commons has 338 elected Members of Parliament who represent constituencies across Canada. Visit the Politicians section to see current MPs.',
            'election': 'Federal elections in Canada are held every 4 years or when Parliament is dissolved. The next election is scheduled for 2025. Check the Elections section for current information and results.',
            'petition': 'Canadian citizens can create and sign petitions on various issues. Petitions with enough signatures may be presented in Parliament. Visit the Petitions section to see current petitions and create new ones.',
            'default': 'I\'m CivicOS, your Canadian civic engagement assistant. I can help you understand Canadian politics, government processes, and civic matters. For real-time information, please use the specific sections of the platform (Politicians, Bills, Elections, etc.). What would you like to know about?'
        };
        const lowerMessage = message.toLowerCase();
        let response = mockResponses.default;
        if (lowerMessage.includes('trudeau')) {
            response = mockResponses.trudeau;
        }
        else if (lowerMessage.includes('bill')) {
            response = mockResponses.bills;
        }
        else if (lowerMessage.includes('vote')) {
            response = mockResponses.voting;
        }
        else if (lowerMessage.includes('parliament')) {
            response = mockResponses.parliament;
        }
        else if (lowerMessage.includes('election')) {
            response = mockResponses.election;
        }
        else if (lowerMessage.includes('petition')) {
            response = mockResponses.petition;
        }
        return {
            response: response,
            confidence: 0.6,
            provider: 'mock',
            model: 'mock-civic-data',
            isMock: true
        };
    }
    async healthCheck() {
        if (this.isOllamaAvailable) {
            try {
                const response = await fetch(`${this.ollamaUrl}/api/tags`);
                if (response.ok) {
                    return {
                        service: true,
                        model: this.model,
                        message: 'Ollama is operational and ready',
                        provider: 'ollama',
                        isMock: false
                    };
                }
            }
            catch (error) {
                logger.error('Ollama health check failed', { error: error instanceof Error ? error.message : String(error) });
            }
        }
        if (this.isHfAvailable) {
            return {
                service: true,
                model: this.hfModel || 'unknown',
                message: 'Hugging Face Inference API available',
                provider: 'huggingface',
                isMock: false
            };
        }
        return {
            service: true,
            model: 'mock-civic-data',
            message: 'Using comprehensive mock data - no external AI configured. Configure OLLAMA_URL or HUGGINGFACE_API_TOKEN for real AI responses.',
            provider: 'mock',
            isMock: true
        };
    }
}
export const enhancedAiService = new EnhancedAiService();
