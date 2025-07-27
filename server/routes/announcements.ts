import express, { Request, Response } from 'express';
import { db } from '../db';
import { announcements } from '../../shared/schema';
import { jwtAuth } from './auth';
import { PermissionService } from '../utils/permissionService';
import { eq, and, desc, asc } from 'drizzle-orm';
import { users } from '../../shared/schema';

const app = express.Router();

// Get all announcements (public)
app.get("/api/announcements", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status = 'published', priority } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = [eq(announcements.status, status as string)];
    
    if (priority) {
      whereConditions.push(eq(announcements.priority, priority as string));
    }

    const results = await db
      .select()
      .from(announcements)
      .where(and(...whereConditions))
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt))
      .limit(Number(limit))
      .offset(offset);

    const total = await db
      .select({ count: announcements.id })
      .from(announcements)
      .where(and(...whereConditions));

    res.json({
      success: true,
      announcements: results,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total.length,
        totalPages: Math.ceil(total.length / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get announcements error:', error);
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

    const announcement = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, Number(id)))
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
      .where(eq(announcements.id, Number(id)));

    res.json({
      success: true,
      announcement: announcement[0]
    });

  } catch (error) {
    console.error('Get announcement error:', error);
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
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
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
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required"
      });
    }

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
    console.error('Create announcement error:', error);
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
    const { id } = req.params;
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
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
      .where(eq(announcements.id, Number(id)))
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

    const {
      title,
      content,
      priority,
      targetAudience,
      status,
      isPinned
    } = req.body;

    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (priority !== undefined) updateData.priority = priority;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (status !== undefined) updateData.status = status;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    // Set publishedAt if status is changing to published
    if (status === 'published' && existing[0].status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const updated = await db
      .update(announcements)
      .set(updateData)
      .where(eq(announcements.id, Number(id)))
      .returning();

    res.json({
      success: true,
      message: "Announcement updated successfully",
      announcement: updated[0]
    });

  } catch (error) {
    console.error('Update announcement error:', error);
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
    const { id } = req.params;
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
      .where(eq(announcements.id, Number(id)))
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
      .where(eq(announcements.id, Number(id)));

    res.json({
      success: true,
      message: "Announcement deleted successfully"
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
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
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const results = await db
      .select()
      .from(announcements)
      .where(eq(announcements.authorId, userId))
      .orderBy(desc(announcements.createdAt))
      .limit(Number(limit))
      .offset(offset);

    const total = await db
      .select({ count: announcements.id })
      .from(announcements)
      .where(eq(announcements.authorId, userId));

    res.json({
      success: true,
      announcements: results,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total.length,
        totalPages: Math.ceil(total.length / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get user announcements error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user announcements",
      error: (error as any)?.message || String(error)
    });
  }
});

export { app as announcementsRoutes }; 