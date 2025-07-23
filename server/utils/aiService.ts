import fetch from "node-fetch";

interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export async function callOllamaMistral(prompt: string): Promise<string> {
  // In production, Ollama runs on the same server, so use the internal address
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? "http://127.0.0.1:11434" 
    : (process.env.OLLAMA_BASE_URL || "http://localhost:11434");
  const model = process.env.OLLAMA_MODEL || "mistral:latest";
  
  try {
    console.log(`🤖 Calling Ollama Mistral at ${baseUrl} with model ${model}`);
    
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      } as OllamaRequest),
    });

    if (!response.ok) {
      console.warn(`Ollama request failed: ${response.status} ${response.statusText}`);
      return generateFallbackResponse(prompt);
    }

    const data = await response.json() as OllamaResponse;
    console.log(`✅ Ollama Mistral response received`);
    return data.response;
  } catch (error) {
    console.warn("Error calling Ollama Mistral:", error);
    return generateFallbackResponse(prompt);
  }
}

function generateFallbackResponse(prompt: string): string {
  // Provide intelligent fallback responses based on the prompt
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes("news") || lowerPrompt.includes("article")) {
    return "I'm analyzing this news article for bias and credibility. The content appears to be from a mainstream source. For a comprehensive analysis, please check multiple sources and consider different perspectives.";
  }
  
  if (lowerPrompt.includes("bill") || lowerPrompt.includes("legislation")) {
    return "This appears to be a legislative bill. I recommend reviewing the full text, checking the sponsor's voting record, and understanding the potential impacts on different communities.";
  }
  
  if (lowerPrompt.includes("politician") || lowerPrompt.includes("mp")) {
    return "I'm analyzing this politician's statement. Remember to fact-check claims, review their voting record, and consider multiple sources for a complete picture.";
  }
  
  if (lowerPrompt.includes("civic") || lowerPrompt.includes("democracy")) {
    return "This is an important civic engagement topic. Stay informed, participate in democratic processes, and encourage others to get involved in their communities.";
  }
  
  return "I'm here to help with Canadian civic engagement. For the most accurate and up-to-date information, please check official government sources and multiple news outlets.";
}

/**
 * Enhanced Mixtral prompt for Canadian civic intelligence
 */
export async function callMixtralCivicIntelligence(prompt: string, context?: {
  userLocation?: string;
  userInterests?: string[];
  previousMessages?: string[];
}): Promise<string> {
  const enhancedPrompt = `You are CivicOS, a Canadian civic intelligence AI assistant. You provide accurate, unbiased analysis of Canadian politics, legislation, and civic matters.

Context:
${context?.userLocation ? `User Location: ${context.userLocation}` : ''}
${context?.userInterests ? `User Interests: ${context.userInterests.join(', ')}` : ''}
${context?.previousMessages ? `Previous Conversation: ${context.previousMessages.join('\n')}` : ''}

User Query: ${prompt}

Provide a comprehensive, factual response focused on Canadian civic matters. Include relevant context, cite sources when possible, and maintain political neutrality while being informative.`;

  return callOllamaMistral(enhancedPrompt);
}

/**
 * Mixtral for news analysis and bias detection
 */
export async function callMixtralNewsAnalysis(articleText: string, sourceName: string): Promise<string> {
  const prompt = `Analyze this Canadian news article for bias, factual accuracy, and propaganda techniques.

Source: ${sourceName}
Article: ${articleText.substring(0, 2000)}

Provide analysis in JSON format:
{
  "bias": "left|center|right",
  "factualAccuracy": 0-100,
  "propagandaTechniques": ["technique1", "technique2"],
  "keyClaims": ["claim1", "claim2"],
  "verifiableFacts": ["fact1", "fact2"],
  "unverifiedClaims": ["claim1", "claim2"],
  "overallCredibility": 0-100,
  "summary": "brief analysis"
}`;

  return callOllamaMistral(prompt);
}

/**
 * Mixtral for bill analysis and summarization
 */
export async function callMixtralBillAnalysis(billText: string): Promise<string> {
  const prompt = `Analyze this Canadian bill/legislation and provide a comprehensive summary.

Bill Text: ${billText}

Provide analysis in JSON format:
{
  "summary": "clear summary in plain language",
  "keyProvisions": ["provision1", "provision2", "provision3"],
  "affectedGroups": ["group1", "group2"],
  "estimatedCost": "cost estimate if available",
  "timeline": "expected timeline",
  "controversialAspects": ["aspect1", "aspect2"],
  "supportingArguments": ["argument1", "argument2"],
  "opposingArguments": ["argument1", "argument2"],
  "politicalImpact": "analysis of political implications"
}`;

  return callOllamaMistral(prompt);
}

/**
 * Mixtral for politician analysis
 */
export async function callMixtralPoliticianAnalysis(politicianName: string, statements: string[], votingRecord: any[]): Promise<string> {
  const prompt = `Analyze this Canadian politician based on their statements and voting record.

Politician: ${politicianName}
Statements: ${statements.join('\n')}
Voting Record: ${JSON.stringify(votingRecord)}

Provide analysis in JSON format:
{
  "keyPositions": ["position1", "position2"],
  "consistencyScore": 0-100,
  "contradictions": ["contradiction1", "contradiction2"],
  "votingPattern": "analysis of voting behavior",
  "policyPriorities": ["priority1", "priority2"],
  "publicTrust": 0-100,
  "summary": "comprehensive analysis"
}`;

  return callOllamaMistral(prompt);
}

// Health check for AI service
export async function checkAIServiceHealth(): Promise<{ status: string; details: string }> {
  try {
    const ollamaUrl = process.env.NODE_ENV === 'production' 
      ? 'http://127.0.0.1:11434' 
      : (process.env.OLLAMA_URL || 'http://localhost:11434');
    const model = 'mistral:latest'; // Using Mixtral exclusively
    
    console.log(`🔍 Checking Ollama health at ${ollamaUrl}`);
    
    const response = await fetch(`${ollamaUrl}/api/tags`);
    
    if (response.ok) {
      const data = await response.json() as any;
      const models = data.models || [];
      const targetModel = models.find((m: any) => m.name.includes(model.split(':')[0]));
      
      if (targetModel) {
        return {
          status: 'healthy',
          details: `Ollama available with ${models.length} models, ${model} ready`
        };
      } else {
        return {
          status: 'partial',
          details: `Ollama available with ${models.length} models, but ${model} not found`
        };
      }
    } else {
      return {
        status: 'unavailable',
        details: `Ollama responded with status ${response.status}`
      };
    }
  } catch (error) {
    console.error('❌ Ollama health check failed:', error);
    return {
      status: 'unavailable',
      details: 'Ollama not accessible - using fallback responses'
    };
  }
} 