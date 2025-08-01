import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { announcements } from '../../shared/schema.js';
import { jwtAuth } from './auth.js';
import { PermissionService } from '../utils/permissionService.js';
import { eq, and, desc, asc } from 'drizzle-orm';
import { users } from '../../shared/schema.js';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

// Input validation schemas
const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  targetAudience: z.enum(['all', 'citizens', 'press', 'government']).default('all'),
  status: z.enum(['draft', 'published', 'archived']).default('published')
});

const updateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long').optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  targetAudience: z.enum(['all', 'citizens', 'press', 'government']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isPinned: z.boolean().optional()
});

export function registerAnnouncementsRoutes(app: Express) {

  // Get all announcements (public)
  app.get("/api/announcements", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status = 'published', priority } = req.query;
    
    // Validate query parameters
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number"
      });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit (must be between 1 and 100)"
      });
    }

    const offset = (pageNum - 1) * limitNum;

    // Temporary simple query to avoid schema issues
    const results = await db.execute(sql`
      SELECT id, title, content, priority, is_active, author_id, author_name, 
             author_membership_type, status, target_audience, is_pinned, 
             views_count, published_at, expires_at, created_at, updated_at
      FROM announcements 
      WHERE status = ${status}
      ORDER BY is_pinned DESC, created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `);

    const total = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM announcements 
      WHERE status = ${status}
    `);

    res.json({
      success: true,
      announcements: results.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(total.rows[0]?.count) || 0,
        totalPages: Math.ceil((Number(total.rows[0]?.count) || 0) / limitNum)
      }
    });

  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: (error as any)?.message || String(error)
    });
  }
});

  // Get single announcement
  app.get("/api/announcements/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    const announcementId = Number(id);
    if (isNaN(announcementId) || announcementId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID"
      });
    }

    const announcement = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);

    if (announcement.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    // Increment view count
    await db
      .update(announcements)
      .set({ viewsCount: (announcement[0].viewsCount || 0) + 1 })
      .where(eq(announcements.id, announcementId));

    res.json({
      success: true,
      announcement: announcement[0]
    });

  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcement",
      error: (error as any)?.message || String(error)
    });
  }
});

  // Create announcement (requires permission)
  app.post("/api/announcements", jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Validate input
    const validationResult = createAnnouncementSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: validationResult.error.errors
      });
    }

    const canCreate = await PermissionService.canCreateContent(
      userId, 
      user[0].membershipType || 'citizen', 
      'announcement'
    );

    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create announcements"
      });
    }

    const {
      title,
      content,
      priority = 'normal',
      targetAudience = 'all',
      status = 'published'
    } = validationResult.data;

    const announcement = await db.insert(announcements).values({
      title,
      content,
      authorId: userId,
      authorName: `${user[0].firstName || ''} ${user[0].lastName || ''}`.trim() || user[0].email || 'Anonymous',
      authorMembershipType: user[0].membershipType || 'citizen',
      priority,
      targetAudience,
      status,
      publishedAt: status === 'published' ? new Date() : null
    }).returning();

    res.json({
      success: true,
      message: "Announcement created successfully",
      announcement: announcement[0]
    });

  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
      error: (error as any)?.message || String(error)
    });
  }
});

  // Update announcement (requires permission)
  app.put("/api/announcements/:id", jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { id } = req.params;
    
    // Validate ID parameter
    const announcementId = Number(id);
    if (isNaN(announcementId) || announcementId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID"
      });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Validate input
    const validationResult = updateAnnouncementSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: validationResult.error.errors
      });
    }

    // Check if user can edit announcements
    const canEdit = await PermissionService.canEditContent(
      userId, 
      user[0].membershipType || 'citizen', 
      'announcement'
    );

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to edit announcements"
      });
    }

    // Get existing announcement
    const existing = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    // Check if user is the author or has admin permissions
    const isAuthor = existing[0].authorId === userId;
    const isAdmin = await PermissionService.isAdmin(userId, user[0].membershipType || 'citizen');

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own announcements"
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (validationResult.data.title !== undefined) updateData.title = validationResult.data.title;
    if (validationResult.data.content !== undefined) updateData.content = validationResult.data.content;
    if (validationResult.data.priority !== undefined) updateData.priority = validationResult.data.priority;
    if (validationResult.data.targetAudience !== undefined) updateData.targetAudience = validationResult.data.targetAudience;
    if (validationResult.data.status !== undefined) updateData.status = validationResult.data.status;
    if (validationResult.data.isPinned !== undefined) updateData.isPinned = validationResult.data.isPinned;

    // Set publishedAt if status is changing to published
    if (validationResult.data.status === 'published' && existing[0].status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const updated = await db
      .update(announcements)
      .set(updateData)
      .where(eq(announcements.id, announcementId))
      .returning();

    res.json({
      success: true,
      message: "Announcement updated successfully",
      announcement: updated[0]
    });

  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      success: false,
      message: "Failed to update announcement",
      error: (error as any)?.message || String(error)
    });
  }
});

  // Delete announcement (requires permission)
  app.delete("/api/announcements/:id", jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { id } = req.params;
    
    // Validate ID parameter
    const announcementId = Number(id);
    if (isNaN(announcementId) || announcementId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID"
      });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user can delete announcements
    const canDelete = await PermissionService.canDeleteContent(
      userId, 
      user[0].membershipType || 'citizen', 
      'announcement'
    );

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete announcements"
      });
    }

    // Get existing announcement
    const existing = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    // Check if user is the author or has admin permissions
    const isAuthor = existing[0].authorId === userId;
    const isAdmin = await PermissionService.isAdmin(userId, user[0].membershipType || 'citizen');

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own announcements"
      });
    }

    await db
      .delete(announcements)
      .where(eq(announcements.id, announcementId));

    res.json({
      success: true,
      message: "Announcement deleted successfully"
    });

  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      error: (error as any)?.message || String(error)
    });
  }
});

  // Get user's announcements
  app.get("/api/announcements/user/me", jwtAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { page = 1, limit = 10 } = req.query;
    
    // Validate query parameters
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number"
      });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit (must be between 1 and 100)"
      });
    }

    const offset = (pageNum - 1) * limitNum;

    const results = await db
      .select()
      .from(announcements)
      .where(eq(announcements.authorId, userId))
      .orderBy(desc(announcements.createdAt))
      .limit(limitNum)
      .offset(offset);

    const total = await db
      .select({ count: announcements.id })
      .from(announcements)
      .where(eq(announcements.authorId, userId));

    res.json({
      success: true,
      announcements: results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total.length,
        totalPages: Math.ceil(total.length / limitNum)
      }
    });

  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      success: false,
      message: "Failed to fetch user announcements",
      error: (error as any)?.message || String(error)
    });
  }
});

} 