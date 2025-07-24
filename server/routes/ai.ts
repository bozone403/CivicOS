import { Router } from 'express';
import { aiService } from '../utils/aiService.js';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await aiService.healthCheck();
    res.json({
      status: 'healthy',
      service: health.service ? 'operational' : 'offline',
      models: health.model ? ['active'] : [],
      message: health.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'offline',
      models: [],
      message: 'AI service health check failed',
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

    const response = await aiService.generateResponse(message, context);
    
    res.json({
      response,
      timestamp: new Date().toISOString(),
      context: context || {}
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: 'Failed to generate AI response',
      fallback: 'AI chat is temporarily unavailable. Please try again later.',
      timestamp: new Date().toISOString()
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
    const response = await aiService.generateResponse(prompt);
    
    res.json({
      politicianId: politicianId || name,
      analysis: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Politician analysis error:', error);
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
    const response = await aiService.generateResponse(prompt);
    
    res.json({
      billId: billId || title,
      analysis: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bill analysis error:', error);
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
    const response = await aiService.generateResponse(prompt);
    
    res.json({
      claim: claim || content.substring(0, 100),
      factCheck: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fact check error:', error);
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
    const response = await aiService.generateResponse(prompt);
    
    res.json({
      question,
      guidance: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Civic guidance error:', error);
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
    const health = await aiService.healthCheck();
    
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
      dataSource: process.env.USE_MOCK_AI === 'true' ? 'mock_comprehensive' : 'ollama',
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