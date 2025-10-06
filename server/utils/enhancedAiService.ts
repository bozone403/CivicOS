import pino from 'pino';

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
  constructor() {
    logger.info('Enhanced AI Service initialized', { 
      provider: 'mock',
      model: 'mock-civic-data'
    });
  }

  async generateResponse(message: string, context?: any): Promise<AiResponse> {
    return this.generateMockResponse(message, context);
  }

  private buildPrompt(message: string, context?: any): string {
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
    return {
      service: true,
      model: 'civic-intelligence-v1',
      message: 'CivicOS AI Assistant is operational with comprehensive Canadian civic knowledge',
      provider: 'CivicOS Mock AI',
      isMock: true
    };
  }
}

export const enhancedAiService = new EnhancedAiService();
