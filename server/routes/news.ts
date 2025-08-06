import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { jwtAuth } from './auth.js';
import { eq, desc, and, count } from 'drizzle-orm';
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
      
      // For now, return mock news data since news_articles table doesn't exist
      const mockNews = [
        {
          id: 1,
          title: "Government Announces New Policy Initiative",
          summary: "The federal government has announced a comprehensive new policy initiative aimed at improving public services.",
          content: "The federal government today announced a comprehensive new policy initiative that will significantly impact public services across the country. This initiative represents a major step forward in addressing key challenges facing our nation.",
          category: "politics",
          source: "Government Press Release",
          sourceUrl: "https://example.com/news/1",
          imageUrl: "https://example.com/images/news1.jpg",
          tags: ["government", "policy", "public services"],
          isPublished: true,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          title: "Economic Growth Exceeds Expectations",
          summary: "Recent economic data shows growth exceeding analyst expectations, signaling strong economic recovery.",
          content: "Recent economic data released by Statistics Canada shows that economic growth has exceeded analyst expectations for the third consecutive quarter. This strong performance signals a robust economic recovery following recent challenges.",
          category: "economy",
          source: "Statistics Canada",
          sourceUrl: "https://example.com/news/2",
          imageUrl: "https://example.com/images/news2.jpg",
          tags: ["economy", "growth", "statistics"],
          isPublished: true,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Filter by category if specified
      let filteredNews = mockNews;
      if (category) {
        filteredNews = mockNews.filter(article => article.category === category);
      }
      
      // Filter by published status
      if (published === 'true') {
        filteredNews = filteredNews.filter(article => article.isPublished);
      }
      
      // Search functionality
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        filteredNews = filteredNews.filter(article => 
          article.title.toLowerCase().includes(searchTerm) ||
          article.content.toLowerCase().includes(searchTerm) ||
          article.summary.toLowerCase().includes(searchTerm)
        );
      }
      
      // Pagination
      const total = filteredNews.length;
      const paginatedNews = filteredNews.slice(offset, offset + limitNum);
      
      res.json({
        success: true,
        articles: paginatedNews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
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
  app.post("/api/news", jwtAuth, async (req: Request, res: Response) => {
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
      
      // For now, return success (news_articles table needs to be created)
      res.status(201).json({
        success: true,
        message: "News article created successfully",
        article: {
          id: Date.now(),
          ...validationResult.data,
          authorId: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create news article",
        error: (error as any)?.message || String(error)
      });
    }
  });
  
  // Update news article (admin only)
  app.put("/api/news/:id", jwtAuth, async (req: Request, res: Response) => {
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
      
      // For now, return success (news_articles table needs to be created)
      res.json({
        success: true,
        message: "News article updated successfully",
        article: {
          id: articleId,
          ...validationResult.data,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update news article",
        error: (error as any)?.message || String(error)
      });
    }
  });
  
  // Delete news article (admin only)
  app.delete("/api/news/:id", jwtAuth, async (req: Request, res: Response) => {
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
      
      // For now, return success (news_articles table needs to be created)
      res.json({
        success: true,
        message: "News article deleted successfully"
      });
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
      
      // For now, return mock trending news
      const trendingNews = [
        {
          id: 1,
          title: "Government Announces New Policy Initiative",
          summary: "The federal government has announced a comprehensive new policy initiative.",
          views: 1250,
          likes: 45,
          category: "politics",
          publishedAt: new Date()
        },
        {
          id: 2,
          title: "Economic Growth Exceeds Expectations",
          summary: "Recent economic data shows growth exceeding analyst expectations.",
          views: 980,
          likes: 32,
          category: "economy",
          publishedAt: new Date()
        }
      ].slice(0, limitNum);
      
      res.json({
        success: true,
        articles: trendingNews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch trending news",
        error: (error as any)?.message || String(error)
      });
    }
  });
} 