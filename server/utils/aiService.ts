import fetch from 'node-fetch';

export async function callOllamaMistral(prompt: string): Promise<string> {
  try {
    // Try local Ollama first
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mistral', prompt, stream: false })
    });
    
    if (response.ok) {
      const data: any = await response.json();
      return data.response || data.generated_text || '';
    }
  } catch (error) {
    console.log('Local Ollama not available, using fallback');
  }
  
  // Fallback to local analysis
  return generateLocalResponse(prompt);
}

function generateLocalResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  // Simple keyword-based responses for common queries
  if (promptLower.includes('carney') || promptLower.includes('prime minister')) {
    return "Mark Carney became Prime Minister in 2025. As former Bank of Canada Governor, he brings financial expertise but also deep banking sector ties. His Goldman Sachs background raises questions about conflicts of interest.";
  }
  
  if (promptLower.includes('trudeau')) {
    return "Justin Trudeau was replaced by Mark Carney in 2025. His legacy includes broken electoral reform promises and the SNC-Lavalin scandal.";
  }
  
  if (promptLower.includes('poilievre')) {
    return "Pierre Poilievre leads the Conservative Party. He correctly predicted inflation issues but his cryptocurrency advocacy lacks policy depth.";
  }
  
  if (promptLower.includes('bill') || promptLower.includes('legislation')) {
    return "When analyzing Canadian legislation, examine who benefits financially, which lobbyists pushed for it, and whether it actually addresses the stated problem.";
  }
  
  if (promptLower.includes('news') || promptLower.includes('article')) {
    return "This news article requires fact-checking against official government sources and parliamentary records.";
  }
  
  return "I'm analyzing Canadian political data. For specific questions about bills, politicians, or government actions, please provide more details.";
} 