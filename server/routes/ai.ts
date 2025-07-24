import { Express, Request, Response } from "express";
import aiService from "../utils/aiService.js";
import enhancedAiService from "../utils/enhancedAiService.js";

// JWT Auth middleware
function jwtAuth(req: any, res: any, next: any) {
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
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function registerAIRoutes(app: Express) {
  // AI Health Check
  app.get('/api/ai/health', async (req: Request, res: Response) => {
    try {
      const isHealthy = await aiService.isServiceHealthy();
      const status = aiService.getServiceStatus();
      
      res.json({
        status: isHealthy ? 'healthy' : 'unavailable',
        details: isHealthy ? 'Ollama is running and ready' : 'Ollama is not available',
        timestamp: new Date().toISOString(),
        service: 'CivicOS Free AI Service',
        serviceStatus: status
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        status: 'error',
        details: 'Failed to check AI service health',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // AI Chat
  app.post('/api/ai/chat', jwtAuth, async (req: Request, res: Response) => {
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

      const response = await aiService.generateResponse(prompt);
      
      res.json({
        response,
        timestamp: new Date().toISOString(),
        model: process.env.OLLAMA_MODEL || 'mistral:latest'
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Enhanced AI: Policy Analysis
  app.post('/api/ai/analyze-policy', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { policyText, context } = req.body;
      
      if (!policyText) {
        return res.status(400).json({ message: 'Policy text is required' });
      }

      const analysis = await enhancedAiService.analyzePolicy(policyText, context);
      
      res.json({
        analysis,
        timestamp: new Date().toISOString(),
        model: process.env.OLLAMA_MODEL || 'mistral:latest'
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to analyze policy',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Enhanced AI: Political Insights
  app.post('/api/ai/political-insights', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { data } = req.body;
      
      const insights = await enhancedAiService.generatePoliticalInsights(data || {});
      
      res.json({
        insights,
        timestamp: new Date().toISOString(),
        model: process.env.OLLAMA_MODEL || 'mistral:latest'
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to generate political insights',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Enhanced AI: Civic Recommendations
  app.post('/api/ai/civic-recommendations', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { userProfile } = req.body;
      
      if (!userProfile) {
        return res.status(400).json({ message: 'User profile is required' });
      }

      const recommendations = await enhancedAiService.generateCivicRecommendations(userProfile);
      
      res.json({
        recommendations,
        timestamp: new Date().toISOString(),
        model: process.env.OLLAMA_MODEL || 'mistral:latest'
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to generate civic recommendations',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Enhanced AI: News Bias Analysis
  app.post('/api/ai/analyze-news-bias', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { newsContent, source } = req.body;
      
      if (!newsContent) {
        return res.status(400).json({ message: 'News content is required' });
      }

      const analysis = await enhancedAiService.analyzeNewsBias(newsContent, source);
      
      res.json({
        analysis,
        timestamp: new Date().toISOString(),
        model: process.env.OLLAMA_MODEL || 'mistral:latest'
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to analyze news bias',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Enhanced AI: Legislative Summary
  app.post('/api/ai/legislative-summary', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { billContent, context } = req.body;
      
      if (!billContent) {
        return res.status(400).json({ message: 'Bill content is required' });
      }

      const summary = await enhancedAiService.generateLegislativeSummary(billContent, context);
      
      res.json({
        summary,
        timestamp: new Date().toISOString(),
        model: process.env.OLLAMA_MODEL || 'mistral:latest'
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to generate legislative summary',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Enhanced AI: Civic Intelligence Report
  app.post('/api/ai/civic-intelligence-report', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { data } = req.body;
      
      const report = await enhancedAiService.generateCivicIntelligenceReport(data || {});
      
      res.json({
        report,
        timestamp: new Date().toISOString(),
        model: process.env.OLLAMA_MODEL || 'mistral:latest'
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to generate civic intelligence report',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // News Analysis
  app.post('/api/ai/analyze-news', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { title, content, source } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
      }

      const prompt = `Analyze this Canadian news article for bias, credibility, and civic impact. You are an expert media analyst specializing in Canadian political journalism.

Article Title: ${title}
Source: ${source || 'Unknown'}
Content: ${content}

Please provide:
1. A brief summary of the key points
2. Assessment of factual accuracy and bias
3. Analysis of the civic impact and relevance
4. Identification of any propaganda techniques or misleading information
5. Recommendations for how citizens should interpret this information
6. Related civic actions or engagement opportunities

Focus on Canadian political context and civic engagement implications.`;

      const response = await aiService.generateResponse(prompt);
      
      res.json({
        analysis: response,
        timestamp: new Date().toISOString(),
        model: process.env.OLLAMA_MODEL || 'mistral:latest'
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to analyze news',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Civic Insights
  app.post('/api/ai/civic-insights', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { topic, context } = req.body;
      
      if (!topic) {
        return res.status(400).json({ message: 'Topic is required' });
      }

      const prompt = `Generate civic insights about this Canadian topic: ${topic}

Context: ${context || 'General civic engagement'}

Please provide:
1. Key civic implications and impacts
2. How this affects different groups of citizens
3. Opportunities for civic engagement and participation
4. Relevant government processes or procedures
5. Contact information for relevant officials or organizations
6. Recommended next steps for concerned citizens

Focus on practical, actionable information for Canadian civic engagement.`;

      const response = await aiService.generateResponse(prompt);
      
      res.json({
        insights: response,
        timestamp: new Date().toISOString(),
        model: process.env.OLLAMA_MODEL || 'mistral:latest'
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to generate civic insights',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
} 