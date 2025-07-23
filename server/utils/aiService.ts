import fetch from 'node-fetch';

export async function callOllamaMistral(prompt: string): Promise<string> {
  try {
    // Try local Ollama first
    const localOllamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${localOllamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: 'mistral', 
        prompt, 
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1000
        }
      })
    });
    
    if (response.ok) {
      const data: any = await response.json();
      return data.response || data.generated_text || '';
    }
  } catch (error) {
    console.error('Ollama connection failed:', error);
  }
  
  // Try production AI endpoint if configured
  try {
    const productionUrl = process.env.AI_API_URL;
    if (productionUrl && productionUrl !== 'https://your-production-ai-endpoint.com/api/generate') {
      const response = await fetch(productionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'mistral', prompt, stream: false })
      });
      
      if (response.ok) {
        const data: any = await response.json();
        return data.response || data.generated_text || '';
      }
    }
  } catch (error) {
    console.error('Production AI endpoint failed:', error);
  }
  
  // Enhanced fallback with better responses
  return generateEnhancedLocalResponse(prompt);
}

function generateEnhancedLocalResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  // Enhanced keyword-based responses
  if (promptLower.includes('carney') || promptLower.includes('prime minister')) {
    return "Mark Carney became Prime Minister in 2025, succeeding Justin Trudeau. As former Bank of Canada Governor and Bank of England Governor, he brings significant financial expertise. However, his Goldman Sachs background raises questions about potential conflicts of interest in financial policy decisions. His approach to inflation and monetary policy will be closely watched.";
  }
  
  if (promptLower.includes('trudeau')) {
    return "Justin Trudeau served as Prime Minister from 2015 to 2025. His tenure included the SNC-Lavalin scandal, broken electoral reform promises, and the WE Charity controversy. He was replaced by Mark Carney in 2025. His legacy includes significant climate policy initiatives but also questions about ethics and transparency.";
  }
  
  if (promptLower.includes('poilievre')) {
    return "Pierre Poilievre leads the Conservative Party of Canada. He has been vocal about inflation and economic issues, correctly predicting some economic challenges. His cryptocurrency advocacy and 'common sense' messaging resonate with many voters, though critics question the depth of his policy proposals.";
  }
  
  if (promptLower.includes('bill') || promptLower.includes('legislation')) {
    return "When analyzing Canadian legislation, it's crucial to examine: 1) Who benefits financially from the bill, 2) Which lobbyists or interest groups pushed for it, 3) Whether it actually addresses the stated problem, 4) The potential unintended consequences, 5) The cost to taxpayers. Always check the official parliamentary records for the most accurate information.";
  }
  
  if (promptLower.includes('news') || promptLower.includes('article')) {
    return "For news analysis, I recommend: 1) Cross-reference with official government sources, 2) Check parliamentary records, 3) Verify claims against primary sources, 4) Look for multiple perspectives, 5) Consider the timing and context of the news. Always be skeptical of single-source reporting.";
  }
  
  if (promptLower.includes('vote') || promptLower.includes('election')) {
    return "Canadian voting information: Federal elections are held every 4 years (or when Parliament is dissolved). You can register to vote online or at Elections Canada offices. Check your riding and candidates at elections.ca. Remember to bring valid ID when voting.";
  }
  
  if (promptLower.includes('rights') || promptLower.includes('charter')) {
    return "The Canadian Charter of Rights and Freedoms protects fundamental rights including freedom of expression, religion, and assembly. However, these rights can be limited under Section 1 if the limitation is reasonable and demonstrably justified. For specific legal advice, consult a lawyer.";
  }
  
  if (promptLower.includes('corruption') || promptLower.includes('scandal')) {
    return "To report corruption or government misconduct: 1) Document everything with evidence, 2) Contact the appropriate ombudsman, 3) File FOI requests for relevant documents, 4) Consider whistleblower protections, 5) Contact media if appropriate. Always follow proper legal channels.";
  }
  
  if (promptLower.includes('contact') || promptLower.includes('mp')) {
    return "To contact your MP: 1) Find your MP at ourcommons.ca, 2) Use their constituency office contact info, 3) Be specific about your issue, 4) Include relevant facts and documents, 5) Follow up if needed. MPs are required to respond to constituents.";
  }
  
  return "I'm CivicOS, your Canadian civic intelligence assistant. I can help with: analyzing legislation, tracking politicians, explaining your rights, guiding civic actions, and providing government information. For specific questions, please provide more details about what you'd like to know.";
}

// Health check for AI service
export async function checkAIServiceHealth(): Promise<{ status: string; details: string }> {
  try {
    const localOllamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${localOllamaUrl}/api/tags`);
    
    if (response.ok) {
      const data = await response.json() as any;
      const models = data.models || [];
      const mistralAvailable = models.some((model: any) => model.name.includes('mistral'));
      
      return {
        status: mistralAvailable ? 'healthy' : 'partial',
        details: `Ollama available with ${models.length} models${mistralAvailable ? ', Mistral ready' : ', Mistral not found'}`
      };
    }
  } catch (error) {
    return {
      status: 'unavailable',
      details: 'Ollama not accessible'
    };
  }
  
  return {
    status: 'fallback',
    details: 'Using enhanced local responses'
  };
} 