import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { users, socialPosts, socialComments, notifications, newsArticles, votes } from '../../shared/schema.js';
import { count } from 'drizzle-orm';
import { jwtAuth } from './auth.js';
import { requirePermission } from '../utils/permissionService.js';
import { ingestNewsFeeds } from '../utils/newsIngestion.js';
import { ingestParliamentMembers, ingestBillRollcallsForCurrentSession } from '../utils/parliamentIngestion.js';
import { syncIncumbentPoliticiansFromParliament } from '../utils/politicianSync.js';
import { ingestProcurementFromCKAN } from '../utils/procurementIngestion.js';
import { ingestLobbyistsFromCKAN } from '../utils/lobbyistsIngestion.js';
import { ingestLegalActsCurated, ingestLegalCasesCurated, ingestFederalActsFromJustice, ingestCriminalCodeFromJustice } from '../utils/legalIngestion.js';
import { ingestProvincialIncumbents, ingestMunicipalIncumbents, loadMunicipalCatalog, saveMunicipalCatalog } from '../utils/provincialMunicipalIngestion.js';

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
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh news' });
    }
  });

  // Admin: trigger parliament data ingestion (members + votes)
  app.post('/api/admin/refresh/parliament', jwtAuth, requirePermission('admin.identity.review'), async (_req: Request, res: Response) => {
    try {
      const members = await ingestParliamentMembers();
      const upserts = await syncIncumbentPoliticiansFromParliament();
      const votes = await ingestBillRollcallsForCurrentSession();
      res.json({ success: true, membersInserted: members, politiciansUpserted: upserts, rollcalls: votes.rollcalls, records: votes.records });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh parliament data' });
    }
  });

  // Admin: trigger provincial incumbents ingestion
  app.post('/api/admin/refresh/provincial-incumbents', jwtAuth, requirePermission('admin.identity.review'), async (req: Request, res: Response) => {
    try {
      const province = (req.body as any)?.province as string | undefined;
      const result = await ingestProvincialIncumbents(province);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh provincial incumbents' });
    }
  });

  // Admin: trigger municipal incumbents ingestion
  app.post('/api/admin/refresh/municipal-incumbents', jwtAuth, requirePermission('admin.identity.review'), async (req: Request, res: Response) => {
    try {
      const targets = Array.isArray((req.body as any)?.targets) ? (req.body as any).targets : undefined;
      const result = await ingestMunicipalIncumbents(targets);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh municipal incumbents' });
    }
  });

  // Admin: upsert municipal sources catalog entries
  app.post('/api/admin/municipal-sources/upsert', jwtAuth, requirePermission('admin.identity.review'), async (req: Request, res: Response) => {
    try {
      const entries = Array.isArray((req.body as any)?.entries) ? (req.body as any).entries : [];
      if (!entries.length) return res.status(400).json({ success: false, message: 'No entries provided' });
      const current = loadMunicipalCatalog();
      for (const e of entries) {
        current[`${e.city}, ${e.province}`] = e.url;
      }
      const out = Object.entries(current).map(([k, url]) => {
        const [city, province] = k.split(',').map(s => s.trim());
        return { city, province, url };
      });
      saveMunicipalCatalog(out);
      res.json({ success: true, count: entries.length });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to upsert municipal sources' });
    }
  });

  // Admin: trigger procurement data ingestion (CKAN)
  app.post('/api/admin/refresh/procurement', jwtAuth, requirePermission('admin.news.manage'), async (req: Request, res: Response) => {
    try {
      const query = String((req.body && (req.body as any).query) || process.env.CKAN_PROCUREMENT_QUERY || 'contract awards');
      const inserted = await ingestProcurementFromCKAN(query);
      res.json({ success: true, inserted });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh procurement data' });
    }
  });

  // Admin: trigger lobbyists data ingestion (CKAN/curated)
  app.post('/api/admin/refresh/lobbyists', jwtAuth, requirePermission('admin.news.manage'), async (req: Request, res: Response) => {
    try {
      const query = String((req.body && (req.body as any).query) || process.env.CKAN_LOBBYISTS_QUERY || 'lobbyist registry');
      const upserts = await ingestLobbyistsFromCKAN(query);
      res.json({ success: true, upserts });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh lobbyists data' });
    }
  });

  // Admin: trigger legal curated ingestion
  app.post('/api/admin/refresh/legal', jwtAuth, requirePermission('admin.news.manage'), async (req: Request, res: Response) => {
    try {
      const acts = Array.isArray((req.body as any)?.acts) ? (req.body as any).acts : [];
      const casesIn = Array.isArray((req.body as any)?.cases) ? (req.body as any).cases : [];
      const actsInserted = acts.length ? await ingestLegalActsCurated(acts) : 0;
      const casesInserted = casesIn.length ? await ingestLegalCasesCurated(casesIn) : 0;
      const federalActs = await ingestFederalActsFromJustice();
      const ccSections = await ingestCriminalCodeFromJustice();
      res.json({ success: true, actsInserted, casesInserted, federalActs, ccSections });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to refresh legal data' });
    }
  });
}


