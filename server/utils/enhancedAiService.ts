import aiService from './aiService.js';

interface CivicInsight {
  type: 'policy' | 'political' | 'engagement' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  sources: string[];
  impact: 'high' | 'medium' | 'low';
  relatedEntities: string[];
}

interface PolicyAnalysis {
  summary: string;
  pros: string[];
  cons: string[];
  impact: string;
  recommendations: string[];
  affectedGroups: string[];
  costEstimate: string;
  timeline: string;
}

interface PoliticalInsight {
  trend: string;
  keyPlayers: string[];
  publicOpinion: string;
  mediaCoverage: string;
  nextSteps: string[];
  riskFactors: string[];
}

class EnhancedAIService {
  async analyzePolicy(policyText: string, context?: {
    jurisdiction?: string;
    affectedGroups?: string[];
    budget?: string;
  }): Promise<PolicyAnalysis> {
    const prompt = `
    Analyze this Canadian policy proposal and provide a comprehensive analysis:
    
    Policy: ${policyText}
    Jurisdiction: ${context?.jurisdiction || 'Federal'}
    Affected Groups: ${context?.affectedGroups?.join(', ') || 'General public'}
    Budget Context: ${context?.budget || 'Not specified'}
    
    Please provide:
    1. A clear summary of the policy
    2. Pros and cons
    3. Potential impact on different groups
    4. Cost estimates and timeline
    5. Specific recommendations for implementation
    6. Risk factors to consider
    
    Format your response as a structured analysis with clear sections.
    `;

    const response = await aiService.generateResponse(prompt);
    
    // Parse the response into structured format
    return this.parsePolicyAnalysis(response);
  }

  async generatePoliticalInsights(data: {
    recentBills?: any[];
    votingPatterns?: any[];
    publicOpinion?: any[];
    mediaCoverage?: any[];
  }): Promise<PoliticalInsight[]> {
    const prompt = `
    Based on the following Canadian political data, generate key insights:
    
    Recent Bills: ${JSON.stringify(data.recentBills || [])}
    Voting Patterns: ${JSON.stringify(data.votingPatterns || [])}
    Public Opinion: ${JSON.stringify(data.publicOpinion || [])}
    Media Coverage: ${JSON.stringify(data.mediaCoverage || [])}
    
    Please identify:
    1. Emerging political trends
    2. Key players and their positions
    3. Public opinion shifts
    4. Media narrative analysis
    5. Recommended next steps for civic engagement
    6. Potential risk factors
    
    Provide insights that would be valuable for Canadian citizens and civic engagement.
    `;

    const response = await aiService.generateResponse(prompt);
    return this.parsePoliticalInsights(response);
  }

  async generateCivicRecommendations(userProfile: {
    interests?: string[];
    location?: string;
    activityHistory?: any[];
    civicLevel?: string;
  }): Promise<{
    recommendations: string[];
    opportunities: string[];
    nextSteps: string[];
  }> {
    const prompt = `
    Generate personalized civic engagement recommendations for a Canadian citizen:
    
    User Profile:
    - Interests: ${userProfile.interests?.join(', ') || 'General civic engagement'}
    - Location: ${userProfile.location || 'Canada'}
    - Civic Level: ${userProfile.civicLevel || 'Active'}
    - Recent Activity: ${JSON.stringify(userProfile.activityHistory || [])}
    
    Please provide:
    1. Specific recommendations for civic engagement
    2. Local opportunities for participation
    3. Next steps to increase civic impact
    4. Resources and tools to use
    5. Ways to connect with like-minded citizens
    
    Focus on practical, actionable advice for Canadian civic engagement.
    `;

    const response = await aiService.generateResponse(prompt);
    return this.parseCivicRecommendations(response);
  }

  async analyzeNewsBias(newsContent: string, source: string): Promise<{
    biasScore: number;
    biasType: string;
    factualAccuracy: number;
    propagandaTechniques: string[];
    recommendations: string[];
  }> {
    const prompt = `
    Analyze this Canadian news content for bias and accuracy:
    
    Content: ${newsContent}
    Source: ${source}
    
    Please evaluate:
    1. Political bias (left/center/right) with confidence score
    2. Factual accuracy assessment
    3. Propaganda techniques used (if any)
    4. Missing context or important details
    5. Recommendations for balanced perspective
    
    Provide a structured analysis with specific examples from the content.
    `;

    const response = await aiService.generateResponse(prompt);
    return this.parseBiasAnalysis(response);
  }

  async generateLegislativeSummary(billContent: string, context?: {
    sponsor?: string;
    party?: string;
    relatedBills?: string[];
  }): Promise<{
    summary: string;
    keyProvisions: string[];
    impact: string;
    controversy: string;
    publicOpinion: string;
    nextSteps: string[];
  }> {
    const prompt = `
    Provide a comprehensive summary of this Canadian bill:
    
    Bill Content: ${billContent}
    Sponsor: ${context?.sponsor || 'Unknown'}
    Party: ${context?.party || 'Unknown'}
    Related Bills: ${context?.relatedBills?.join(', ') || 'None'}
    
    Please provide:
    1. Clear, non-partisan summary
    2. Key provisions and changes
    3. Potential impact on Canadians
    4. Controversial aspects
    5. Public opinion considerations
    6. Recommended civic actions
    
    Focus on helping citizens understand the bill's implications.
    `;

    const response = await aiService.generateResponse(prompt);
    return this.parseLegislativeSummary(response);
  }

