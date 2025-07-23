import type { Express } from "express";
import { storage } from "./storage.js";
import simpleNotificationsRouter from "./simpleNotifications.js";
import civicSocialRouter from "./civicSocial.js";
import aiRoutes from "./aiRoutes.js";

// Import modular route registrations
import { registerAuthRoutes } from "./routes/auth.js";
import { registerApiRoutes } from "./routes/api.js";

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