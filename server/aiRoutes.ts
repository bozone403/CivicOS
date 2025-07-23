import express from 'express';
import FreeAiService from './freeAiService.js';

const router = express.Router();
const aiService = new FreeAiService();

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await aiService.healthCheck();
    const models = await aiService.getAvailableModels();
    
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'ollama',
      models: models,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'AI service health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CivicOS Chatbot endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const response = await aiService.civicChatbot(message, context);
    
    res.json({
      message: response,
      timestamp: new Date().toISOString(),
      service: 'ollama'
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to generate chat response',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// News analysis endpoint
router.post('/analyze-news', async (req, res) => {
  try {
    const { content, context } = req.body;
    
    if (!content) {
      return res.status(400).json({
        error: 'News content is required'
      });
    }

    const analysis = await aiService.analyzeNews(content, context);
    
    res.json({
      analysis,
      timestamp: new Date().toISOString(),
      service: 'ollama'
    });
  } catch (error) {
    console.error('News analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze news',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Policy analysis endpoint
router.post('/analyze-policy', async (req, res) => {
  try {
    const { content, context } = req.body;
    
    if (!content) {
      return res.status(400).json({
        error: 'Policy content is required'
      });
    }

    const analysis = await aiService.analyzePolicy(content, context);
    
    res.json({
      analysis,
      timestamp: new Date().toISOString(),
      service: 'ollama'
    });
  } catch (error) {
    console.error('Policy analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze policy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Civic insights endpoint
router.post('/civic-insights', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: 'Data is required for insights'
      });
    }

    const insights = await aiService.generateCivicInsights(data);
    
    res.json({
      insights,
      timestamp: new Date().toISOString(),
      service: 'ollama'
    });
  } catch (error) {
    console.error('Civic insights error:', error);
    res.status(500).json({
      error: 'Failed to generate civic insights',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Available models endpoint
router.get('/models', async (req, res) => {
  try {
    const models = await aiService.getAvailableModels();
    
    res.json({
      models,
      timestamp: new Date().toISOString(),
      service: 'ollama'
    });
  } catch (error) {
    console.error('Models error:', error);
    res.status(500).json({
      error: 'Failed to get available models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 