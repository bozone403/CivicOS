import fetch from 'node-fetch';
/**
 * Call Ollama with Mixtral model for all AI operations
 */
export async function callOllamaMistral(prompt, options) {
    try {
        const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const model = 'mistral:latest'; // Using Mixtral exclusively
        const request = {
            model,
            prompt,
            stream: false,
            options: {
                temperature: options?.temperature || 0.7,
                top_p: 0.9,
                max_tokens: options?.maxTokens || 4000
            }
        };
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.response.trim();
    }
    catch (error) {
        console.error('Error calling Ollama Mixtral:', error);
        throw new Error('Failed to generate AI response');
    }
}
/**
 * Enhanced Mixtral prompt for Canadian civic intelligence
 */
export async function callMixtralCivicIntelligence(prompt, context) {
    const enhancedPrompt = `You are CivicOS, a Canadian civic intelligence AI assistant. You provide accurate, unbiased analysis of Canadian politics, legislation, and civic matters.

Context:
${context?.userLocation ? `User Location: ${context.userLocation}` : ''}
${context?.userInterests ? `User Interests: ${context.userInterests.join(', ')}` : ''}
${context?.previousMessages ? `Previous Conversation: ${context.previousMessages.join('\n')}` : ''}

User Query: ${prompt}

Provide a comprehensive, factual response focused on Canadian civic matters. Include relevant context, cite sources when possible, and maintain political neutrality while being informative.`;
    return callOllamaMistral(enhancedPrompt, { temperature: 0.6 });
}
/**
 * Mixtral for news analysis and bias detection
 */
export async function callMixtralNewsAnalysis(articleText, sourceName) {
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
    return callOllamaMistral(prompt, { temperature: 0.5 });
}
/**
 * Mixtral for bill analysis and summarization
 */
export async function callMixtralBillAnalysis(billText) {
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
    return callOllamaMistral(prompt, { temperature: 0.6 });
}
/**
 * Mixtral for politician analysis
 */
export async function callMixtralPoliticianAnalysis(politicianName, statements, votingRecord) {
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
    return callOllamaMistral(prompt, { temperature: 0.6 });
}
// Health check for AI service
export async function checkAIServiceHealth() {
    try {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const model = 'mistral:latest'; // Using Mixtral exclusively
        console.log(`🔍 Checking Ollama health at ${ollamaUrl}`);
        const response = await fetch(`${ollamaUrl}/api/tags`);
        if (response.ok) {
            const data = await response.json();
            const models = data.models || [];
            const targetModel = models.find((m) => m.name.includes(model.split(':')[0]));
            if (targetModel) {
                return {
                    status: 'healthy',
                    details: `Ollama available with ${models.length} models, ${model} ready`
                };
            }
            else {
                return {
                    status: 'partial',
                    details: `Ollama available with ${models.length} models, but ${model} not found`
                };
            }
        }
        else {
            return {
                status: 'unavailable',
                details: `Ollama responded with status ${response.status}`
            };
        }
    }
    catch (error) {
        console.error('❌ Ollama health check failed:', error);
        return {
            status: 'unavailable',
            details: 'Ollama not accessible - using fallback responses'
        };
    }
}
