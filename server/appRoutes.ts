import type { Express } from "express";
import express from "express";
import { storage } from "./storage.js";
import simpleNotificationsRouter from "./simpleNotifications.js";
// import civicSocialRouter from "./civicSocial.js"; // Temporarily disabled
import aiRoutes from "./aiRoutes.js";
import searchRouter from "./routes/search.js";
import dashboardRouter from "./routes/dashboard.js";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import modular route registrations
import { registerAuthRoutes, jwtAuth } from "./routes/auth.js";
import { registerApiRoutes } from "./routes/api.js";
import usersRoutes from "./routes/users.js";
import { registerFriendRoutes } from "./routes/friends.js";
import { registerPetitionRoutes } from "./routes/petitions.js";
import { registerMessageRoutes } from "./routes/messages.js";

import { registerPoliticiansRoutes } from "./routes/politicians.js";
import { registerBillsRoutes } from "./routes/bills.js";
import { registerNewsRoutes } from "./routes/news.js";
import { registerFinanceRoutes } from "./routes/finance.js";
// import { registerContactsRoutes } from "./routes/contacts.js"; // Temporarily disabled
import { registerLegalRoutes } from "./routes/legal.js";
import { registerMapsRoutes } from "./routes/maps.js";
import { registerProcurementRoutes } from "./routes/procurement.js";
import { registerLobbyistsRoutes } from "./routes/lobbyists.js";
import { registerMemoryRoutes } from "./routes/memory.js";
import { registerLedgerRoutes } from "./routes/ledger.js";
import { registerCasesRoutes } from "./routes/cases.js";
import { registerLeaksRoutes } from "./routes/leaks.js";
import { registerTrustRoutes } from "./routes/trust.js";
import { registerCorruptionRoutes } from "./routes/corruption.js";
import { registerElectionsRoutes } from "./routes/elections.js";
import { registerRightsRoutes } from "./routes/rights.js";
import { registerMembershipRoutes } from "./routes/membership.js";
import { registerAnnouncementsRoutes } from "./routes/announcements.js";
import { registerPermissionsRoutes } from "./routes/permissions.js";
import { registerSocialRoutes } from "./routes/social.js";
import { registerVotingRoutes } from "./routes/voting.js";
import donationsRouter from "./routes/donations.js";
import foiRouter from "./routes/foi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<void> {
  // Register all modular routes
  registerAuthRoutes(app);
  registerApiRoutes(app);
  usersRoutes(app);
  registerFriendRoutes(app);
  registerPetitionRoutes(app);
  registerMessageRoutes(app);

  registerPoliticiansRoutes(app);
  registerBillsRoutes(app);
  registerNewsRoutes(app);
  registerFinanceRoutes(app);
  // registerContactsRoutes(app); // Temporarily disabled
  registerLegalRoutes(app);
  registerMapsRoutes(app);
  registerProcurementRoutes(app);
  registerLobbyistsRoutes(app);
  registerMemoryRoutes(app);
  registerLedgerRoutes(app);
  registerCasesRoutes(app);
  registerLeaksRoutes(app);
  registerTrustRoutes(app);
  registerCorruptionRoutes(app);
  registerElectionsRoutes(app);
  registerRightsRoutes(app);
  registerMembershipRoutes(app);
  
  // registerAnnouncementsRoutes(app); // Temporarily disabled due to schema issue
  registerPermissionsRoutes(app);
  
  registerSocialRoutes(app);
  registerVotingRoutes(app);

  // FOI routes (no auth required)
  app.use("/api/foi", foiRouter);

  // Simple notifications routes (no auth required)
  app.use("/api/notifications", simpleNotificationsRouter);

  // CivicSocial routes (no auth required for testing)
  // app.use("/api/social", civicSocialRouter); // Temporarily disabled

  // Dashboard routes (no auth required for demo)
  app.use("/api/dashboard", dashboardRouter);

  // AI routes (free AI service using Ollama)
  app.use("/api/ai", aiRoutes);

  // Search routes (no auth required for search)
  app.use("/api/search", searchRouter);

  // Donations routes (no auth required for donations)
  app.use("/api/donations", donationsRouter);
  
  // Direct payment intent route for frontend compatibility
  app.use("/api/create-payment-intent", donationsRouter);

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

  // Add a catch-all 404 handler for /api/* routes (must be after all API routes)
  app.all('/api/*', (req, res) => {
    res.status(404).json({ message: 'API route not found', path: req.originalUrl });
  });

  // Serve static files from the frontend build (AFTER all API routes)
  const publicPath = path.join(process.cwd(), 'dist/public');
  // Debug logging removed for production
  
  // Check if the directory exists
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  } else {
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
        break;
      }
    }
  }
  
  app.use(express.static(publicPath));

  // SPA fallback: serve index.html for all non-API routes (must be last)
  app.get('*', (req, res) => {
    // Skip API routes - let them be handled by their respective routers
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}