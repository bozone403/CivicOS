import { callOllamaMistral, checkAIServiceHealth } from "../utils/aiService.js";
// JWT Auth middleware
function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token" });
    }
    try {
        const token = authHeader.split(" ")[1];
        const JWT_SECRET = process.env.SESSION_SECRET;
        if (!JWT_SECRET) {
            return res.status(500).json({ message: "Server configuration error" });
        }
        const decoded = require('jsonwebtoken').verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
export function registerAIRoutes(app) {
    // AI Health Check
    app.get('/api/ai/health', async (req, res) => {
        try {
            const health = await checkAIServiceHealth();
            res.json({
                status: health.status,
                details: health.details,
                timestamp: new Date().toISOString(),
                service: 'CivicOS Free AI Service'
            });
        }
        catch (error) {
            console.error('Error checking AI health:', error);
            res.status(500).json({
                status: 'error',
                details: 'Failed to check AI service health',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // AI Chat
    app.post('/api/ai/chat', jwtAuth, async (req, res) => {
        try {
            const { message, context } = req.body;
            if (!message) {
                return res.status(400).json({ message: 'Message is required' });
            }
            const prompt = `You are CivicOS, a sophisticated Canadian civic intelligence assistant. You specialize in Canadian politics, legislation analysis, politician tracking, and civic engagement.

Your expertise includes:
- Canadian federal, provincial, and municipal government structures
- Parliamentary procedures and legislative processes
- Political parties and their platforms
- Civic rights and responsibilities
- Voting procedures and electoral systems
- How to contact and engage with elected officials
- Canadian democratic institutions and processes

Context: ${context || 'General civic engagement'}

User message: ${message}

Provide a comprehensive, accurate, and actionable response focused on Canadian civic engagement. Include specific resources, contact information, and next steps when relevant. Be informative, professional, and empowering.`;
            const response = await callOllamaMistral(prompt);
            res.json({
                response,
                timestamp: new Date().toISOString(),
                model: process.env.OLLAMA_MODEL || 'mistral:latest'
            });
        }
        catch (error) {
            console.error('Error in AI chat:', error);
            res.status(500).json({
                error: 'Failed to process chat message',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // News Analysis
    app.post('/api/ai/analyze-news', jwtAuth, async (req, res) => {
        try {
            const { title, content, source } = req.body;
            if (!title || !content) {
                return res.status(400).json({ message: 'Title and content are required' });
            }
            const prompt = `Analyze this Canadian news article for bias, credibility, and civic impact. You are an expert media analyst specializing in Canadian political journalism.

Article:
Title: ${title}
Content: ${content}
Source: ${source || 'Unknown'}

Provide a detailed analysis in JSON format with these fields:
- biasScore: number (-100 to 100, negative is left-leaning, positive is right-leaning, 0 is neutral)
- credibilityScore: number (0-100, based on source reliability, fact-checking, and transparency)
- keyFacts: array of verified, objective facts from the article
- potentialBias: array of specific bias indicators (e.g., loaded language, selective quotes, omission of context)
- civicImpact: string describing the article's impact on Canadian democracy and civic engagement
- recommendations: array of specific suggestions for readers (e.g., "Verify claims with official sources", "Check multiple perspectives")
- sourceReliability: string assessing the source's track record and credibility
- factCheckStatus: string indicating if claims need verification`;
            const response = await callOllamaMistral(prompt);
            // Try to parse JSON response
            let analysis;
            try {
                analysis = JSON.parse(response);
            }
            catch (parseError) {
                analysis = {
                    biasScore: 0,
                    credibilityScore: 50,
                    keyFacts: [],
                    potentialBias: [],
                    civicImpact: 'Analysis unavailable',
                    recommendations: ['Verify claims independently', 'Check multiple sources']
                };
            }
            res.json({
                analysis,
                rawResponse: response,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error analyzing news:', error);
            res.status(500).json({
                error: 'Failed to analyze news article',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // Policy Analysis
    app.post('/api/ai/analyze-policy', jwtAuth, async (req, res) => {
        try {
            const { billTitle, billContent, sponsor, context } = req.body;
            if (!billTitle) {
                return res.status(400).json({ message: 'Bill title is required' });
            }
            const prompt = `Analyze this Canadian policy/bill for civic impact. You are an expert policy analyst specializing in Canadian legislation and democratic processes.

Policy Details:
Bill Title: ${billTitle}
Bill Content: ${billContent || 'Content not provided'}
Sponsor: ${sponsor || 'Unknown'}
Context: ${context || 'General policy analysis'}

Provide a comprehensive analysis in JSON format with these fields:
- publicImpact: string describing specific impact on different groups of Canadians
- beneficiaries: array of specific groups who benefit from this policy
- costs: array of potential costs, drawbacks, or unintended consequences
- transparencyScore: number (0-100, based on clarity, public consultation, and oversight mechanisms)
- democraticProcess: string describing impact on democratic institutions and processes
- recommendations: array of specific civic engagement actions (e.g., "Contact your MP", "Submit to committee hearings")
- constitutionalImplications: string assessing constitutional considerations
- stakeholderAnalysis: string identifying key stakeholders and their positions
- timeline: string describing implementation timeline and key dates`;
            const response = await callOllamaMistral(prompt);
            // Try to parse JSON response
            let analysis;
            try {
                analysis = JSON.parse(response);
            }
            catch (parseError) {
                analysis = {
                    publicImpact: 'Impact analysis unavailable',
                    beneficiaries: [],
                    costs: [],
                    transparencyScore: 50,
                    democraticProcess: 'Process analysis unavailable',
                    recommendations: ['Contact your MP', 'Research the bill independently']
                };
            }
            res.json({
                analysis,
                rawResponse: response,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error analyzing policy:', error);
            res.status(500).json({
                error: 'Failed to analyze policy',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // Civic Insights
    app.post('/api/ai/civic-insights', jwtAuth, async (req, res) => {
        try {
            const { topic, question, context } = req.body;
            if (!topic || !question) {
                return res.status(400).json({ message: 'Topic and question are required' });
            }
            const prompt = `Provide civic insights on this Canadian topic:

Topic: ${topic}
Question: ${question}
Context: ${context || 'General civic engagement'}

Provide insights in JSON format with these fields:
- keyPoints: array of important facts
- civicActions: array of actions citizens can take
- resources: array of helpful resources
- timeline: string describing relevant timeline
- impact: string describing potential impact
- nextSteps: array of recommended next steps`;
            const response = await callOllamaMistral(prompt);
            // Try to parse JSON response
            let insights;
            try {
                insights = JSON.parse(response);
            }
            catch (parseError) {
                insights = {
                    keyPoints: ['Analysis unavailable'],
                    civicActions: ['Contact your MP', 'Research independently'],
                    resources: ['parl.gc.ca', 'elections.ca'],
                    timeline: 'Timeline unavailable',
                    impact: 'Impact analysis unavailable',
                    nextSteps: ['Stay informed', 'Engage with your community']
                };
            }
            res.json({
                insights,
                rawResponse: response,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error generating civic insights:', error);
            res.status(500).json({
                error: 'Failed to generate civic insights',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // Politician Analysis
    app.post('/api/ai/analyze-politician', jwtAuth, async (req, res) => {
        try {
            const { name, party, position, statements, votingRecord } = req.body;
            if (!name) {
                return res.status(400).json({ message: 'Politician name is required' });
            }
            const prompt = `Analyze this Canadian politician for civic transparency:

Name: ${name}
Party: ${party || 'Unknown'}
Position: ${position || 'Unknown'}
Statements: ${statements || 'No statements provided'}
Voting Record: ${votingRecord || 'No voting record provided'}

Provide analysis in JSON format with these fields:
- transparencyScore: number (0-100)
- consistencyScore: number (0-100, how consistent their positions are)
- keyPositions: array of their main positions
- controversies: array of any controversies
- publicService: string describing their public service record
- recommendations: array of suggestions for civic engagement`;
            const response = await callOllamaMistral(prompt);
            // Try to parse JSON response
            let analysis;
            try {
                analysis = JSON.parse(response);
            }
            catch (parseError) {
                analysis = {
                    transparencyScore: 50,
                    consistencyScore: 50,
                    keyPositions: ['Analysis unavailable'],
                    controversies: [],
                    publicService: 'Service record unavailable',
                    recommendations: ['Research independently', 'Contact their office']
                };
            }
            res.json({
                analysis,
                rawResponse: response,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error analyzing politician:', error);
            res.status(500).json({
                error: 'Failed to analyze politician',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
}
