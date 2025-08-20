import pino from 'pino';
import { mockAiService } from './mockAiService.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { politicians, bills, newsArticles, legalActs, legalCases } from '../../shared/schema.js';

const logger = pino({ name: 'ai-service' });

interface AiConfig {
  baseUrl: string;
  model: string;
  timeout: number;
  retries: number;
  huggingfaceToken?: string;
}

export interface AiResponse {
  response: string;
  confidence: number;
  sources?: string[];
  metrics?: any;
}

class AiService {
  private config: AiConfig;
  private useHuggingFace: boolean;
  private huggingfaceToken: string | undefined;

  constructor() {
    this.huggingfaceToken = process.env.HUGGINGFACE_TOKEN;
    this.config = {
      baseUrl: 'https://api-inference.huggingface.co',
      model: 'microsoft/DialoGPT-medium',
      timeout: 30000,
      retries: 3,
      huggingfaceToken: this.huggingfaceToken
    };

    this.useHuggingFace = !!this.huggingfaceToken;
    
    if (this.useHuggingFace) {
      logger.info('AI Service initialized with HuggingFace API');
    } else {
      logger.info('AI Service initialized with MOCK data - No HuggingFace token provided');
    }
  }

  async healthCheck(): Promise<{ service: boolean; model: boolean; message: string }> {
    if (this.useHuggingFace) {
      try {
        const testResponse = await this.callHuggingFaceAPI('Hello');
        return {
          service: true,
          model: true,
          message: 'HuggingFace AI service is operational'
        };
      } catch (error) {
        logger.warn('HuggingFace API test failed, falling back to mock:', error);
        return {
          service: true,
          model: false,
          message: 'HuggingFace API unavailable, using mock AI service'
        };
      }
    }

    return {
      service: true,
      model: true,
      message: 'Mock AI service is operational with comprehensive Canadian political data'
    };
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    try {
      // Try to build context from live database data first
      const liveContext = await this.buildLiveContext(prompt);
      const enhancedContext = { ...context, ...liveContext };

      if (this.useHuggingFace) {
        try {
          const response = await this.callHuggingFaceAPI(prompt, enhancedContext);
          return response;
        } catch (error) {
          logger.warn('HuggingFace API failed, falling back to mock:', error);
          return this.generateMockResponse(prompt, enhancedContext);
        }
      }

      // Always use mock AI if no HuggingFace token
      return this.generateMockResponse(prompt, enhancedContext);
    } catch (error) {
      logger.error('AI response generation failed:', error);
      return 'I apologize, but I encountered an error while processing your request. Please try again.';
    }
  }

