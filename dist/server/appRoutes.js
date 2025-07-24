import express from "express";
import { storage } from "./storage.js";
import simpleNotificationsRouter from "./simpleNotifications.js";
import civicSocialRouter from "./civicSocial.js";
import aiRoutes from "./aiRoutes.js";
import searchRouter from "./routes/search.js";
import dashboardRouter from "./routes/dashboard.js";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
// Import modular route registrations
import { registerAuthRoutes, jwtAuth } from "./routes/auth.js";
import { registerApiRoutes } from "./routes/api.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerFriendRoutes } from "./routes/friends.js";
import { registerPetitionRoutes } from "./routes/petitions.js";
import { registerMessageRoutes } from "./routes/messages.js";
import { registerSocialRoutes } from "./routes/social.js"; // Added
import votingRouter from "./routes/voting.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function registerRoutes(app) {
    // Register modular routes
    registerAuthRoutes(app);
    registerApiRoutes(app);
    registerUserRoutes(app);
    registerFriendRoutes(app);
    registerPetitionRoutes(app);
    registerMessageRoutes(app);
    registerSocialRoutes(app); // Added
    // Simple notifications routes (no auth required)
    app.use("/api/notifications", simpleNotificationsRouter);
    // CivicSocial routes (JWT protected)
    app.use("/api/social", jwtAuth, civicSocialRouter);
    // Dashboard routes (no auth required for demo)
    app.use("/api/dashboard", dashboardRouter);
    // AI routes (free AI service using Ollama)
    app.use("/api/ai", aiRoutes);
    // Voting routes (JWT protected)
    app.use("/api/voting", jwtAuth, votingRouter);
    // Search routes (no auth required for search)
    app.use("/api/search", searchRouter);
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
    console.log('  - process.cwd():', process.cwd());
    // Check if the directory exists
    if (fs.existsSync(publicPath)) {
        console.log('  - Files in public path:', fs.readdirSync(publicPath));
        app.use(express.static(publicPath));
    }
    else {
        // Try alternative paths
        const altPaths = [
            path.join(__dirname, '../dist/public'),
            path.join(__dirname, '../../dist/public'),
            path.join(process.cwd(), 'dist/public'),
            path.join(process.cwd(), '../dist/public'),
            '/opt/render/project/src/dist/public',
        ];
        for (const altPath of altPaths) {
            if (fs.existsSync(altPath)) {
                // Use the first found path
                const actualPath = altPath;
                app.use(express.static(actualPath));
                // SPA fallback: serve index.html for all non-API routes
                app.get('*', (req, res) => {
                    // Skip API routes
                    if (req.path.startsWith('/api/')) {
                        return res.status(404).json({ message: 'API endpoint not found' });
                    }
                    // Serve index.html for all other routes (SPA routing)
                    res.sendFile(path.join(actualPath, 'index.html'));
                });
                return;
            }
        }
    }
    app.use(express.static(publicPath));
    // SPA fallback: serve index.html for all non-API routes
    app.get('*', (req, res) => {
        // Skip API routes - let them be handled by their respective routers
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ message: 'API endpoint not found' });
        }
        // Serve index.html for all other routes (SPA routing)
        res.sendFile(path.join(publicPath, 'index.html'));
    });
}
