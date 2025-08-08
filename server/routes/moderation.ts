import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { socialComments, socialPosts } from '../../shared/schema.js';
import { desc, eq, count } from 'drizzle-orm';
import { jwtAuth } from './auth.js';
import { requirePermission } from '../utils/permissionService.js';

export function registerModerationRoutes(app: Express) {
  // List recent comments (for moderation)
  app.get('/api/moderation/comments/recent', jwtAuth, requirePermission('moderate_comments'), async (req: Request, res: Response) => {
    try {
      const { limit = '50', offset = '0' } = req.query as any;
      const rows = await db
        .select()
        .from(socialComments)
        .orderBy(desc(socialComments.createdAt))
        .limit(Math.min(parseInt(String(limit)) || 50, 200))
        .offset(parseInt(String(offset)) || 0);
      res.json({ success: true, items: rows });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
  });

  // Remove a comment
  app.delete('/api/moderation/comments/:id', jwtAuth, requirePermission('moderate_comments'), async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
      await db.delete(socialComments).where(eq(socialComments.id, id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to remove comment' });
    }
  });

  // List recent posts (for moderation)
  app.get('/api/moderation/posts/recent', jwtAuth, requirePermission('reject_content'), async (req: Request, res: Response) => {
    try {
      const { limit = '50', offset = '0' } = req.query as any;
      const rows = await db
        .select()
        .from(socialPosts)
        .orderBy(desc(socialPosts.createdAt))
        .limit(Math.min(parseInt(String(limit)) || 50, 200))
        .offset(parseInt(String(offset)) || 0);
      res.json({ success: true, items: rows });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
  });

  // Remove a post
  app.delete('/api/moderation/posts/:id', jwtAuth, requirePermission('reject_content'), async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
      await db.delete(socialPosts).where(eq(socialPosts.id, id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to remove post' });
    }
  });

  // Aggregated moderation summary
  app.get('/api/moderation/summary', jwtAuth, requirePermission('moderate_comments'), async (req: Request, res: Response) => {
    try {
      const [{ c: commentsTotal }] = await db.select({ c: count() }).from(socialComments);
      const [{ c: postsTotal }] = await db.select({ c: count() }).from(socialPosts);

      res.json({
        success: true,
        summary: {
          commentsTotal: Number(commentsTotal) || 0,
          postsTotal: Number(postsTotal) || 0,
        }
      });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to load moderation summary' });
    }
  });
}


