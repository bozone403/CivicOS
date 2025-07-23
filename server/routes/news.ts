import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { newsArticles, propagandaDetection } from "../../shared/schema.js";
import { eq, and, desc, sql, count, like, or, gte } from "drizzle-orm";

export function registerNewsRoutes(app: Express) {
  // Get all news articles
  app.get('/api/news', async (req: Request, res: Response) => {
    try {
      const { source, bias, limit = 50, offset = 0 } = req.query;
      
      let query = db.select().from(newsArticles);
              const conditions: any[] = [];

      if (source) {
        conditions.push(eq(newsArticles.source, source as string));
      }
      if (bias) {
        conditions.push(eq(newsArticles.bias, bias as string));
      }

      if (conditions.length > 0) {
        (query as any) = query.where(and(...conditions));
      }

      const articles = await query
        .orderBy(desc(newsArticles.publishedAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      res.json(articles);
    } catch (error) {
      console.error('Error fetching news articles:', error);
      res.status(500).json({ error: 'Failed to fetch news articles' });
    }
  });

  // Get news article by ID
  app.get('/api/news/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [article] = await db
        .select()
        .from(newsArticles)
        .where(eq(newsArticles.id, parseInt(id)));

      if (!article) {
        return res.status(404).json({ message: 'News article not found' });
      }

      // Get propaganda analysis
      const [propaganda] = await db
        .select()
        .from(propagandaDetection)
        .where(eq(propagandaDetection.articleId, parseInt(id)));

      res.json({
        ...article,
        propagandaAnalysis: propaganda || null
      });
    } catch (error) {
      console.error('Error fetching news article:', error);
      res.status(500).json({ error: 'Failed to fetch news article' });
    }
  });

  // Search news articles
  app.get('/api/news/search', async (req: Request, res: Response) => {
    try {
      const { q, source, bias, credibility } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search query required' });
      }

      const conditions = [
        or(
          like(newsArticles.title, `%${q}%`),
          like(newsArticles.content, `%${q}%`),
          like(newsArticles.summary, `%${q}%`)
        )
      ];

      if (source) {
        conditions.push(eq(newsArticles.source, source as string));
      }
      if (bias) {
        conditions.push(eq(newsArticles.bias, bias as string));
      }
      if (credibility) {
        conditions.push(gte(newsArticles.credibilityScore as any, parseInt(credibility as string)));
      }

      const results = await db
        .select()
        .from(newsArticles)
        .where(and(...conditions))
        .orderBy(desc(newsArticles.publishedAt))
        .limit(20);

      res.json(results);
    } catch (error) {
      console.error('Error searching news:', error);
      res.status(500).json({ error: 'Failed to search news' });
    }
  });

  // Get trending news
  app.get('/api/news/trending', async (req: Request, res: Response) => {
    try {
      const { hours = 24 } = req.query;
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - parseInt(hours as string));

      const trending = await db
        .select()
        .from(newsArticles)
        .where(gte(newsArticles.publishedAt, hoursAgo))
        .orderBy(desc(newsArticles.publishedAt))
        .limit(10);

      res.json(trending);
    } catch (error) {
      console.error('Error fetching trending news:', error);
      res.status(500).json({ error: 'Failed to fetch trending news' });
    }
  });

  // Get news statistics
  app.get('/api/news/stats', async (req: Request, res: Response) => {
    try {
      const [totalArticles] = await db
        .select({ count: count() })
        .from(newsArticles);

      const sourceStats = await db.execute(sql`
        SELECT source, COUNT(*) as count, AVG(CAST(credibility_score AS DECIMAL)) as avgCredibility
        FROM news_articles 
        GROUP BY source 
        ORDER BY count DESC
        LIMIT 10
      `);

      const biasStats = await db.execute(sql`
        SELECT bias, COUNT(*) as count
        FROM news_articles 
        WHERE bias IS NOT NULL
        GROUP BY bias
      `);

      const recentArticles = await db
        .select()
        .from(newsArticles)
        .orderBy(desc(newsArticles.publishedAt))
        .limit(5);

      res.json({
        totalArticles: totalArticles?.count || 0,
        sourceBreakdown: sourceStats.rows,
        biasBreakdown: biasStats.rows,
        recentArticles
      });
    } catch (error) {
      console.error('Error fetching news stats:', error);
      res.status(500).json({ error: 'Failed to fetch news statistics' });
    }
  });

  // Get news sources
  app.get('/api/news/sources', async (req: Request, res: Response) => {
    try {
      const sources = await db.execute(sql`
        SELECT DISTINCT source, COUNT(*) as articleCount, AVG(CAST(credibility_score AS DECIMAL)) as avgCredibility
        FROM news_articles 
        GROUP BY source 
        ORDER BY articleCount DESC
      `);

      res.json(sources.rows);
    } catch (error) {
      console.error('Error fetching news sources:', error);
      res.status(500).json({ error: 'Failed to fetch news sources' });
    }
  });

  // Get propaganda analysis for article
  app.get('/api/news/:id/propaganda', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [propaganda] = await db
        .select()
        .from(propagandaDetection)
        .where(eq(propagandaDetection.articleId, parseInt(id)));

      if (!propaganda) {
        return res.status(404).json({ message: 'Propaganda analysis not found' });
      }

      res.json(propaganda);
    } catch (error) {
      console.error('Error fetching propaganda analysis:', error);
      res.status(500).json({ error: 'Failed to fetch propaganda analysis' });
    }
  });
} 