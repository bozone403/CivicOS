import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { users, socialPosts, socialComments, notifications, newsArticles, votes } from '../../shared/schema.js';
import { count } from 'drizzle-orm';
import { jwtAuth } from './auth.js';
import { requirePermission } from '../utils/permissionService.js';

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
        .limit(limit);

      const recentComments = await db
        .select()
        .from(socialComments)
        .orderBy((socialComments.createdAt as any).desc?.() || (socialComments.createdAt as any))
        .limit(limit);

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
}


