import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { 
  users, 
  socialPosts, 
  socialComments, 
  socialLikes, 
  commentLikes,
  userFriends, 
  userMessages, 
  notifications, 
  userActivity, 
  socialShares, 
  socialBookmarks,
  userFollows,
  userBlocks
} from "../../shared/schema.js";
import { eq, and, or, desc, asc, gte, ne, inArray, count, sql } from "drizzle-orm";
import { jwtAuth } from './auth.js';
import pino from "pino";
import { z } from 'zod';
import { socialRateLimit } from '../middleware/rateLimit.js';
import { recordEvent } from '../utils/metrics.js';

const logger = pino();

// Use centralized JWT Auth middleware from auth routes

export function registerSocialRoutes(app: Express) {
  
  // ===== CORE SOCIAL FEED ENDPOINTS =====
  
  // GET /api/social/feed - Main social feed endpoint
  app.get('/api/social/feed', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { limit = 20, offset = 0 } = req.query;
      
      // Get posts with author information and engagement counts
      // Filter out blocked users and respect privacy settings
      const posts = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          imageUrl: socialPosts.imageUrl,
          visibility: socialPosts.visibility,
          createdAt: socialPosts.createdAt,
          updatedAt: socialPosts.updatedAt,
          authorId: users.id,
          authorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
          authorUsername: users.username,
          authorImage: users.profileImageUrl,
          authorCivicLevel: users.civicLevel,
          likesCount: sql<number>`(SELECT COUNT(*) FROM ${socialLikes} WHERE ${socialLikes.postId} = ${socialPosts.id})`,
          commentsCount: sql<number>`(SELECT COUNT(*) FROM ${socialComments} WHERE ${socialComments.postId} = ${socialPosts.id})`,
          sharesCount: sql<number>`(SELECT COUNT(*) FROM ${socialShares} WHERE ${socialShares.postId} = ${socialPosts.id})`,
          isLiked: sql<boolean>`EXISTS(SELECT 1 FROM ${socialLikes} WHERE ${socialLikes.postId} = ${socialPosts.id} AND ${socialLikes.userId} = ${userId})`,
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .where(and(
          // Bidirectional block filtering: exclude users blocked by requester OR who have blocked requester
          sql`NOT EXISTS(SELECT 1 FROM ${userBlocks} WHERE (${userBlocks.userId} = ${userId} AND ${userBlocks.blockedUserId} = ${socialPosts.userId}) OR (${userBlocks.userId} = ${socialPosts.userId} AND ${userBlocks.blockedUserId} = ${userId}))`,
          // Respect visibility settings: public posts, own posts, OR friends-only posts where requester is an accepted friend
          or(
            eq(socialPosts.visibility, 'public'),
            eq(socialPosts.userId, userId),
            and(
              eq(socialPosts.visibility, 'friends'),
              sql`EXISTS(SELECT 1 FROM ${userFriends} WHERE ((${userFriends.userId} = ${userId} AND ${userFriends.friendId} = ${socialPosts.userId}) OR (${userFriends.userId} = ${socialPosts.userId} AND ${userFriends.friendId} = ${userId})) AND ${userFriends.status} = 'accepted')`
            )
          )
        ))
        .orderBy(desc(socialPosts.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      res.json({
        success: true,
        posts,
        pagination: { limit: Number(limit), offset: Number(offset), total: posts.length },
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Feed error:', error);
      res.status(500).json({ success: false, error: "Failed to fetch social feed" });
    }
  });
  
  // GET /api/social/posts - Main posts endpoint (alias for feed with user filtering)
  app.get('/api/social/posts', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { limit = 20, offset = 0, authorId } = req.query;
      
      // Build where clause with privacy/block filtering
      const conditions = [
        // Bidirectional block filtering: exclude users blocked by requester OR who have blocked requester
        sql`NOT EXISTS(SELECT 1 FROM ${userBlocks} WHERE (${userBlocks.userId} = ${userId} AND ${userBlocks.blockedUserId} = ${socialPosts.userId}) OR (${userBlocks.userId} = ${socialPosts.userId} AND ${userBlocks.blockedUserId} = ${userId}))`,
        // Respect visibility settings: public posts, own posts, OR friends-only posts where requester is an accepted friend
        or(
          eq(socialPosts.visibility, 'public'),
          eq(socialPosts.userId, userId),
          and(
            eq(socialPosts.visibility, 'friends'),
            sql`EXISTS(SELECT 1 FROM ${userFriends} WHERE ((${userFriends.userId} = ${userId} AND ${userFriends.friendId} = ${socialPosts.userId}) OR (${userFriends.userId} = ${socialPosts.userId} AND ${userFriends.friendId} = ${userId})) AND ${userFriends.status} = 'accepted')`
          )
        )
      ];
      
      if (authorId) {
        conditions.push(eq(socialPosts.userId, authorId as string));
      }
      
      const posts = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          imageUrl: socialPosts.imageUrl,
          visibility: socialPosts.visibility,
          createdAt: socialPosts.createdAt,
          authorId: users.id,
          authorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
          authorUsername: users.username,
          authorImage: users.profileImageUrl,
          likesCount: sql<number>`(SELECT COUNT(*) FROM ${socialLikes} WHERE ${socialLikes.postId} = ${socialPosts.id})`,
          commentsCount: sql<number>`(SELECT COUNT(*) FROM ${socialComments} WHERE ${socialComments.postId} = ${socialPosts.id})`,
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(socialPosts.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      res.json({ success: true, posts, pagination: { limit: Number(limit), offset: Number(offset) } });
    } catch (error) {
      logger.error('Posts error:', error);
      res.status(500).json({ success: false, error: "Failed to fetch posts" });
    }
  });

  // GET /api/social - Main social endpoint
  app.get('/api/social', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        message: "Social endpoint working (fallback mode - database schema needs fixing)",
        endpoints: [
          "/api/social/posts - Social posts feed",
          "/api/social/comments - Comment system",
          "/api/social/friends - Friend management",
          "/api/social/messages - Messaging system"
        ],
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch social data" });
    }
  });

  // POST /api/social/posts - Create a new post
  app.post('/api/social/posts', jwtAuth, socialRateLimit, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { content, imageUrl, visibility = 'public' } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Post content is required" });
      }

      const [newPost] = await db.insert(socialPosts).values({
        userId,
        content: content.trim(),
        imageUrl: imageUrl || null,
        visibility,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Record activity
      await db.insert(userActivity).values({
        userId,
        type: 'post_created',
        data: { postId: newPost.id },
        createdAt: new Date()
      }).catch(() => {}); // Ignore activity errors

      res.json({ success: true, post: newPost });
    } catch (error) {
      logger.error('Create post error:', error);
      res.status(500).json({ success: false, error: "Failed to create post" });
    }
  });

  // GET /api/social/comments - Get comments for a post
  app.get('/api/social/comments', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { postId } = req.query;
      if (!postId) {
        return res.status(400).json({ success: false, error: "postId is required" });
      }

      const comments = await db
        .select({
          id: socialComments.id,
          content: socialComments.content,
          createdAt: socialComments.createdAt,
          authorId: users.id,
          authorName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
          authorImage: users.profileImageUrl,
          likesCount: sql<number>`(SELECT COUNT(*) FROM comment_likes WHERE comment_id = ${socialComments.id})`,
        })
        .from(socialComments)
        .leftJoin(users, eq(socialComments.userId, users.id))
        .where(eq(socialComments.postId, Number(postId)))
        .orderBy(desc(socialComments.createdAt));

      res.json({ success: true, comments });
    } catch (error) {
      logger.error('Comments error:', error);
      res.status(500).json({ success: false, error: "Failed to fetch comments" });
    }
  });

  // GET /api/social/friends - Get friends (delegates to friends route for full functionality)
  app.get('/api/social/friends', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      
      const friends = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          civicLevel: users.civicLevel,
        })
        .from(userFriends)
        .innerJoin(users, eq(userFriends.friendId, users.id))
        .where(and(
          eq(userFriends.userId, userId),
          eq(userFriends.status, 'accepted')
        ));

      res.json({ success: true, friends });
    } catch (error) {
      logger.error('Friends error:', error);
      res.status(500).json({ success: false, error: "Failed to fetch friends" });
    }
  });

  // GET /api/social/messages - Get recent messages (use /api/messages/conversations for full functionality)
  app.get('/api/social/messages', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { limit = 10 } = req.query;
      
      const messages = await db
        .select({
          id: userMessages.id,
          content: userMessages.content,
          senderId: userMessages.senderId,
          recipientId: userMessages.recipientId,
          isRead: userMessages.isRead,
          createdAt: userMessages.createdAt,
        })
        .from(userMessages)
        .where(or(
          eq(userMessages.senderId, userId),
          eq(userMessages.recipientId, userId)
        ))
        .orderBy(desc(userMessages.createdAt))
        .limit(Number(limit));

      res.json({ success: true, messages });
    } catch (error) {
      logger.error('Messages error:', error);
      res.status(500).json({ success: false, error: "Failed to fetch messages" });
    }
  });

  // GET /api/social/notifications - Get notifications
  app.get('/api/social/notifications', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { limit = 20 } = req.query;
      
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(Number(limit));

      res.json({ success: true, notifications: userNotifications });
    } catch (error) {
      logger.error('Notifications error:', error);
      res.status(500).json({ success: false, error: "Failed to fetch notifications" });
    }
  });

  // GET /api/social/stats - Get user stats
  app.get('/api/social/stats', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      const [postsCount] = await db.select({ count: count() }).from(socialPosts).where(eq(socialPosts.userId, userId));
      const [commentsCount] = await db.select({ count: count() }).from(socialComments).where(eq(socialComments.userId, userId));
      const [likesGiven] = await db.select({ count: count() }).from(socialLikes).where(eq(socialLikes.userId, userId));
      const [bookmarksCount] = await db.select({ count: count() }).from(socialBookmarks).where(eq(socialBookmarks.userId, userId));
      const [sharesCount] = await db.select({ count: count() }).from(socialShares).where(eq(socialShares.userId, userId));

      res.json({
        success: true,
        stats: {
          postsCount: postsCount?.count || 0,
          commentsCount: commentsCount?.count || 0,
          likesGiven: likesGiven?.count || 0,
          bookmarksCount: bookmarksCount?.count || 0,
          sharesCount: sharesCount?.count || 0
        }
      });
    } catch (error) {
      logger.error('Stats error:', error);
      res.status(500).json({ success: false, error: "Failed to fetch user stats" });
    }
  });

  // POST /api/social/posts/:postId/like - Like a post
  app.post('/api/social/posts/:postId/like', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { postId } = req.params;

      // Check if already liked
      const existing = await db.select().from(socialLikes).where(
        and(eq(socialLikes.postId, Number(postId)), eq(socialLikes.userId, userId))
      );

      if (existing.length > 0) {
        // Unlike
        await db.delete(socialLikes).where(
          and(eq(socialLikes.postId, Number(postId)), eq(socialLikes.userId, userId))
        );
        return res.json({ success: true, liked: false });
      } else {
        // Like
        await db.insert(socialLikes).values({
          postId: Number(postId),
          userId,
          createdAt: new Date()
        });
        return res.json({ success: true, liked: true });
      }
    } catch (error) {
      logger.error('Like error:', error);
      res.status(500).json({ success: false, error: "Failed to like post" });
    }
  });

  // POST /api/social/posts/:postId/comment - Add a comment to a post
  app.post('/api/social/posts/:postId/comment', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { postId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Comment content is required" });
      }

      const [newComment] = await db.insert(socialComments).values({
        postId: Number(postId),
        userId,
        content: content.trim(),
        createdAt: new Date()
      }).returning();

      res.json({ success: true, comment: newComment });
    } catch (error) {
      logger.error('Comment error:', error);
      res.status(500).json({ success: false, error: "Failed to add comment" });
    }
  });
} 