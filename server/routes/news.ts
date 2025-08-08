import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { jwtAuth } from './auth.js';
import { eq, desc, and, count, ilike, sql } from 'drizzle-orm';
import { newsArticles } from '../../shared/schema.js';
import { requirePermission } from '../utils/permissionService.js';
import { z } from 'zod';

// Input validation schemas
const createNewsArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  summary: z.string().optional(),
  category: z.enum(['politics', 'economy', 'health', 'education', 'environment', 'technology', 'international']).default('politics'),
  source: z.string().min(1, 'Source is required'),
  sourceUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false)
});

const updateNewsArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long').optional(),
  summary: z.string().optional(),
  category: z.enum(['politics', 'economy', 'health', 'education', 'environment', 'technology', 'international']).optional(),
  source: z.string().min(1, 'Source is required').optional(),
  sourceUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional()
});

export function registerNewsRoutes(app: Express) {
  
  // Get all news articles
  app.get("/api/news", async (req: Request, res: Response) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category, 
        published = 'true',
        search 
      } = req.query;
      
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;
      
      const whereClauses: any[] = [];
      if (category) {
        whereClauses.push(eq(sql`LOWER(${newsArticles.category})`, String(category).toLowerCase()));
      }
      if (published === 'true') {
        whereClauses.push(sql`${newsArticles.publishedAt} IS NOT NULL`);
      }
      if (search) {
        const term = `%${String(search)}%`;
        whereClauses.push(ilike(newsArticles.title, term));
      }

      const base = db.select().from(newsArticles);
      const totalQuery = db.select({ c: count() }).from(newsArticles);
      const whereCombined = whereClauses.length ? and(...whereClauses) : undefined;
      const [{ c: total }] = whereCombined ? await totalQuery.where(whereCombined) : await totalQuery;
      const articles = whereCombined
        ? await base.where(whereCombined).orderBy(desc(newsArticles.publishedAt ?? newsArticles.createdAt)).limit(limitNum).offset(offset)
        : await base.orderBy(desc(newsArticles.publishedAt ?? newsArticles.createdAt)).limit(limitNum).offset(offset);

      res.json({
        success: true,
        articles,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil((Number(total) || 0) / limitNum) }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch news articles",
        error: (error as any)?.message || String(error)
      });
    }
  });
  
  // Get single news article
  app.get("/api/news/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const articleId = Number(id);
      
      if (isNaN(articleId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid article ID"
        });
      }
      
      // For now, return mock article data
      const mockArticle = {
        id: articleId,
        title: "Government Announces New Policy Initiative",
        summary: "The federal government has announced a comprehensive new policy initiative aimed at improving public services.",
        content: "The federal government today announced a comprehensive new policy initiative that will significantly impact public services across the country. This initiative represents a major step forward in addressing key challenges facing our nation. The policy includes several key components designed to improve efficiency and effectiveness of government services.",
        category: "politics",
        source: "Government Press Release",
        sourceUrl: "https://example.com/news/1",
        imageUrl: "https://example.com/images/news1.jpg",
        tags: ["government", "policy", "public services"],
        isPublished: true,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 1250,
        likes: 45,
        comments: 12
      };
      
      res.json({
        success: true,
        article: mockArticle
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch news article",
        error: (error as any)?.message || String(error)
      });
    }
  });
  
  // Create news article (admin only)
  app.post("/api/news", jwtAuth, requirePermission('admin.news.manage'), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      const validationResult = createNewsArticleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: validationResult.error.errors
        });
      }
      
      const payload = validationResult.data;
      const [row] = await db.insert(newsArticles).values({
        title: payload.title,
        content: payload.content,
        source: payload.source,
        url: payload.sourceUrl,
        summary: payload.summary,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: payload.isPublished ? new Date() : null,
      }).returning();
      res.status(201).json({ success: true, article: row });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create news article",
        error: (error as any)?.message || String(error)
      });
    }
  });
  
  // Update news article (admin only)
  app.put("/api/news/:id", jwtAuth, requirePermission('admin.news.manage'), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      const { id } = req.params;
      const articleId = Number(id);
      
      if (isNaN(articleId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid article ID"
        });
      }
      
      const validationResult = updateNewsArticleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: validationResult.error.errors
        });
      }
      
      const payload = validationResult.data;
      const updates: any = { updatedAt: new Date() };
      if (payload.title) updates.title = payload.title;
      if (payload.content) updates.content = payload.content;
      if (payload.summary) updates.summary = payload.summary;
      if (payload.source) updates.source = payload.source;
      if (payload.sourceUrl) updates.url = payload.sourceUrl;
      if (typeof payload.isPublished === 'boolean') updates.publishedAt = payload.isPublished ? new Date() : null;
      const [row] = await db.update(newsArticles).set(updates).where(eq(newsArticles.id, articleId)).returning();
      res.json({ success: true, article: row });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update news article",
        error: (error as any)?.message || String(error)
      });
    }
  });
  
  // Delete news article (admin only)
  app.delete("/api/news/:id", jwtAuth, requirePermission('admin.news.manage'), async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      const { id } = req.params;
      const articleId = Number(id);
      
      if (isNaN(articleId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid article ID"
        });
      }
      
      await db.delete(newsArticles).where(eq(newsArticles.id, articleId));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete news article",
        error: (error as any)?.message || String(error)
      });
    }
  });
  
  // Get news categories
  app.get("/api/news/categories", async (req: Request, res: Response) => {
    try {
      const categories = [
        { id: 'politics', name: 'Politics', count: 15 },
        { id: 'economy', name: 'Economy', count: 12 },
        { id: 'health', name: 'Health', count: 8 },
        { id: 'education', name: 'Education', count: 6 },
        { id: 'environment', name: 'Environment', count: 9 },
        { id: 'technology', name: 'Technology', count: 11 },
        { id: 'international', name: 'International', count: 14 }
      ];
      
      res.json({
        success: true,
        categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch news categories",
        error: (error as any)?.message || String(error)
      });
    }
  });
  
  // Get trending news
  app.get("/api/news/trending", async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      const limitNum = Number(limit);
      
      const articles = await db
        .select()
        .from(newsArticles)
        .where(sql`${newsArticles.publishedAt} IS NOT NULL`)
        .orderBy(desc(newsArticles.publishedAt))
        .limit(limitNum);
      res.json({ success: true, articles });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch trending news",
        error: (error as any)?.message || String(error)
      });
    }
  });
} 