  private async callHuggingFaceAPI(prompt: string, context?: any): Promise<string> {
    if (!this.huggingfaceToken) {
      throw new Error('No HuggingFace token available');
    }

    try {
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, context);
      
      const response = await fetch(`${this.config.baseUrl}/models/${this.config.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.huggingfaceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            max_length: 500,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          }
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        return data[0].generated_text || data[0].text || 'I apologize, but I could not generate a proper response.';
      }

      return data.generated_text || data.text || 'I apologize, but I could not generate a proper response.';
    } catch (error) {
      logger.error('HuggingFace API call failed:', error);
      throw error;
    }
  }

  private buildEnhancedPrompt(prompt: string, context?: any): string {
    let enhancedPrompt = `You are CivicOS, a Canadian government transparency and civic engagement AI assistant. `;
    enhancedPrompt += `You have access to current Canadian political data and should provide accurate, helpful responses. `;
    enhancedPrompt += `User question: ${prompt}\n\n`;

    if (context) {
      if (context.politicians && context.politicians.length > 0) {
        enhancedPrompt += `Current Canadian politicians data:\n`;
        context.politicians.forEach((pol: any) => {
          enhancedPrompt += `- ${pol.name} (${pol.party}) - ${pol.position} in ${pol.constituency}\n`;
        });
        enhancedPrompt += `\n`;
      }

      if (context.bills && context.bills.length > 0) {
        enhancedPrompt += `Recent bills:\n`;
        context.bills.forEach((bill: any) => {
          enhancedPrompt += `- ${bill.title} (${bill.status}) - ${bill.summary}\n`;
        });
        enhancedPrompt += `\n`;
      }

      if (context.news && context.news.length > 0) {
        enhancedPrompt += `Recent news:\n`;
        context.news.forEach((article: any) => {
          enhancedPrompt += `- ${article.title} (${article.source})\n`;
        });
        enhancedPrompt += `\n`;
      }
    }

    enhancedPrompt += `Please provide a helpful, accurate response based on the available information. `;
    enhancedPrompt += `If you don't have specific information, acknowledge that and suggest where the user might find more details.`;

    return enhancedPrompt;
  }

  private async buildLiveContext(prompt: string): Promise<any> {
    const lowerPrompt = prompt.toLowerCase();
    const context: any = {};

    try {
      // Politician context
      if (lowerPrompt.includes('politician') || lowerPrompt.includes('trudeau') || lowerPrompt.includes('poilievre') || lowerPrompt.includes('singh') || lowerPrompt.includes('mp') || lowerPrompt.includes('minister')) {
        const politiciansData = await db.execute(sql`
          SELECT id, name, party, position, constituency, trust_score, level, jurisdiction
          FROM politicians 
          WHERE is_incumbent = true 
          ORDER BY trust_score DESC 
          LIMIT 10
        `);
        context.politicians = politiciansData.rows;
      }

      // Bills context
      if (lowerPrompt.includes('bill') || lowerPrompt.includes('legislation') || lowerPrompt.includes('law') || lowerPrompt.includes('act')) {
        const billsData = await db.execute(sql`
          SELECT id, title, description, status, sponsor_name, introduced_date, summary
          FROM bills 
          ORDER BY created_at DESC 
          LIMIT 10
        `);
        context.bills = billsData.rows;
      }

      // News context
      if (lowerPrompt.includes('news') || lowerPrompt.includes('current') || lowerPrompt.includes('today') || lowerPrompt.includes('recent')) {
        const newsData = await db.execute(sql`
          SELECT id, title, content, source, published_at, credibility_score
          FROM news_articles 
          ORDER BY published_at DESC 
          LIMIT 5
        `);
        context.news = newsData.rows;
      }

      // Legal context
      if (lowerPrompt.includes('legal') || lowerPrompt.includes('court') || lowerPrompt.includes('justice') || lowerPrompt.includes('criminal')) {
        const legalData = await db.execute(sql`
          SELECT id, title, description, type, jurisdiction, status
          FROM legal_acts 
          ORDER BY created_at DESC 
          LIMIT 5
        `);
        context.legal = legalData.rows;
      }

      // Elections context
      if (lowerPrompt.includes('election') || lowerPrompt.includes('vote') || lowerPrompt.includes('campaign') || lowerPrompt.includes('candidate')) {
        const electionsData = await db.execute(sql`
          SELECT id, title, type, jurisdiction, election_date, status
          FROM elections 
          ORDER BY election_date DESC 
          LIMIT 5
        `);
        context.elections = electionsData.rows;
      }

      // Procurement context
      if (lowerPrompt.includes('procurement') || lowerPrompt.includes('contract') || lowerPrompt.includes('spending') || lowerPrompt.includes('government contract')) {
        const procurementData = await db.execute(sql`
          SELECT id, title, description, vendor, amount, contract_date, status
          FROM procurement_contracts 
          ORDER BY contract_date DESC 
          LIMIT 5
        `);
        context.procurement = procurementData.rows;
      }

      return context;
    } catch (error) {
      logger.error('Error building live context:', error);
      return null;
    }
  }

  private generateMockResponse(prompt: string, context?: any): string {
    // Enhanced mock responses with context awareness
    const lowerPrompt = prompt.toLowerCase();
    
    if (context?.politicians && context.politicians.length > 0) {
      if (lowerPrompt.includes('trudeau')) {
        const trudeau = context.politicians.find((p: any) => p.name.toLowerCase().includes('trudeau'));
        if (trudeau) {
          return `Based on current data, Justin Trudeau is the leader of the Liberal Party and serves as Prime Minister of Canada. He represents the riding of Papineau, Quebec. His current trust score is ${trudeau.trust_score || 'N/A'}.`;
        }
      }
      
      if (lowerPrompt.includes('poilievre')) {
        const poilievre = context.politicians.find((p: any) => p.name.toLowerCase().includes('poilievre'));
        if (poilievre) {
          return `Pierre Poilievre is the leader of the Conservative Party of Canada. He represents the riding of Carleton, Ontario. His current trust score is ${poilievre.trust_score || 'N/A'}.`;
        }
      }
    }

    if (context?.bills && context.bills.length > 0) {
      if (lowerPrompt.includes('bill') || lowerPrompt.includes('legislation')) {
        const recentBill = context.bills[0];
        return `The most recent bill in our system is "${recentBill.title}" which is currently ${recentBill.status}. It was introduced by ${recentBill.sponsor_name} and focuses on ${recentBill.summary || 'various policy matters'}.`;
      }
    }

    if (context?.elections && context.elections.length > 0) {
      if (lowerPrompt.includes('election')) {
        const nextElection = context.elections.find((e: any) => e.status === 'upcoming');
        if (nextElection) {
          return `The next ${nextElection.type} election in ${nextElection.jurisdiction} is scheduled for ${nextElection.election_date}. This will be an important opportunity for citizens to participate in the democratic process.`;
        }
      }
    }

    // Default responses for common queries
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return 'Hello! I\'m CivicOS, your AI assistant for Canadian government transparency and civic engagement. How can I help you today?';
    }

    if (lowerPrompt.includes('help')) {
      return 'I can help you with information about Canadian politicians, bills, elections, legal matters, government spending, and more. Just ask me a specific question!';
    }

    if (lowerPrompt.includes('canada') || lowerPrompt.includes('canadian')) {
      return 'Canada is a parliamentary democracy with a federal system of government. The country has three levels of government: federal, provincial/territorial, and municipal. I can provide you with current information about Canadian politics and government.';
    }

    if (lowerPrompt.includes('government') || lowerPrompt.includes('politics')) {
      return 'Canadian government operates at three levels: federal (Parliament in Ottawa), provincial/territorial (10 provinces and 3 territories), and municipal (cities, towns, and villages). The current federal government is led by Prime Minister Justin Trudeau of the Liberal Party.';
    }

    return 'I\'m here to help you with information about Canadian government and civic matters. Please ask me a specific question about politicians, bills, elections, or any other government-related topic.';
  }

  async getServiceInfo(): Promise<{ type: string; status: string; features: string[] }> {
    return {
      type: this.useHuggingFace ? 'HuggingFace AI' : 'Mock AI',
      status: this.useHuggingFace ? 'Operational' : 'Mock Mode',
      features: [
        'Canadian political data integration',
        'Real-time context building',
        'Multi-source information synthesis',
        'Government transparency assistance',
        'Civic engagement support'
      ]
    };
  }
}

export const aiService = new AiService(); 