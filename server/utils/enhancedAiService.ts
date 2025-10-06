import pino from 'pino';
import { GoogleGenAI } from '@google/genai';

const logger = pino({ name: 'enhanced-ai-service' });

interface AiResponse {
  response: string;
  confidence: number;
  sources?: string[];
  provider: string;
  model: string;
  isMock: boolean;
}

interface AiHealth {
  service: boolean;
  model?: string;
  message: string;
  provider: string;
  isMock: boolean;
}

class EnhancedAiService {
  private geminiClient: GoogleGenAI | null = null;
  private isGeminiAvailable: boolean = false;
  private model: string = 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (apiKey) {
      try {
        this.geminiClient = new GoogleGenAI({ apiKey });
        this.isGeminiAvailable = true;
        logger.info('Enhanced AI Service initialized', { 
          provider: 'Google Gemini',
          model: this.model,
          available: true
        });
      } catch (error) {
        logger.error('Failed to initialize Gemini client', { error: error instanceof Error ? error.message : String(error) });
        this.isGeminiAvailable = false;
      }
    } else {
      logger.warn('GEMINI_API_KEY not found, using mock responses');
      this.isGeminiAvailable = false;
    }
  }

  async generateResponse(message: string, context?: any): Promise<AiResponse> {
    if (this.isGeminiAvailable && this.geminiClient) {
      try {
        return await this.generateGeminiResponse(message, context);
      } catch (error) {
        logger.error('Gemini generation failed, falling back to mock', { 
          error: error instanceof Error ? error.message : String(error) 
        });
        return this.generateMockResponse(message, context);
      }
    }
    return this.generateMockResponse(message, context);
  }

  private async generateGeminiResponse(message: string, context?: any): Promise<AiResponse> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const prompt = this.buildPrompt(message, context);
    
    const response = await this.geminiClient.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: `You are CivicOS, an expert Canadian civic engagement AI assistant. You provide accurate, non-partisan information about Canadian politics, government, legislation, and civic processes. Your responses should be:
- Factual and well-sourced
- Non-partisan and balanced
- Helpful and actionable
- Focused on Canadian federal, provincial, and municipal governance
- Encouraging civic participation

When discussing politicians, bills, or policies, remain objective and present multiple perspectives when relevant.`,
      }
    });

    const text = response.text || 'I apologize, but I could not generate a response. Please try again.';

    return {
      response: text,
      confidence: 0.95,
      provider: 'Google Gemini',
      model: this.model,
      isMock: false,
      sources: ['Google Gemini AI']
    };
  }

  private buildPrompt(message: string, context?: any): string {
    let prompt = `User question: ${message}\n\n`;

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
      if (context.userLocation) {
        prompt += `User location: ${context.userLocation}\n`;
      }
    }

    prompt += `\nPlease provide a comprehensive, factual response about Canadian civic matters:`;

    return prompt;
  }

  private generateMockResponse(message: string, context?: any): AiResponse {
    const mockResponses = {
      'trudeau': 'Justin Trudeau served as the 23rd Prime Minister of Canada from 2015-2025. He was replaced by Mark Carney in July 2025 and now serves as a Member of Parliament for Papineau. He remains active in the Liberal Party. For current information, please check the Politicians section of CivicOS.',
      'bills': 'Canadian bills go through a rigorous legislative process including multiple readings in Parliament, committee review, and Royal Assent. The process ensures thorough debate and consideration of all perspectives. You can view current bills in the Bills & Voting section.',
      'voting': 'Canadian citizens 18 and older can vote in federal elections. You can register to vote online or at your polling station. Elections Canada provides information about candidates and voting procedures. Check the Voting section for current electoral information.',
      'parliament': 'The Parliament of Canada consists of the House of Commons and Senate. The House of Commons has 338 elected Members of Parliament who represent constituencies across Canada. Visit the Politicians section to see current MPs.',
      'election': 'Federal elections in Canada are held every 4 years or when Parliament is dissolved. The next election is scheduled for 2025. Check the Elections section for current information and results.',
      'petition': 'Canadian citizens can create and sign petitions on various issues. Petitions with enough signatures may be presented in Parliament. Visit the Petitions section to see current petitions and create new ones.',
      'rights': 'The Canadian Charter of Rights and Freedoms guarantees fundamental rights and freedoms to all Canadians. This includes freedom of expression, assembly, and religion, as well as legal rights and equality rights. Visit the Legal Resources section for detailed information.',
      'corruption': 'If you suspect government corruption, you can report it to the Office of the Conflict of Interest and Ethics Commissioner, the RCMP, or use CivicOS transparency tools to document and track concerns. Visit the Transparency & Accountability section for guidance.',
      'mp': 'To find your Member of Parliament, visit the Politicians section and search by your postal code or riding name. You can view their contact information, voting record, and recent activities.',
      'senate': 'The Canadian Senate is the upper house of Parliament, with 105 appointed senators representing provinces and territories. Senators review and amend legislation passed by the House of Commons. Visit the Politicians section to see current senators.',
      'default': 'I\'m CivicOS, your Canadian civic engagement assistant. I can help you understand Canadian politics, government processes, and civic matters. For real-time information, please use the specific sections of the platform (Politicians, Bills, Elections, etc.). What would you like to know about?'
    };

    const lowerMessage = message.toLowerCase();
    let response = mockResponses.default;

    if (lowerMessage.includes('trudeau') || lowerMessage.includes('prime minister')) {
      response = mockResponses.trudeau;
    } else if (lowerMessage.includes('bill')) {
      response = mockResponses.bills;
    } else if (lowerMessage.includes('vote') || lowerMessage.includes('voting')) {
      response = mockResponses.voting;
    } else if (lowerMessage.includes('parliament')) {
      response = mockResponses.parliament;
    } else if (lowerMessage.includes('election')) {
      response = mockResponses.election;
    } else if (lowerMessage.includes('petition')) {
      response = mockResponses.petition;
    } else if (lowerMessage.includes('right') || lowerMessage.includes('charter') || lowerMessage.includes('freedom')) {
      response = mockResponses.rights;
    } else if (lowerMessage.includes('corrupt') || lowerMessage.includes('report') || lowerMessage.includes('fraud')) {
      response = mockResponses.corruption;
    } else if (lowerMessage.includes('mp') || lowerMessage.includes('member of parliament') || lowerMessage.includes('representative')) {
      response = mockResponses.mp;
    } else if (lowerMessage.includes('senate') || lowerMessage.includes('senator')) {
      response = mockResponses.senate;
    }

    return {
      response: response,
      confidence: 0.85,
      provider: 'CivicOS Mock AI',
      model: 'civic-intelligence-v1',
      isMock: true,
      sources: ['CivicOS Knowledge Base']
    };
  }

  async healthCheck(): Promise<AiHealth> {
    if (this.isGeminiAvailable) {
      return {
        service: true,
        model: this.model,
        message: 'Google Gemini AI is operational and ready',
        provider: 'Google Gemini',
        isMock: false
      };
    }
    
    return {
      service: true,
      model: 'civic-intelligence-v1',
      message: 'Using mock AI responses - GEMINI_API_KEY not configured',
      provider: 'CivicOS Mock AI',
      isMock: true
    };
  }

  // Comprehensive AI Analysis Methods for ALL data types
  
  async analyzeBill(billText: string, billNumber: string): Promise<string> {
    if (!this.isGeminiAvailable || !this.geminiClient) {
      return `Bill ${billNumber}: Analysis unavailable - AI service not configured.`;
    }

    try {
      const response = await this.geminiClient.models.generateContent({
        model: this.model,
        contents: `Analyze this Canadian bill and provide a comprehensive summary:

**Bill Number**: ${billNumber}

**Required Analysis**:
1. Main purpose and objectives
2. Key provisions and changes to existing law
3. Potential impacts on Canadians (positive and negative)
4. Groups/sectors most affected
5. Areas of debate or controversy
6. Implementation timeline and costs

**Bill Text**: 
${billText.substring(0, 4000)}

Provide objective, non-partisan analysis suitable for civic education.`,
        config: {
          systemInstruction: 'You are a Canadian legislative analyst. Provide objective, non-partisan, comprehensive analysis.',
        }
      });

      return response.text || 'Analysis could not be completed.';
    } catch (error) {
      logger.error('Bill analysis failed', { error: error instanceof Error ? error.message : String(error) });
      return `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async analyzePolitician(politicianName: string, politicianData: any): Promise<string> {
    if (!this.isGeminiAvailable || !this.geminiClient) {
      return 'Politician analysis unavailable - AI service not configured.';
    }

    try {
      const response = await this.geminiClient.models.generateContent({
        model: this.model,
        contents: `Analyze this Canadian politician's profile and provide insights:

**Politician**: ${politicianName}
**Party**: ${politicianData.party || 'Unknown'}
**Position**: ${politicianData.position || 'Unknown'}
**Riding**: ${politicianData.riding || 'Unknown'}

**Bio**: ${politicianData.bio || 'No bio available'}

Provide:
1. Summary of political career and key achievements
2. Policy positions and voting patterns
3. Notable legislation sponsored or supported
4. Public perception and approval trends
5. Areas of expertise or focus

Keep analysis objective and fact-based.`,
      });

      return response.text || 'Analysis unavailable.';
    } catch (error) {
      logger.error('Politician analysis failed', { error: error instanceof Error ? error.message : String(error) });
      return 'Analysis unavailable.';
    }
  }

  async summarizeNews(articleText: string, articleTitle?: string): Promise<string> {
    if (!this.isGeminiAvailable || !this.geminiClient) {
      return 'Summary unavailable - AI service not configured.';
    }

    try {
      const response = await this.geminiClient.models.generateContent({
        model: this.model,
        contents: `Summarize this Canadian news article concisely in 2-3 sentences, focusing on key facts and implications:

${articleTitle ? `**Title**: ${articleTitle}\n\n` : ''}**Article**: 
${articleText.substring(0, 3000)}`,
      });

      return response.text || 'Could not generate summary.';
    } catch (error) {
      logger.error('News summarization failed', { error: error instanceof Error ? error.message : String(error) });
      return 'Summary unavailable.';
    }
  }

  async analyzeNewsCredibility(articleText: string, source: string): Promise<{bias: string, factuality: number, credibility: number}> {
    if (!this.isGeminiAvailable || !this.geminiClient) {
      return {bias: 'unknown', factuality: 50, credibility: 50};
    }

    try {
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.5-pro', // Use pro model for structured output
        contents: `Analyze the bias and credibility of this Canadian news article from "${source}".

**Article**: 
${articleText.substring(0, 3000)}

Rate on scale 0-100 for factuality and credibility. Identify political bias (left/center/right).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              bias: { type: 'string', enum: ['left', 'center', 'right'] },
              factuality: { type: 'number' },
              credibility: { type: 'number' }
            },
            required: ['bias', 'factuality', 'credibility']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        bias: parsed.bias || 'center',
        factuality: parsed.factuality || 50,
        credibility: parsed.credibility || 50
      };
    } catch (error) {
      logger.error('News credibility analysis failed', { error: error instanceof Error ? error.message : String(error) });
      return {bias: 'center', factuality: 50, credibility: 50};
    }
  }

  async classifyPetition(petitionText: string, petitionTitle: string): Promise<{topics: string[], urgency: string}> {
    if (!this.isGeminiAvailable || !this.geminiClient) {
      return {topics: ['Other'], urgency: 'medium'};
    }

    try {
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Classify this Canadian petition by topic and urgency:

**Title**: ${petitionTitle}
**Content**: ${petitionText.substring(0, 2000)}

Identify main topics (e.g., Healthcare, Environment, Economy, Indigenous Rights, Justice, etc.) and urgency level (low/medium/high).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              topics: { type: 'array', items: { type: 'string' } },
              urgency: { type: 'string', enum: ['low', 'medium', 'high'] }
            },
            required: ['topics', 'urgency']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        topics: parsed.topics || ['Other'],
        urgency: parsed.urgency || 'medium'
      };
    } catch (error) {
      logger.error('Petition classification failed', { error: error instanceof Error ? error.message : String(error) });
      return {topics: ['Other'], urgency: 'medium'};
    }
  }

  async analyzeLegalDocument(documentText: string, documentType: string): Promise<string> {
    if (!this.isGeminiAvailable || !this.geminiClient) {
      return 'Legal analysis unavailable - AI service not configured.';
    }

    try {
      const response = await this.geminiClient.models.generateContent({
        model: this.model,
        contents: `Analyze this Canadian legal document (${documentType}) and provide a plain-language summary:

**Document**: 
${documentText.substring(0, 4000)}

Explain:
1. Purpose and scope
2. Key provisions in simple terms
3. Who is affected and how
4. Important dates or deadlines
5. Practical implications for Canadians`,
      });

      return response.text || 'Analysis unavailable.';
    } catch (error) {
      logger.error('Legal document analysis failed', { error: error instanceof Error ? error.message : String(error) });
      return 'Analysis unavailable.';
    }
  }

  async generateCivicInsight(topic: string, data: any): Promise<string> {
    if (!this.isGeminiAvailable || !this.geminiClient) {
      return 'Civic insight unavailable - AI service not configured.';
    }

    try {
      const response = await this.geminiClient.models.generateContent({
        model: this.model,
        contents: `Generate civic insight about ${topic} in Canada based on this data:

${JSON.stringify(data, null, 2).substring(0, 3000)}

Provide:
1. Key trends or patterns
2. Implications for Canadian democracy
3. Actionable recommendations for citizens
4. Areas needing attention or reform`,
      });

      return response.text || 'Insight generation failed.';
    } catch (error) {
      logger.error('Civic insight generation failed', { error: error instanceof Error ? error.message : String(error) });
      return 'Insight unavailable.';
    }
  }
}

export const enhancedAiService = new EnhancedAiService();
