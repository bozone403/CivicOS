import { Router } from 'express';

const router = Router();

// Simple health check for AI service
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      service: 'ai',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'AI service error',
      timestamp: new Date().toISOString()
    });
  }
});

// Main AI endpoint
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: "AI endpoint working (fallback mode)",
      endpoints: [
        "/api/ai/health - AI service health check"
      ],
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch AI data"
    });
  }
});

export default router; 