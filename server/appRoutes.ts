import type { Express } from "express";
import express from "express";
import { storage } from "./storage.js";
import simpleNotificationsRouter from "./simpleNotifications.js";
// import civicSocialRouter from "./civicSocial.js"; // Temporarily disabled
import aiRoutes from "./routes/ai.js";
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
import { registerContactsRoutes } from "./routes/contacts.js";
import { registerLegalRoutes } from "./routes/legal.js";
import { registerMapsRoutes } from "./routes/maps.js";
import { registerProcurementRoutes } from "./routes/procurement.js";
import { registerLobbyistsRoutes } from "./routes/lobbyists.js";
import { registerMemoryRoutes } from "./routes/memory.js";
import { registerLedgerRoutes } from "./routes/ledger.js";
import { registerCasesRoutes } from "./routes/cases.js";
import { registerLeaksRoutes } from "./routes/leaks.js";
import { registerWhistleblowerRoutes } from "./routes/whistleblower.js";
import { registerTrustRoutes } from "./routes/trust.js";
import { registerCorruptionRoutes } from "./routes/corruption.js";
import { registerElectionsRoutes } from "./routes/elections.js";
import { registerRightsRoutes } from "./routes/rights.js";
import { registerMembershipRoutes } from "./routes/membership.js";
import { registerAnnouncementsRoutes } from "./routes/announcements.js";
import { registerPermissionsRoutes } from "./routes/permissions.js";
import { registerSocialRoutes } from "./routes/social.js";
import { registerVotingRoutes } from "./routes/voting.js";
import { registerUploadRoutes } from "./routes/upload.js";
import { registerMigrationRoutes } from "./routes/migration.js";
import donationsRouter from "./routes/donations.js";
import foiRouter from "./routes/foi.js";
import { registerIdentityRoutes } from "./routes/identity.js";
import { registerModerationRoutes } from "./routes/moderation.js";
import { registerAdminRoutes } from "./routes/admin.js";

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
  registerContactsRoutes(app);
  registerLegalRoutes(app);
  registerMapsRoutes(app);
  registerProcurementRoutes(app);
  registerLobbyistsRoutes(app);
  registerMemoryRoutes(app);
  registerLedgerRoutes(app);
  registerCasesRoutes(app);
  registerLeaksRoutes(app);
  registerWhistleblowerRoutes(app);
  registerTrustRoutes(app);
  registerCorruptionRoutes(app);
  registerElectionsRoutes(app);
  registerRightsRoutes(app);
  registerMembershipRoutes(app);
  
  registerAnnouncementsRoutes(app);
  registerPermissionsRoutes(app);
  
  registerSocialRoutes(app);
  registerVotingRoutes(app);
  registerUploadRoutes(app);
  registerMigrationRoutes(app);
  registerModerationRoutes(app);
  registerAdminRoutes(app);

  // Identity verification routes (user + admin)
  registerIdentityRoutes(app);

  // FOI routes (no auth required)
  app.use("/api/foi", foiRouter);

  // Simple notifications routes (no auth required)
  app.use("/api/notifications", simpleNotificationsRouter);

  // Compatibility aliases for older frontend paths
  // Unread notifications count
  app.get('/api/notifications/unread-count', async (_req, res) => {
    try {
      // simpleNotificationsRouter exposes /api/notifications which returns list
      // For compatibility, return 0 when unauthenticated or empty list
      res.json({ unread: 0 });
    } catch {
      res.json({ unread: 0 });
    }
  });

  // CivicSocial routes (no auth required for testing)
  // app.use("/api/social", civicSocialRouter); // Temporarily disabled

  // Dashboard routes (no auth required for demo)
  app.use("/api/dashboard", dashboardRouter);

  // AI routes (mounted once)
  app.use("/api/ai", aiRoutes);
  
  // Test route to verify routing is working
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
  });
  
  // Simple AI test route
  app.get('/api/ai-test', (req, res) => {
    res.json({ message: 'AI test route working', timestamp: new Date().toISOString() });
  });
  
  // Simple AI endpoint for testing
  app.get('/api/ai-simple', (req, res) => {
    res.json({ 
      success: true, 
      message: "Simple AI endpoint working", 
      timestamp: new Date().toISOString() 
    });
  });

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

  // Static file serving and SPA fallback are centralized in server/index.ts
}