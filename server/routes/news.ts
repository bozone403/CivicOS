import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { newsArticles, propagandaDetection } from "../../shared/schema.js";
import { eq, and, desc, sql, count, like, or, gte } from "drizzle-orm";
import * as cheerio from "cheerio";
import { ResponseFormatter } from "../utils/responseFormatter.js";

export function registerNewsRoutes(app: Express) {
  // Get all news articles with real Government sources
  app.get('/api/news', async (req: Request, res: Response) => {
    try {
      const { source, bias, limit = 50, offset = 0 } = req.query;
      
      // Try to fetch real Government news first
      let articles;
      
      try {
        // Fetch real news from Government of Canada sources
        const realNews = await fetchGovernmentNews();
        
        if (realNews && realNews.length > 0) {
          articles = realNews;
        } else {
          // Fallback to database news
          const dbArticles = await db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt));
          articles = dbArticles;
        }
      } catch (error) {
        // console.error removed for production
        // Fallback to database news
        const dbArticles = await db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt));
        articles = dbArticles;
      }

      // Apply filters
      if (source) {
        articles = articles.filter((article: any) => article.source === source);
      }
      if (bias) {
        articles = articles.filter((article: any) => article.bias === bias);
      }

      // Apply pagination
      const startIndex = parseInt(offset as string) || 0;
      const endIndex = startIndex + (parseInt(limit as string) || 50);
      articles = articles.slice(startIndex, endIndex);

      return ResponseFormatter.success(res, articles, "News articles retrieved successfully");
    } catch (error) {
      // console.error removed for production
      return ResponseFormatter.error(res, "Failed to fetch news articles", 500);
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
      // console.error removed for production
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
      // console.error removed for production
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
      // console.error removed for production
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
      // console.error removed for production
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
      // console.error removed for production
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
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch propaganda analysis' });
    }
  });
} 

// Helper function to fetch real Government news
async function fetchGovernmentNews() {
  const newsSources = [
    {
      name: 'Government of Canada News',
      url: 'https://www.canada.ca/en/news.html',
      parser: parseGovernmentNews
    },
    {
      name: 'Parliament of Canada',
      url: 'https://www.ourcommons.ca/en/news',
      parser: parseParliamentNews
    },
    {
      name: 'Prime Minister Office',
      url: 'https://pm.gc.ca/en/news',
      parser: parsePMONews
    }
  ];

  let allNews: any[] = [];

  for (const source of newsSources) {
    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'CivicOS-NewsCollector/1.0 (Government Transparency Platform)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const parsedNews = await source.parser(html);
        allNews = [...allNews, ...parsedNews];
      }
    } catch (error) {
      // Continue to next source if one fails
      continue;
    }
  }

  return allNews.slice(0, 20); // Limit to 20 articles
}

async function parseGovernmentNews(html: string) {
  const $ = cheerio.load(html);
  const articles: any[] = [];

  $('.news-item, .article-item, .content-item').each((index, element) => {
    const $article = $(element);
    
    const title = $article.find('h2, h3, .title').text().trim();
    const summary = $article.find('.summary, .description, p').text().trim();
    const url = $article.find('a').attr('href');
    
    if (title && summary) {
      articles.push({
        id: `gov-${Date.now()}-${index}`,
        title,
        summary: summary.substring(0, 200),
        source: 'Government of Canada',
        sourceId: 1,
        url: url ? `https://www.canada.ca${url}` : undefined,
        publishedAt: new Date().toISOString(),
        category: 'Government',
        region: 'National',
        credibility: 95,
        bias: 'Center',
        readTime: Math.ceil(summary.length / 200),
        tags: ['Government', 'Canada', 'Policy'],
        verified: true
      });
    }
  });

  return articles;
}

async function parseParliamentNews(html: string) {
  const $ = cheerio.load(html);
  const articles: any[] = [];

  $('.news-item, .article-item').each((index, element) => {
    const $article = $(element);
    
    const title = $article.find('h2, h3, .title').text().trim();
    const summary = $article.find('.summary, .description, p').text().trim();
    const url = $article.find('a').attr('href');
    
    if (title && summary) {
      articles.push({
        id: `parl-${Date.now()}-${index}`,
        title,
        summary: summary.substring(0, 200),
        source: 'Parliament of Canada',
        sourceId: 2,
        url: url ? `https://www.ourcommons.ca${url}` : undefined,
        publishedAt: new Date().toISOString(),
        category: 'Politics',
        region: 'National',
        credibility: 92,
        bias: 'Center',
        readTime: Math.ceil(summary.length / 200),
        tags: ['Parliament', 'Politics', 'Legislation'],
        verified: true
      });
    }
  });

  return articles;
}

async function parsePMONews(html: string) {
  const $ = cheerio.load(html);
  const articles: any[] = [];

  $('.news-item, .article-item').each((index, element) => {
    const $article = $(element);
    
    const title = $article.find('h2, h3, .title').text().trim();
    const summary = $article.find('.summary, .description, p').text().trim();
    const url = $article.find('a').attr('href');
    
    if (title && summary) {
      articles.push({
        id: `pmo-${Date.now()}-${index}`,
        title,
        summary: summary.substring(0, 200),
        source: 'Prime Minister Office',
        sourceId: 3,
        url: url ? `https://pm.gc.ca${url}` : undefined,
        publishedAt: new Date().toISOString(),
        category: 'Politics',
        region: 'National',
        credibility: 90,
        bias: 'Center',
        readTime: Math.ceil(summary.length / 200),
        tags: ['Prime Minister', 'Government', 'Policy'],
        verified: true
      });
    }
  });

  return articles;
} 