  async generateCivicIntelligenceReport(data: {
    userActivity?: any[];
    regionalStats?: any[];
    trendingTopics?: string[];
    politicalEvents?: any[];
  }): Promise<{
    insights: CivicInsight[];
    trends: string[];
    recommendations: string[];
    alerts: string[];
  }> {
    const prompt = `
    Generate a comprehensive civic intelligence report based on:
    
    User Activity: ${JSON.stringify(data.userActivity || [])}
    Regional Statistics: ${JSON.stringify(data.regionalStats || [])}
    Trending Topics: ${data.trendingTopics?.join(', ') || 'None'}
    Political Events: ${JSON.stringify(data.politicalEvents || [])}
    
    Please provide:
    1. Key insights about civic engagement patterns
    2. Emerging trends in Canadian politics
    3. Personalized recommendations
    4. Important alerts or warnings
    5. Opportunities for civic action
    
    Focus on actionable intelligence for Canadian civic engagement.
    `;

    const response = await aiService.generateResponse(prompt);
    return this.parseCivicIntelligenceReport(response);
  }

  private parsePolicyAnalysis(response: string): PolicyAnalysis {
    // Simple parsing - in production, use more sophisticated parsing
    const sections = response.split('\n\n');
    
    return {
      summary: sections[0] || 'Analysis not available',
      pros: sections[1]?.split('\n').filter(line => line.trim()) || [],
      cons: sections[2]?.split('\n').filter(line => line.trim()) || [],
      impact: sections[3] || 'Impact analysis not available',
      recommendations: sections[4]?.split('\n').filter(line => line.trim()) || [],
      affectedGroups: sections[5]?.split('\n').filter(line => line.trim()) || [],
      costEstimate: sections[6] || 'Cost estimate not available',
      timeline: sections[7] || 'Timeline not available'
    };
  }

  private parsePoliticalInsights(response: string): PoliticalInsight[] {
    // Simple parsing - in production, use more sophisticated parsing
    const insights: PoliticalInsight[] = [];
    const sections = response.split('\n\n');
    
    sections.forEach(section => {
      if (section.trim()) {
        insights.push({
          trend: section.split('\n')[0] || 'Trend not identified',
          keyPlayers: section.split('\n')[1]?.split(',') || [],
          publicOpinion: section.split('\n')[2] || 'Public opinion not analyzed',
          mediaCoverage: section.split('\n')[3] || 'Media coverage not analyzed',
          nextSteps: section.split('\n')[4]?.split(',') || [],
          riskFactors: section.split('\n')[5]?.split(',') || []
        });
      }
    });
    
    return insights;
  }

  private parseCivicRecommendations(response: string): {
    recommendations: string[];
    opportunities: string[];
    nextSteps: string[];
  } {
    const sections = response.split('\n\n');
    
    return {
      recommendations: sections[0]?.split('\n').filter(line => line.trim()) || [],
      opportunities: sections[1]?.split('\n').filter(line => line.trim()) || [],
      nextSteps: sections[2]?.split('\n').filter(line => line.trim()) || []
    };
  }

  private parseBiasAnalysis(response: string): {
    biasScore: number;
    biasType: string;
    factualAccuracy: number;
    propagandaTechniques: string[];
    recommendations: string[];
  } {
    const sections = response.split('\n\n');
    
    return {
      biasScore: this.extractScore(sections[0]) || 0,
      biasType: sections[1] || 'Unknown',
      factualAccuracy: this.extractScore(sections[2]) || 0,
      propagandaTechniques: sections[3]?.split('\n').filter(line => line.trim()) || [],
      recommendations: sections[4]?.split('\n').filter(line => line.trim()) || []
    };
  }

  private parseLegislativeSummary(response: string): {
    summary: string;
    keyProvisions: string[];
    impact: string;
    controversy: string;
    publicOpinion: string;
    nextSteps: string[];
  } {
    const sections = response.split('\n\n');
    
    return {
      summary: sections[0] || 'Summary not available',
      keyProvisions: sections[1]?.split('\n').filter(line => line.trim()) || [],
      impact: sections[2] || 'Impact not analyzed',
      controversy: sections[3] || 'Controversy not identified',
      publicOpinion: sections[4] || 'Public opinion not analyzed',
      nextSteps: sections[5]?.split('\n').filter(line => line.trim()) || []
    };
  }

  private parseCivicIntelligenceReport(response: string): {
    insights: CivicInsight[];
    trends: string[];
    recommendations: string[];
    alerts: string[];
  } {
    const sections = response.split('\n\n');
    
    return {
      insights: this.parseInsights(sections[0]),
      trends: sections[1]?.split('\n').filter(line => line.trim()) || [],
      recommendations: sections[2]?.split('\n').filter(line => line.trim()) || [],
      alerts: sections[3]?.split('\n').filter(line => line.trim()) || []
    };
  }

  private parseInsights(text: string): CivicInsight[] {
    const insights: CivicInsight[] = [];
    const lines = text?.split('\n').filter(line => line.trim()) || [];
    
    lines.forEach(line => {
      if (line.trim()) {
        insights.push({
          type: 'policy',
          title: line.split(':')[0] || 'Insight',
          description: line.split(':')[1] || line,
          confidence: 0.8,
          sources: ['AI Analysis'],
          impact: 'medium',
          relatedEntities: []
        });
      }
    });
    
    return insights;
  }

  private extractScore(text: string): number {
    const match = text?.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
}

export default new EnhancedAIService(); 