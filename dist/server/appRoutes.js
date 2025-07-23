import express from "express";
import { storage } from "./storage.js";
import simpleNotificationsRouter from "./simpleNotifications.js";
import civicSocialRouter from "./civicSocial.js";
import aiRoutes from "./aiRoutes.js";
import path from "path";
import { fileURLToPath } from 'url';
// Import modular route registrations
import { registerAuthRoutes, jwtAuth } from "./routes/auth.js";
import { registerApiRoutes } from "./routes/api.js";
import votingRouter from "./routes/voting.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function registerRoutes(app) {
    // Register modular routes
    registerAuthRoutes(app);
    registerApiRoutes(app);
    // Simple notifications routes (no auth required)
    app.use("/api/notifications", simpleNotificationsRouter);
    // CivicSocial routes (JWT protected)
    app.use("/api/social", jwtAuth, civicSocialRouter);
    // AI routes (free AI service using Ollama)
    app.use("/api/ai", aiRoutes);
    // Voting routes (JWT protected)
    app.use("/api/voting", jwtAuth, votingRouter);
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
        }
        catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: 'Database connection failed',
                timestamp: new Date().toISOString()
            });
        }
    });
    // Serve static files from the frontend build
    const publicPath = path.join(process.cwd(), 'dist/public');
    app.use(express.static(publicPath));
    // SPA fallback: serve index.html for all non-API routes
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ message: 'API endpoint not found' });
        }
        // Serve index.html for all other routes (SPA routing)
        res.sendFile(path.join(publicPath, 'index.html'));
    });
}
