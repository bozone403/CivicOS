import { Router } from 'express';
import FreeAiService from './freeAiService.js';
const router = Router();
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
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'AI service health check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// CivicOS Chatbot endpoint (no auth required for public AI access)
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
    }
    catch (error) {
        // console.error removed for production
        // Return graceful error response instead of 500
        res.status(200).json({
            message: "I apologize, but I'm currently experiencing technical difficulties. Please try again later.",
            timestamp: new Date().toISOString(),
            service: 'fallback'
        });
    }
});
// News analysis endpoint (no auth required for public AI access)
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
    }
    catch (error) {
        // console.error removed for production
        // Return graceful error response instead of 500
        res.status(200).json({
            analysis: {
                summary: "Analysis temporarily unavailable",
                keyPoints: ["Service is experiencing technical difficulties"],
                sentiment: "neutral",
                civicImpact: "Unable to analyze at this time",
                relatedIssues: []
            },
            timestamp: new Date().toISOString(),
            service: 'fallback'
        });
    }
});
// Policy analysis endpoint (no auth required for public AI access)
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
    }
    catch (error) {
        // console.error removed for production
        // Return graceful error response instead of 500
        res.status(200).json({
            analysis: {
                summary: "Policy analysis temporarily unavailable",
                pros: ["Service is experiencing technical difficulties"],
                cons: ["Unable to provide detailed analysis"],
                impact: "Analysis unavailable at this time",
                recommendations: ["Please try again later"]
            },
            timestamp: new Date().toISOString(),
            service: 'fallback'
        });
    }
});
// Civic insights endpoint (no auth required for public AI access)
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
    }
    catch (error) {
        // console.error removed for production
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
    }
    catch (error) {
        // console.error removed for production
        res.status(500).json({
            error: 'Failed to get available models',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
