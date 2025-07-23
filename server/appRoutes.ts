import type { Express } from "express";
import { storage } from "./storage.js";
import simpleNotificationsRouter from "./simpleNotifications.js";
import civicSocialRouter from "./civicSocial.js";
import aiRoutes from "./aiRoutes.js";

// Import modular route registrations
import { registerAuthRoutes, jwtAuth } from "./routes/auth.js";
import { registerApiRoutes } from "./routes/api.js";

export async function registerRoutes(app: Express): Promise<void> {
  // Register modular routes
  registerAuthRoutes(app);
  registerApiRoutes(app);

  // Simple notifications routes (no auth required)
  app.use("/api/notifications", simpleNotificationsRouter);

  // CivicSocial routes (JWT protected)
  app.use("/api/social", jwtAuth, civicSocialRouter);

  // AI routes (free AI service using Ollama)
  app.use("/api/ai", aiRoutes);

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      // Check database connection
      await storage.getUser('test');
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'unhealthy', 
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  });
}