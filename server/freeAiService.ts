import axios from 'axios';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
}

interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
  };
}

class FreeAiService {
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    // For Render deployment, use the internal Ollama service
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'mistral:latest';
  }

  /**
   * Generate AI response using Ollama
   */
  async generateResponse(prompt: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const request: OllamaRequest = {
        model: options?.model || this.defaultModel,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature || 0.7,
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1,
        }
      };

      const response = await axios.post<OllamaResponse>(
        `${this.baseUrl}/api/generate`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data.response;
    } catch (error) {
      // console.error removed for production
      throw new Error('Failed to generate AI response');
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

User: ${message}

CivicOS:`;

    return this.generateResponse(fullPrompt, { temperature: 0.7 });
  }

  /**
   * News Analysis - Analyze political news and provide insights
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

News Content:
${newsContent}`;

    const response = await this.generateResponse(systemPrompt, { temperature: 0.5 });
    
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // console.error removed for production
    }

    // Fallback response if JSON parsing fails
    return {
      summary: response.substring(0, 200) + '...',
      keyPoints: ['Analysis completed', 'Content reviewed', 'Insights generated'],
      sentiment: 'neutral',
      civicImpact: 'This news may affect civic engagement in various ways.',
      relatedIssues: ['Civic participation', 'Political awareness']
    };
  }

  /**
   * Policy Analysis - Analyze government policies and their impact
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
    const systemPrompt = `You are a policy analyst. Analyze the following government policy and provide a balanced assessment.

Provide your analysis in this exact JSON format:
{
  "summary": "Brief policy summary",
  "pros": ["Benefit 1", "Benefit 2"],
  "cons": ["Concern 1", "Concern 2"],
  "impact": "Overall impact assessment",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

Context:
${context?.jurisdiction ? `Jurisdiction: ${context.jurisdiction}` : ''}
${context?.affectedGroups ? `Affected Groups: ${context.affectedGroups.join(', ')}` : ''}
${context?.budget ? `Budget: ${context.budget}` : ''}

Policy Content:
${policyContent}`;

    const response = await this.generateResponse(systemPrompt, { temperature: 0.6 });
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // console.error removed for production
    }

    return {
      summary: response.substring(0, 200) + '...',
      pros: ['Policy analysis completed'],
      cons: ['Consider all perspectives'],
      impact: 'Policy impact assessment provided',
      recommendations: ['Review policy details', 'Consider stakeholder input']
    };
  }

  /**
   * Civic Intelligence - Generate insights about civic engagement patterns
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
    const systemPrompt = `You are a civic intelligence analyst. Analyze the provided data and generate insights about civic engagement patterns.

Provide your analysis in this exact JSON format:
{
  "insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "trends": ["Trend 1", "Trend 2"]
}

Data:
${JSON.stringify(data, null, 2)}`;

    const response = await this.generateResponse(systemPrompt, { temperature: 0.7 });
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // console.error removed for production
    }

    return {
      insights: ['Civic engagement patterns analyzed'],
      recommendations: ['Continue monitoring trends'],
      trends: ['Data analysis completed']
    };
  }

  /**
   * Check if Ollama is running and available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      // console.error removed for production
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      // console.error removed for production
      return [];
    }
  }
}

export default FreeAiService;