import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { users, socialPosts, socialComments, notifications, newsArticles, votes, politicians, legalActs, legalCases } from '../../shared/schema.js';
import { count } from 'drizzle-orm';
import { jwtAuth } from './auth.js';
import { requirePermission } from '../utils/permissionService.js';
import { ingestNewsFeeds } from '../utils/newsIngestion.js';
import { ingestParliamentMembers, ingestBillRollcallsForCurrentSession } from '../utils/parliamentIngestion.js';
import { syncIncumbentPoliticiansFromParliament } from '../utils/politicianSync.js';
import { ingestProcurementFromCKAN } from '../utils/procurementIngestion.js';
import { ingestLobbyistsFromCKAN } from '../utils/lobbyistsIngestion.js';
import { legalIngestionService } from '../utils/legalIngestion.js';
import { ingestProvincialIncumbents, ingestMunicipalIncumbents, loadMunicipalCatalog, saveMunicipalCatalog } from '../utils/provincialMunicipalIngestion.js';
import { comprehensiveDataIngestion } from '../utils/comprehensiveDataIngestion.js';
import { bills, elections, procurementContracts, lobbyistOrgs, petitions } from '../../shared/schema.js';

export function registerAdminRoutes(app: Express) {
  // Aggregated platform summary for admin dashboards
  app.get('/api/admin/summary', jwtAuth, requirePermission('view_analytics'), async (_req: Request, res: Response) => {
    try {
      const [uc] = await db.select({ c: count() }).from(users);
      const [pc] = await db.select({ c: count() }).from(socialPosts);
      const [cc] = await db.select({ c: count() }).from(socialComments);
      const [nc] = await db.select({ c: count() }).from(notifications);
      const [news] = await db.select({ c: count() }).from(newsArticles);
      const [vc] = await db.select({ c: count() }).from(votes);

      res.json({
        success: true,
        summary: {
          users: Number(uc?.c) || 0,
          posts: Number(pc?.c) || 0,
          comments: Number(cc?.c) || 0,
          notifications: Number(nc?.c) || 0,
          news: Number(news?.c) || 0,
          votes: Number(vc?.c) || 0,
        }
      });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to load admin summary' });
    }
  });

  // Combined moderation dashboard payload: summary + recent posts/comments
  app.get('/api/admin/moderation-dashboard', jwtAuth, requirePermission('view_analytics'), async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit || '25')) || 25, 200);
      const offset = Math.max(parseInt(String(req.query.offset || '0')) || 0, 0);

      const [uc] = await db.select({ c: count() }).from(users);
      const [pc] = await db.select({ c: count() }).from(socialPosts);
      const [cc] = await db.select({ c: count() }).from(socialComments);
      const [nc] = await db.select({ c: count() }).from(notifications);
      const [news] = await db.select({ c: count() }).from(newsArticles);
      const [vc] = await db.select({ c: count() }).from(votes);

      const recentPosts = await db
        .select()
        .from(socialPosts)
        .orderBy((socialPosts.createdAt as any).desc?.() || (socialPosts.createdAt as any))
        .limit(limit)
        .offset(offset);

      const recentComments = await db
        .select()
        .from(socialComments)
        .orderBy((socialComments.createdAt as any).desc?.() || (socialComments.createdAt as any))
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        summary: {
          users: Number(uc?.c) || 0,
          posts: Number(pc?.c) || 0,
          comments: Number(cc?.c) || 0,
          notifications: Number(nc?.c) || 0,
          news: Number(news?.c) || 0,
          votes: Number(vc?.c) || 0,
        },
        recent: {
          posts: recentPosts,
          comments: recentComments,
        }
      });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to load moderation dashboard' });
    }
  });

  // Admin: trigger news ingestion
  app.post('/api/admin/refresh/news', jwtAuth, requirePermission('admin.news.manage'), async (_req: Request, res: Response) => {
    try {
      const result = await ingestNewsFeeds();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh news' });
    }
  });

  // Admin: trigger parliament data ingestion (members + votes)
  app.post('/api/admin/refresh/parliament', jwtAuth, requirePermission('admin.identity.review'), async (_req: Request, res: Response) => {
    try {
      const [membersResult, rollcallsResult] = await Promise.all([
        ingestParliamentMembers(),
        ingestBillRollcallsForCurrentSession()
      ]);
      
      res.json({ 
        success: true, 
        data: { members: membersResult, rollcalls: rollcallsResult }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh parliament data' });
    }
  });

  // Admin: trigger politician ingestion
  app.post('/api/admin/refresh/politicians', jwtAuth, requirePermission('admin.identity.review'), async (_req: Request, res: Response) => {
    try {
      const result = await comprehensiveDataIngestion.ingestPoliticians();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh politicians' });
    }
  });

  // Admin: trigger procurement ingestion
  app.post('/api/admin/refresh/procurement', jwtAuth, requirePermission('admin.procurement.manage'), async (_req: Request, res: Response) => {
    try {
      const result = await ingestProcurementFromCKAN();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh procurement' });
    }
  });

  // Admin: trigger lobbyist ingestion
  app.post('/api/admin/refresh/lobbyists', jwtAuth, requirePermission('admin.lobbyists.manage'), async (_req: Request, res: Response) => {
    try {
      const result = await ingestLobbyistsFromCKAN();
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh lobbyists' });
    }
  });

  // Admin: trigger legal ingestion
  app.post('/api/admin/refresh/legal', jwtAuth, requirePermission('admin.data.manage'), async (_req: Request, res: Response) => {
    try {
      const [federalActsResult, criminalCodeResult] = await Promise.all([
        legalIngestionService.ingestFederalActs(),
        legalIngestionService.ingestCriminalCode()
      ]);
      
      res.json({ 
        success: true, 
        federalActs: federalActsResult, 
        criminalCode: criminalCodeResult 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh legal data' });
    }
  });

  // Admin: trigger provincial/municipal ingestion
  app.post('/api/admin/refresh/provincial-municipal', jwtAuth, requirePermission('admin.data.manage'), async (_req: Request, res: Response) => {
    try {
      const [provincialResult, municipalResult] = await Promise.all([
        ingestProvincialIncumbents(),
        ingestMunicipalIncumbents()
      ]);
      
      res.json({ 
        success: true, 
        provincial: provincialResult, 
        municipal: municipalResult 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh provincial/municipal data' });
    }
  });

  // NEW: Comprehensive data ingestion endpoint
  app.post('/api/admin/refresh/all', jwtAuth, requirePermission('admin.data.manage'), async (_req: Request, res: Response) => {
    try {
      const result = await comprehensiveDataIngestion.runFullIngestion();
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to run comprehensive data ingestion', error: (error as any)?.message });
    }
  });

  // NEW: Get comprehensive ingestion status
  app.get('/api/admin/ingestion/status', jwtAuth, requirePermission('admin.data.manage'), async (_req: Request, res: Response) => {
    try {
      const status = await comprehensiveDataIngestion.getIngestionStatus();
      res.json({ success: true, status });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get ingestion status', error: (error as any)?.message });
    }
  });

  // NEW: Individual data source refresh endpoints
  app.post('/api/admin/refresh/elections', jwtAuth, requirePermission('admin.data.manage'), async (_req: Request, res: Response) => {
    try {
      const result = await comprehensiveDataIngestion.ingestElections();
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh elections data', error: (error as any)?.message });
    }
  });

  app.post('/api/admin/refresh/petitions', jwtAuth, requirePermission('admin.data.manage'), async (_req: Request, res: Response) => {
    try {
      const result = await comprehensiveDataIngestion.ingestPetitions();
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh petitions data', error: (error as any)?.message });
    }
  });

  // Admin: trigger municipal catalog update
  app.post('/api/admin/refresh/municipal-catalog', jwtAuth, requirePermission('admin.data.manage'), async (_req: Request, res: Response) => {
    try {
      const catalog = await loadMunicipalCatalog();
      // Convert Record<string, string> to array format
      const catalogArray = Object.entries(catalog).map(([city, url]) => ({ city, province: 'Unknown', url }));
      await saveMunicipalCatalog(catalogArray);
      res.json({ success: true, message: 'Municipal catalog updated', catalog: catalogArray });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update municipal catalog' });
    }
  });

  // Admin: trigger curated legal data ingestion
  app.post('/api/admin/refresh/legal-curated', jwtAuth, requirePermission('admin.data.manage'), async (_req: Request, res: Response) => {
    try {
      const [actsResult, casesResult] = await Promise.all([
        legalIngestionService.ingestFederalActs(),
        legalIngestionService.ingestLegalCases()
      ]);
      
      res.json({ 
        success: true, 
        acts: actsResult, 
        cases: casesResult 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh curated legal data' });
    }
  });

  // Admin: get data ingestion status
  app.get('/api/admin/ingestion/status', jwtAuth, requirePermission('admin.data.manage'), async (_req: Request, res: Response) => {
    try {
      const status = await comprehensiveDataIngestion.getIngestionStatus();
      res.json({ success: true, status });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get ingestion status', error: (error as any)?.message });
    }
  });

  // Admin: get platform health metrics
  app.get('/api/admin/health', jwtAuth, requirePermission('admin.system.view'), async (_req: Request, res: Response) => {
    try {
      const [usersCount] = await db.select({ count: count() }).from(users);
      const [postsCount] = await db.select({ count: count() }).from(socialPosts);
      const [commentsCount] = await db.select({ count: count() }).from(socialComments);
      const [politiciansCount] = await db.select({ count: count() }).from(politicians);
      const [billsCount] = await db.select({ count: count() }).from(bills);
      const [electionsCount] = await db.select({ count: count() }).from(elections);
      const [legalActsCount] = await db.select({ count: count() }).from(legalActs);
      const [procurementCount] = await db.select({ count: count() }).from(procurementContracts);
      const [lobbyistsCount] = await db.select({ count: count() }).from(lobbyistOrgs);
      const [newsCount] = await db.select({ count: count() }).from(newsArticles);
      const [petitionsCount] = await db.select({ count: count() }).from(petitions);

      res.json({
        success: true,
        platformHealth: {
          users: Number(usersCount?.count) || 0,
          social: {
            posts: Number(postsCount?.count) || 0,
            comments: Number(commentsCount?.count) || 0
          },
          government: {
            politicians: Number(politiciansCount?.count) || 0,
            bills: Number(billsCount?.count) || 0,
            elections: Number(electionsCount?.count) || 0,
            legalActs: Number(legalActsCount?.count) || 0,
            procurement: Number(procurementCount?.count) || 0,
            lobbyists: Number(lobbyistsCount?.count) || 0
          },
          content: {
            news: Number(newsCount?.count) || 0,
            petitions: Number(petitionsCount?.count) || 0
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get platform health metrics' });
    }
  });
}


