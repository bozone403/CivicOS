import { Router } from 'express';
import { enhancedAiService } from '../utils/enhancedAiService.js';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await enhancedAiService.healthCheck();
    res.json({
      status: health.service ? 'healthy' : 'degraded',
      service: health.service ? 'operational' : 'fallback',
      models: health.model ? ['active'] : [],
      message: health.message,
      provider: health.provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'degraded',
      service: 'fallback',
      models: [],
      message: 'AI service unavailable, using mock data',
      provider: 'Mock',
      timestamp: new Date().toISOString()
    });
  }
});

// General chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    const response = await enhancedAiService.generateResponse(message, context);
    
    res.json({
      response: response.response,
      confidence: response.confidence,
      provider: response.provider,
      model: response.model,
      timestamp: new Date().toISOString(),
      context: context || {}
    });
  } catch (error) {
    // Fallback response
    const fallbackResponse = await enhancedAiService.generateResponse(req.body.message || 'Hello');
    res.json({
      response: fallbackResponse.response,
      confidence: fallbackResponse.confidence,
      provider: fallbackResponse.provider,
      model: fallbackResponse.model,
      timestamp: new Date().toISOString(),
      context: req.body.context || {}
    });
  }
});

// Politician analysis endpoint
router.post('/analyze/politician', async (req, res) => {
  try {
    const { politicianId, name } = req.body;
    
    if (!politicianId && !name) {
      return res.status(400).json({
        error: 'Politician ID or name is required'
      });
    }

    const prompt = `Analyze politician: ${name || politicianId}. Provide comprehensive analysis including voting patterns, policy positions, and political alignment.`;
    const response = await enhancedAiService.generateResponse(prompt);
    
    res.json({
      politicianId: politicianId || name,
      analysis: response.response,
      confidence: response.confidence,
      provider: response.provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      error: 'Failed to analyze politician',
      fallback: 'Politician analysis is temporarily unavailable. Please check the Politicians section for detailed information.',
      timestamp: new Date().toISOString()
    });
  }
});

// Bill analysis endpoint
router.post('/analyze/bill', async (req, res) => {
  try {
    const { billId, title, content } = req.body;
    
    if (!billId && !title) {
      return res.status(400).json({
        error: 'Bill ID or title is required'
      });
    }

    const prompt = `Analyze Canadian bill: ${title || billId}. ${content ? `Content: ${content}` : ''} Provide summary, key provisions, and impact assessment.`;
    const response = await enhancedAiService.generateResponse(prompt);
    
    res.json({
      billId: billId || title,
      analysis: response.response,
      confidence: response.confidence,
      provider: response.provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      error: 'Failed to analyze bill',
      fallback: 'Bill analysis is temporarily unavailable. Please check the Bills & Voting section for detailed information.',
      timestamp: new Date().toISOString()
    });
  }
});

// News fact-checking endpoint
router.post('/factcheck', async (req, res) => {
  try {
    const { claim, topic, content } = req.body;
    
    if (!claim && !content) {
      return res.status(400).json({
        error: 'Claim or content is required for fact-checking'
      });
    }

    const prompt = `Fact check: ${claim || content}. ${topic ? `Topic: ${topic}` : ''} Provide verdict, evidence, and sources.`;
    const response = await enhancedAiService.generateResponse(prompt);
    
    res.json({
      claim: claim || content.substring(0, 100),
      factCheck: response.response,
      confidence: response.confidence,
      provider: response.provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      error: 'Failed to fact-check claim',
      fallback: 'Fact-checking is temporarily unavailable. Please consult reliable news sources for verification.',
      timestamp: new Date().toISOString()
    });
  }
});

// Civic guidance endpoint
router.post('/civic-guide', async (req, res) => {
  try {
    const { question, topic, location } = req.body;
    
    if (!question) {
      return res.status(400).json({
        error: 'Question is required'
      });
    }

    const prompt = `Civic guidance question: ${question}. ${topic ? `Topic: ${topic}` : ''} ${location ? `Location: ${location}` : ''} Provide helpful civic information and guidance.`;
    const response = await enhancedAiService.generateResponse(prompt);
    
    res.json({
      question,
      guidance: response.response,
      confidence: response.confidence,
      provider: response.provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      error: 'Failed to provide civic guidance',
      fallback: 'Civic guidance is temporarily unavailable. Please visit canada.ca or contact your local government office.',
      timestamp: new Date().toISOString()
    });
  }
});

// AI service status endpoint
router.get('/status', async (req, res) => {
  try {
    const health = await enhancedAiService.healthCheck();
    
    res.json({
      service: 'CivicOS AI',
      status: health.service ? 'operational' : 'degraded',
      features: {
        chat: true,
        politicianAnalysis: true,
        billAnalysis: true,
        factChecking: true,
        civicGuidance: true
      },
      provider: health.provider,
      message: health.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      service: 'CivicOS AI',
      status: 'offline',
      features: {
        chat: false,
        politicianAnalysis: false,
        billAnalysis: false,
        factChecking: false,
        civicGuidance: false
      },
      message: 'AI service is currently unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 