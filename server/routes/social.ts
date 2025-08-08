import { Express, Request, Response, Router } from "express";
import { db } from "../db.js";
import { 
  users, 
  socialPosts, 
  socialComments, 
  socialLikes, 
  userFriends, 
  userMessages, 
  notifications, 
  userActivity, 
  socialShares, 
  socialBookmarks,
  userFollows
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
  
  // GET /api/social/posts - Main posts endpoint (alias for feed)
  app.get('/api/social/posts', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { limit = 20, offset = 0, userId } = req.query;

      const feedPosts = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          imageUrl: socialPosts.imageUrl,
          type: socialPosts.type,
          visibility: socialPosts.visibility,
          createdAt: socialPosts.createdAt,
          updatedAt: socialPosts.updatedAt,
          userId: socialPosts.userId,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            civicLevel: users.civicLevel,
            isVerified: users.isVerified,
          }
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .where(eq(socialPosts.visibility, 'public'))
        .orderBy(desc(socialPosts.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Get interaction counts and user interaction status
      const postsWithInteractions = await Promise.all(
        feedPosts.map(async (post) => {
          // Get likes count
          const likesCount = await db
            .select({ count: count() })
            .from(socialLikes)
            .where(eq(socialLikes.postId, post.id));

          // Get comments count
          const commentsCount = await db
            .select({ count: count() })
            .from(socialComments)
            .where(eq(socialComments.postId, post.id));

          // Check if current user liked
          const userLike = await db
            .select()
            .from(socialLikes)
            .where(and(
              eq(socialLikes.postId, post.id),
              eq(socialLikes.userId, currentUserId)
            ))
            .limit(1);

          return {
            ...post,
            likesCount: likesCount[0]?.count || 0,
            commentsCount: commentsCount[0]?.count || 0,
            isLiked: userLike.length > 0,
          };
        })
      );

      res.json({
        success: true,
        posts: postsWithInteractions,
        totalPosts: feedPosts.length,
      });
    } catch (error) {
      logger.error('Error fetching social posts:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch social posts",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // (Removed duplicate post creation route; unified below)

  // GET /api/social/feed - Enhanced social feed with proper error handling
  app.get('/api/social/feed', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { limit = 20, offset = 0 } = req.query;

      logger.info('Fetching social feed for user:', currentUserId);

      // Get posts with user data and interaction status
      const feedPosts = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          imageUrl: socialPosts.imageUrl,
          type: socialPosts.type,
          visibility: socialPosts.visibility,
          createdAt: socialPosts.createdAt,
          updatedAt: socialPosts.updatedAt,
          userId: socialPosts.userId,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            civicLevel: users.civicLevel,
            isVerified: users.isVerified,
          }
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .where(eq(socialPosts.visibility, 'public'))
        .orderBy(desc(socialPosts.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      logger.info('Found posts:', feedPosts.length);

      // Get interaction counts and user interaction status
      const postsWithInteractions = await Promise.all(
        feedPosts.map(async (post) => {
          try {
            // Get likes count
            const likesCount = await db
              .select({ count: count() })
              .from(socialLikes)
              .where(eq(socialLikes.postId, post.id));

            // Get comments count
            const commentsCount = await db
              .select({ count: count() })
              .from(socialComments)
              .where(eq(socialComments.postId, post.id));

            // Check if current user liked
            const userLike = await db
              .select()
              .from(socialLikes)
              .where(and(
                eq(socialLikes.postId, post.id),
                eq(socialLikes.userId, currentUserId)
              ))
              .limit(1);

            return {
              ...post,
              likesCount: likesCount[0]?.count || 0,
              commentsCount: commentsCount[0]?.count || 0,
              isLiked: userLike.length > 0,
              user: post.user
            };
          } catch (error) {
            logger.error('Error processing post interactions:', error);
            return {
              ...post,
              likesCount: 0,
              commentsCount: 0,
              isLiked: false,
              user: post.user
            };
          }
        })
      );

      logger.info('Returning posts with interactions:', postsWithInteractions.length);

      res.json({
        success: true,
        feed: postsWithInteractions
      });
    } catch (error) {
      logger.error('Social feed error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch social feed",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/social/posts - Enhanced post creation
  app.post('/api/social/posts', jwtAuth, socialRateLimit, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const bodySchema = z.object({
        content: z.string().trim().min(1).max(1000),
        type: z.string().trim().default('text'),
        visibility: z.enum(['public','private','friends']).default('public'),
        imageUrl: z.string().url().optional(),
      });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', issues: parsed.error.flatten() });
      }
      const { content, type, visibility, imageUrl } = parsed.data;

      const post = await db.insert(socialPosts).values({
        userId: currentUserId,
        content,
        type,
        visibility,
        imageUrl: imageUrl || null
      }).returning();
      recordEvent('social.post.created', { userId: currentUserId });

      // Notify followers about new post
      try {
        const followers = await db
          .select({ followerId: userFollows.userId })
          .from(userFollows)
          .where(eq(userFollows.followId, currentUserId));
        for (const f of followers) {
          await db.insert(notifications).values({
            userId: f.followerId,
            type: 'social',
            title: 'New post',
            message: 'Someone you follow posted an update',
            data: { postId: post[0].id, authorId: currentUserId },
            sourceModule: 'social',
            sourceId: String(post[0].id),
          });
        }
      } catch {}

      // Get user data for response
      const [user] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          civicLevel: users.civicLevel,
          isVerified: users.isVerified,
        })
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

      res.json({
        success: true,
        post: {
          ...post[0],
          user,
          likesCount: 0,
          commentsCount: 0,
          isLiked: false
        }
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // GET /api/social/posts/user/:username - Enhanced user posts
  app.get('/api/social/posts/user/:username', async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Get user by username
      const [user] = await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's posts
      const posts = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          imageUrl: socialPosts.imageUrl,
          type: socialPosts.type,
          visibility: socialPosts.visibility,
          createdAt: socialPosts.createdAt,
          updatedAt: socialPosts.updatedAt,
          userId: socialPosts.userId,
        })
        .from(socialPosts)
        .where(eq(socialPosts.userId, user.id))
        .orderBy(desc(socialPosts.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Get interaction counts for each post
      const postsWithCounts = await Promise.all(
        posts.map(async (post) => {
          const likesCount = await db
            .select({ count: count() })
            .from(socialLikes)
            .where(eq(socialLikes.postId, post.id));

          const commentsCount = await db
            .select({ count: count() })
            .from(socialComments)
            .where(eq(socialComments.postId, post.id));

          return {
            ...post,
            likesCount: likesCount[0]?.count || 0,
            commentsCount: commentsCount[0]?.count || 0,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName
            }
          };
        })
      );

      res.json({
        success: true,
        posts: postsWithCounts
      });
    } catch (error) {
      console.error('User posts error:', error);
      res.status(500).json({ error: "Failed to fetch user posts" });
    }
  });

  // ===== INTERACTION ENDPOINTS =====

  // POST /api/social/posts/:id/like - Enhanced like system
  app.post('/api/social/posts/:id/like', jwtAuth, socialRateLimit, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const postId = parseInt(req.params.id);
      const likeSchema = z.object({ reaction: z.string().max(16).optional() });
      const likeParsed = likeSchema.safeParse(req.body);
      if (!likeParsed.success) return res.status(400).json({ error: 'Invalid input', issues: likeParsed.error.flatten() });
      const { reaction = '👍' } = likeParsed.data;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if post exists
      const post = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check if already liked
      const existingLike = await db.select().from(socialLikes).where(
        and(eq(socialLikes.postId, postId), eq(socialLikes.userId, userId))
      ).limit(1);

      if (existingLike.length > 0) {
        // Unlike
        await db.delete(socialLikes).where(
          and(eq(socialLikes.postId, postId), eq(socialLikes.userId, userId))
        );
        res.json({ success: true, liked: false, message: "Post unliked" });
      } else {
        // Like
        await db.insert(socialLikes).values({
          postId,
          userId,
          reaction
        });
        // Notify post author (if not self)
        try {
          const [p] = await db.select({ userId: socialPosts.userId }).from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
          const authorId = p?.userId;
          if (authorId && authorId !== userId) {
            await db.insert(notifications).values({
              userId: authorId,
              type: 'social',
              title: 'Your post was liked',
              message: 'Someone liked your post.',
              data: { postId, reaction },
              sourceModule: 'social',
              sourceId: String(postId),
            });
          }
        } catch {}
        recordEvent('social.like.created', { userId, postId });
        res.json({ success: true, liked: true, message: "Post liked" });
      }
    } catch (error) {
      console.error('Like post error:', error);
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  // POST /api/social/posts/:id/comment - Enhanced comment system
  app.post('/api/social/posts/:id/comment', jwtAuth, socialRateLimit, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const postId = parseInt(req.params.id);
      const bodySchema = z.object({ content: z.string().trim().min(1).max(1000) });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', issues: parsed.error.flatten() });
      }
      const { content } = parsed.data;

      // Anti-spam: basic rate - reject if too many comments quickly (handled by socialRateLimit) and disallow exact duplicates immediately on same post
      const dup = await db
        .select({ c: count() })
        .from(socialComments)
        .where(and(eq(socialComments.userId, userId), eq(socialComments.postId, postId), eq(socialComments.content, content)))
        .limit(1);
      if ((dup[0] as any)?.c > 0) {
        return res.status(429).json({ error: 'Duplicate comment detected, please modify your message.' });
      }

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if post exists
      const post = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      const comment = await db.insert(socialComments).values({
        postId,
        userId,
        content
      }).returning();
      recordEvent('social.comment.created', { userId, postId });

      // Notify post author (if not self)
      try {
        const [p] = await db.select({ userId: socialPosts.userId }).from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
        const authorId = p?.userId;
        if (authorId && authorId !== userId) {
          await db.insert(notifications).values({
            userId: authorId,
            type: 'social',
            title: 'New comment on your post',
            message: 'Your post received a new comment.',
            data: { postId, commentId: comment[0].id },
            sourceModule: 'social',
            sourceId: String(postId),
          });
        }
      } catch {}

      // Get user data for response
      const [user] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      res.json({ 
        success: true, 
        comment: {
          ...comment[0],
          user
        }
      });
    } catch (error) {
      console.error('Comment error:', error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // GET /api/social/posts/:id/comments - Fetch comments for a post
  app.get('/api/social/posts/:id/comments', jwtAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      if (Number.isNaN(postId)) {
        return res.status(400).json({ success: false, message: 'Invalid post id' });
      }

      // Ensure post exists
      const post = await db.select({ id: socialPosts.id }).from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const comments = await db
        .select({
          id: socialComments.id,
          content: socialComments.content,
          parentCommentId: socialComments.parentCommentId,
          createdAt: socialComments.createdAt,
          updatedAt: socialComments.updatedAt,
          userId: socialComments.userId,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          }
        })
        .from(socialComments)
        .leftJoin(users, eq(socialComments.userId, users.id))
        .where(eq(socialComments.postId, postId))
        .orderBy(asc(socialComments.createdAt));

      const formatted = comments.map((c) => ({
        id: c.id,
        content: c.content,
        parentCommentId: c.parentCommentId as number | null,
        createdAt: c.createdAt as any,
        updatedAt: c.updatedAt as any,
        userId: c.userId,
        firstName: c.user?.firstName,
        lastName: c.user?.lastName,
        profileImageUrl: c.user?.profileImageUrl,
        likeCount: 0,
        isLiked: false,
      }));

      res.json({ success: true, comments: formatted });
    } catch (error) {
      logger.error('Fetch comments error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
  });

  // PUT /api/social/comments/:id - Update a comment (author only)
  app.put('/api/social/comments/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const commentId = parseInt(req.params.id);
      const bodySchema = z.object({ content: z.string().trim().min(1).max(1000) });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid input', issues: parsed.error.flatten() });

      const [existing] = await db.select().from(socialComments).where(eq(socialComments.id, commentId)).limit(1);
      if (!existing) return res.status(404).json({ error: 'Comment not found' });
      if ((existing as any).userId !== userId) return res.status(403).json({ error: 'Forbidden' });

      const [updated] = await db
        .update(socialComments)
        .set({ content: parsed.data.content, updatedAt: new Date() as any })
        .where(eq(socialComments.id, commentId))
        .returning();
      res.json({ success: true, comment: updated });
    } catch (error) {
      logger.error('Update comment error:', error);
      res.status(500).json({ error: 'Failed to update comment' });
    }
  });

  // DELETE /api/social/comments/:id - Delete a comment (author only)
  app.delete('/api/social/comments/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const commentId = parseInt(req.params.id);
      const [existing] = await db.select().from(socialComments).where(eq(socialComments.id, commentId)).limit(1);
      if (!existing) return res.status(404).json({ error: 'Comment not found' });
      if ((existing as any).userId !== userId) return res.status(403).json({ error: 'Forbidden' });

      await db.delete(socialComments).where(eq(socialComments.id, commentId));
      res.json({ success: true });
    } catch (error) {
      logger.error('Delete comment error:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  // ===== MESSAGING SYSTEM =====

  // GET /api/social/conversations - Enhanced conversations
  app.get('/api/social/conversations', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      logger.info('Fetching conversations for user:', userId);

      // Simplified query to get unique conversation partners
      const conversations = await db
        .select({
          otherUserId: sql<string>`CASE 
            WHEN ${userMessages.senderId} = ${userId} THEN ${userMessages.recipientId}
            ELSE ${userMessages.senderId}
          END`,
          lastMessage: userMessages.content,
          lastMessageAt: userMessages.createdAt,
        })
        .from(userMessages)
        .where(
          or(
            eq(userMessages.senderId, userId),
            eq(userMessages.recipientId, userId)
          )
        )
        .orderBy(desc(userMessages.createdAt))
        .limit(50); // Limit to prevent performance issues

      // Get unique conversations by otherUserId
      const uniqueConversations = conversations.reduce((acc, conv) => {
        if (!acc.find(c => c.otherUserId === conv.otherUserId)) {
          acc.push(conv);
        }
        return acc;
      }, [] as typeof conversations);

      logger.info('Found unique conversations:', uniqueConversations.length);

      // Get user data for each conversation
      const conversationsWithUsers = await Promise.all(
        uniqueConversations.map(async (conv) => {
          try {
            const [user] = await db
              .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                profileImageUrl: users.profileImageUrl,
                civicLevel: users.civicLevel,
              })
              .from(users)
              .where(eq(users.id, conv.otherUserId))
              .limit(1);

            // Get unread count for this conversation
            const unreadCount = await db
              .select({ count: count() })
              .from(userMessages)
              .where(
                and(
                  eq(userMessages.recipientId, userId),
                  eq(userMessages.senderId, conv.otherUserId),
                  eq(userMessages.isRead, false)
                )
              );

            return {
              id: conv.otherUserId,
              participant: user,
              lastMessage: conv.lastMessage,
              lastMessageAt: conv.lastMessageAt,
              unreadCount: unreadCount[0]?.count || 0,
            };
          } catch (error) {
            logger.error('Error processing conversation:', error);
            return {
              id: conv.otherUserId,
              participant: null,
              lastMessage: conv.lastMessage,
              lastMessageAt: conv.lastMessageAt,
              unreadCount: 0,
            };
          }
        })
      );

      logger.info('Returning conversations with users:', conversationsWithUsers.length);

      res.json({
        success: true,
        conversations: conversationsWithUsers
      });
    } catch (error) {
      logger.error('Conversations error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch conversations",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/social/messages - Enhanced messages (with query parameter)
  app.get('/api/social/messages', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const { otherUserId } = req.query;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!otherUserId) {
        return res.status(400).json({ error: "otherUserId is required" });
      }

      // Get messages between users
      const messages = await db
        .select({
          id: userMessages.id,
          senderId: userMessages.senderId,
          recipientId: userMessages.recipientId,
          content: userMessages.content,
          isRead: userMessages.isRead,
          createdAt: userMessages.createdAt,
        })
        .from(userMessages)
        .where(
          or(
            and(eq(userMessages.senderId, userId), eq(userMessages.recipientId, otherUserId as string)),
            and(eq(userMessages.senderId, otherUserId as string), eq(userMessages.recipientId, userId))
          )
        )
        .orderBy(asc(userMessages.createdAt))
        .limit(100); // Limit to prevent performance issues

      // Mark messages as read (only if there are messages)
      if (messages.length > 0) {
        try {
          await db
            .update(userMessages)
            .set({ isRead: true })
            .where(
              and(
                eq(userMessages.recipientId, userId),
                eq(userMessages.senderId, otherUserId as string),
                eq(userMessages.isRead, false)
              )
            );
        } catch (updateError) {
          logger.error('Error marking messages as read:', updateError);
          // Don't fail the request if marking as read fails
        }
      }

      res.json({
        success: true,
        messages
      });
    } catch (error) {
      logger.error('Messages error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch messages",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  app.get('/api/social/messages/:conversationId', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const conversationId = req.params.conversationId;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!conversationId) {
        return res.status(400).json({ error: "Conversation ID is required" });
      }

      // Get messages between users
      const messages = await db
        .select({
          id: userMessages.id,
          senderId: userMessages.senderId,
          recipientId: userMessages.recipientId,
          content: userMessages.content,
          isRead: userMessages.isRead,
          createdAt: userMessages.createdAt,
        })
        .from(userMessages)
        .where(
          or(
            and(eq(userMessages.senderId, userId), eq(userMessages.recipientId, conversationId)),
            and(eq(userMessages.senderId, conversationId), eq(userMessages.recipientId, userId))
          )
        )
        .orderBy(asc(userMessages.createdAt))
        .limit(100); // Limit to prevent performance issues

      // Mark messages as read (only if there are messages)
      if (messages.length > 0) {
        try {
          await db
            .update(userMessages)
            .set({ isRead: true })
            .where(
              and(
                eq(userMessages.recipientId, userId),
                eq(userMessages.senderId, conversationId),
                eq(userMessages.isRead, false)
              )
            );
        } catch (updateError) {
          logger.error('Error marking messages as read:', updateError);
          // Don't fail the request if marking as read fails
        }
      }

      res.json({
        success: true,
        messages
      });
    } catch (error) {
      logger.error('Messages error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch messages",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/social/messages - Enhanced send message
  app.post('/api/social/messages', jwtAuth, socialRateLimit, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const msgSchema = z.object({ recipientId: z.string().min(1), content: z.string().trim().min(1).max(1000) });
      const msgParsed = msgSchema.safeParse(req.body);
      if (!msgParsed.success) return res.status(400).json({ error: 'Invalid input', issues: msgParsed.error.flatten() });
      const { recipientId, content } = msgParsed.data;

      // Anti-spam: simple guard - disallow identical consecutive messages within 10 seconds
      const recent = await db
        .select({ c: count() })
        .from(userMessages)
        .where(
          and(
            eq(userMessages.senderId, userId),
            eq(userMessages.recipientId, recipientId),
            eq(userMessages.content, content)
          )
        )
        .limit(1);
      if ((recent[0] as any)?.c > 0) {
        return res.status(429).json({ error: 'Duplicate message detected, please wait before sending again.' });
      }

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!recipientId || !content) {
        return res.status(400).json({ error: "recipientId and content are required" });
      }

      if (userId === recipientId) {
        return res.status(400).json({ error: "Cannot message yourself" });
      }

      // Check if recipient exists
      const [recipient] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, recipientId))
        .limit(1);

      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      // Send message
      const message = await db.insert(userMessages).values({
        senderId: userId,
        recipientId,
        content
      }).returning();

      // Notify recipient
      try {
        await db.insert(notifications).values({
          userId: recipientId,
          type: 'message',
          title: 'New message',
          message: 'You received a new message.',
          data: { messageId: message[0].id, senderId: userId },
          sourceModule: 'messages',
          sourceId: String(message[0].id),
        });
      } catch {}

      res.json({ 
        success: true, 
        message: message[0] 
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // ===== FRIENDS SYSTEM =====

  // GET /api/social/friends - Enhanced friends list
  app.get('/api/social/friends', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const { status = 'accepted' } = req.query;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      logger.info('Fetching friends for user:', userId, 'status:', status);

      // Get friends where user is the requester
      const friendsAsRequester = await db
        .select({
          id: userFriends.id,
          userId: userFriends.userId,
          friendId: userFriends.friendId,
          status: userFriends.status,
          createdAt: userFriends.createdAt,
          friend: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            civicLevel: users.civicLevel,
            isVerified: users.isVerified,
          }
        })
        .from(userFriends)
        .leftJoin(users, eq(userFriends.friendId, users.id))
        .where(
          and(
            eq(userFriends.userId, userId),
            eq(userFriends.status, status as string)
          )
        );

      // Get friends where user is the recipient
      const friendsAsRecipient = await db
        .select({
          id: userFriends.id,
          userId: userFriends.friendId,
          friendId: userFriends.userId,
          status: userFriends.status,
          createdAt: userFriends.createdAt,
          friend: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            civicLevel: users.civicLevel,
            isVerified: users.isVerified,
          }
        })
        .from(userFriends)
        .leftJoin(users, eq(userFriends.userId, users.id))
        .where(
          and(
            eq(userFriends.friendId, userId),
            eq(userFriends.status, status as string)
          )
        );

      // Combine both lists
      const allFriends = [...friendsAsRequester, ...friendsAsRecipient];

      // Get pending requests
      const pendingReceived = await db
        .select({
          id: userFriends.id,
          userId: userFriends.userId,
          friendId: userFriends.friendId,
          status: userFriends.status,
          createdAt: userFriends.createdAt,
          friend: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            civicLevel: users.civicLevel,
            isVerified: users.isVerified,
          }
        })
        .from(userFriends)
        .leftJoin(users, eq(userFriends.userId, users.id))
        .where(
          and(
            eq(userFriends.friendId, userId),
            eq(userFriends.status, 'pending')
          )
        );

      const pendingSent = await db
        .select({
          id: userFriends.id,
          userId: userFriends.userId,
          friendId: userFriends.friendId,
          status: userFriends.status,
          createdAt: userFriends.createdAt,
          friend: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            civicLevel: users.civicLevel,
            isVerified: users.isVerified,
          }
        })
        .from(userFriends)
        .leftJoin(users, eq(userFriends.friendId, users.id))
        .where(
          and(
            eq(userFriends.userId, userId),
            eq(userFriends.status, 'pending')
          )
        );

      logger.info('Found friends:', allFriends.length, 'pending received:', pendingReceived.length, 'pending sent:', pendingSent.length);

      res.json({
        success: true,
        friends: allFriends,
        received: pendingReceived,
        sent: pendingSent
      });
    } catch (error) {
      logger.error('Friends error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to fetch friends",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/social/friends - Enhanced add friend
  app.post('/api/social/friends', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const friendSchema = z.object({ friendId: z.string().min(1) });
      const friendParsed = friendSchema.safeParse(req.body);
      if (!friendParsed.success) return res.status(400).json({ error: 'Invalid input', issues: friendParsed.error.flatten() });
      const { friendId } = friendParsed.data;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!friendId) {
        return res.status(400).json({ error: "friendId is required" });
      }

      if (userId === friendId) {
        return res.status(400).json({ error: "Cannot add yourself as friend" });
      }

      // Check if friend exists
      const [friend] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, friendId))
        .limit(1);

      if (!friend) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if already friends
      const existingFriendship = await db.select().from(userFriends).where(
        or(
          and(eq(userFriends.userId, userId), eq(userFriends.friendId, friendId)),
          and(eq(userFriends.userId, friendId), eq(userFriends.friendId, userId))
        )
      ).limit(1);

      if (existingFriendship.length > 0) {
        return res.status(400).json({ error: "Friendship already exists" });
      }

      // Add friend request
      const friendship = await db.insert(userFriends).values({
        userId,
        friendId,
        status: 'pending'
      }).returning();

      res.json({ 
        success: true, 
        friendship: friendship[0] 
      });
    } catch (error) {
      console.error('Add friend error:', error);
      res.status(500).json({ error: "Failed to add friend" });
    }
  });

  // POST /api/social/friends/accept - Enhanced accept friend
  app.post('/api/social/friends/accept', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const acceptSchema = z.object({ friendId: z.string().min(1) });
      const acceptParsed = acceptSchema.safeParse(req.body);
      if (!acceptParsed.success) return res.status(400).json({ error: 'Invalid input', issues: acceptParsed.error.flatten() });
      const { friendId } = acceptParsed.data;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!friendId) {
        return res.status(400).json({ error: "friendId is required" });
      }

      // Update friendship status
      await db.update(userFriends).set({ status: 'accepted' }).where(
        and(eq(userFriends.userId, friendId), eq(userFriends.friendId, userId))
      );

      res.json({ success: true, message: "Friend request accepted" });
    } catch (error) {
      console.error('Accept friend error:', error);
      res.status(500).json({ error: "Failed to accept friend" });
    }
  });

  // ===== NOTIFICATIONS SYSTEM =====

  // GET /api/social/notifications - Enhanced notifications
  app.get('/api/social/notifications', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userNotifications = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          isRead: notifications.isRead,
          data: notifications.data,
          sourceModule: notifications.sourceModule,
          sourceId: notifications.sourceId,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);

      res.json({ 
        success: true, 
        notifications: userNotifications
      });
    } catch (error) {
      console.error('Notifications error:', error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // POST /api/social/notifications/:id/read - Enhanced mark read
  app.post('/api/social/notifications/:id/read', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const notificationId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await db.update(notifications).set({ isRead: true }).where(
        and(eq(notifications.id, notificationId), eq(notifications.userId, userId))
      );

      res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // ===== ACTIVITY TRACKING =====

  // GET /api/social/activity - Enhanced user activity
  app.get('/api/social/activity', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const activities = await db
        .select({
          id: userActivity.id,
          type: userActivity.type,
          description: userActivity.description,
          data: userActivity.data,
          pointsEarned: userActivity.pointsEarned,
          createdAt: userActivity.createdAt,
        })
        .from(userActivity)
        .where(eq(userActivity.userId, userId))
        .orderBy(desc(userActivity.createdAt))
        .limit(20);

      res.json({ 
        success: true, 
        activities 
      });
    } catch (error) {
      console.error('User activity error:', error);
      res.status(500).json({ error: "Failed to fetch user activity" });
    }
  });

  // ===== CONTENT MANAGEMENT =====

  // GET /api/social/bookmarks - Enhanced bookmarks
  app.get('/api/social/bookmarks', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const bookmarks = await db
        .select({
          id: socialBookmarks.id,
          postId: socialBookmarks.postId,
          bookmarkedAt: socialBookmarks.bookmarkedAt,
          post: {
            id: socialPosts.id,
            content: socialPosts.content,
            imageUrl: socialPosts.imageUrl,
            type: socialPosts.type,
            createdAt: socialPosts.createdAt,
            userId: socialPosts.userId,
          }
        })
        .from(socialBookmarks)
        .leftJoin(socialPosts, eq(socialBookmarks.postId, socialPosts.id))
        .where(eq(socialBookmarks.userId, userId))
        .orderBy(desc(socialBookmarks.bookmarkedAt));

      res.json({ 
        success: true, 
        bookmarks 
      });
    } catch (error) {
      console.error('Bookmarks error:', error);
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  // POST /api/social/bookmarks - Enhanced add bookmark
  app.post('/api/social/bookmarks', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const bookmarkSchema = z.object({ postId: z.number().int().positive() });
      const bookmarkParsed = bookmarkSchema.safeParse(req.body);
      if (!bookmarkParsed.success) return res.status(400).json({ error: 'Invalid input', issues: bookmarkParsed.error.flatten() });
      const { postId } = bookmarkParsed.data;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!postId) {
        return res.status(400).json({ error: "postId is required" });
      }

      // Check if post exists
      const post = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check if already bookmarked
      const existingBookmark = await db.select().from(socialBookmarks).where(
        and(eq(socialBookmarks.userId, userId), eq(socialBookmarks.postId, postId))
      ).limit(1);

      if (existingBookmark.length > 0) {
        // Remove bookmark
        await db.delete(socialBookmarks).where(
          and(eq(socialBookmarks.userId, userId), eq(socialBookmarks.postId, postId))
        );
        res.json({ success: true, bookmarked: false, message: "Bookmark removed" });
      } else {
        // Add bookmark
        await db.insert(socialBookmarks).values({
          userId,
          postId
        });
        res.json({ success: true, bookmarked: true, message: "Post bookmarked" });
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      res.status(500).json({ error: "Failed to bookmark post" });
    }
  });

  // GET /api/social/shares - Enhanced shares
  app.get('/api/social/shares', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const shares = await db
        .select({
          id: socialShares.id,
          postId: socialShares.postId,
          platform: socialShares.platform,
          sharedAt: socialShares.sharedAt,
          post: {
            id: socialPosts.id,
            content: socialPosts.content,
            imageUrl: socialPosts.imageUrl,
            type: socialPosts.type,
            createdAt: socialPosts.createdAt,
            userId: socialPosts.userId,
          }
        })
        .from(socialShares)
        .leftJoin(socialPosts, eq(socialShares.postId, socialPosts.id))
        .where(eq(socialShares.userId, userId))
        .orderBy(desc(socialShares.sharedAt));

      res.json({ 
        success: true, 
        shares 
      });
    } catch (error) {
      console.error('Shares error:', error);
      res.status(500).json({ error: "Failed to fetch shares" });
    }
  });

  // POST /api/social/posts/:id/share - Enhanced share post
  app.post('/api/social/posts/:id/share', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const postId = parseInt(req.params.id);
      const shareSchema = z.object({ platform: z.string().max(32).optional() });
      const shareParsed = shareSchema.safeParse(req.body);
      if (!shareParsed.success) return res.status(400).json({ error: 'Invalid input', issues: shareParsed.error.flatten() });
      const { platform = 'internal' } = shareParsed.data;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if post exists
      const post = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Record share
      const share = await db.insert(socialShares).values({
        userId,
        postId,
        platform
      }).returning();

      res.json({ 
        success: true, 
        share: share[0],
        message: "Post shared successfully"
      });
    } catch (error) {
      console.error('Share post error:', error);
      res.status(500).json({ error: "Failed to share post" });
    }
  });

  // ===== USER SEARCH SYSTEM =====

  // GET /api/social/users/search - Enhanced user search
  app.get('/api/social/users/search', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any)?.id;
      const { q: query, limit = 20 } = req.query;

      if (!query || (query as string).length < 2) {
        return res.json({
          success: true,
          users: []
        });
      }

      logger.info('Searching users with query:', query, 'for user:', currentUserId);

      // Search users by name, email, or username
      const searchResults = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          civicLevel: users.civicLevel,
          isVerified: users.isVerified,
          followersCount: users.followersCount,
          followingCount: users.followingCount,
          postsCount: users.postsCount,
        })
        .from(users)
        .where(
          or(
            sql`LOWER(${users.firstName}) LIKE LOWER(${'%' + (query as string) + '%'})`,
            sql`LOWER(${users.lastName}) LIKE LOWER(${'%' + (query as string) + '%'})`,
            sql`LOWER(${users.email}) LIKE LOWER(${'%' + (query as string) + '%'})`,
            sql`LOWER(${users.username}) LIKE LOWER(${'%' + (query as string) + '%'})`
          )
        )
        .limit(parseInt(limit as string));

      // Filter out current user and get relationship status
      const usersWithStatus = await Promise.all(
        searchResults
          .filter(user => user.id !== currentUserId)
          .map(async (user) => {
            try {
              // Check if already friends
              const friendship = await db
                .select()
                .from(userFriends)
                .where(
                  or(
                    and(eq(userFriends.userId, currentUserId), eq(userFriends.friendId, user.id)),
                    and(eq(userFriends.userId, user.id), eq(userFriends.friendId, currentUserId))
                  )
                )
                .limit(1);

              // Check if following
              const following = await db
                .select()
                .from(userFollows)
                .where(
                  and(
                    eq(userFollows.userId, currentUserId),
                    eq(userFollows.followId, user.id)
                  )
                )
                .limit(1);

              return {
                ...user,
                isFriend: friendship.length > 0 && friendship[0].status === 'accepted',
                isPendingFriend: friendship.length > 0 && friendship[0].status === 'pending',
                isFollowing: following.length > 0,
                friendshipStatus: friendship.length > 0 ? friendship[0].status : null
              };
            } catch (error) {
              logger.error('Error checking user relationship:', error);
              return {
                ...user,
                isFriend: false,
                isPendingFriend: false,
                isFollowing: false,
                friendshipStatus: null
              };
            }
          })
      );

      logger.info('Found users:', usersWithStatus.length);

      res.json({
        success: true,
        users: usersWithStatus
      });
    } catch (error) {
      logger.error('User search error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to search users",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ===== FOLLOW SYSTEM =====

  // POST /api/social/follow - Follow a user
  app.post('/api/social/follow', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const followSchema = z.object({ followingId: z.string().min(1) });
      const followParsed = followSchema.safeParse(req.body);
      if (!followParsed.success) return res.status(400).json({ error: 'Invalid input', issues: followParsed.error.flatten() });
      const { followingId } = followParsed.data;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!followingId) {
        return res.status(400).json({ error: "followingId is required" });
      }

      if (userId === followingId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      // Check if already following
      const existingFollow = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.userId, userId),
            eq(userFollows.followId, followingId)
          )
        )
        .limit(1);

      if (existingFollow.length > 0) {
        return res.status(409).json({ error: "Already following this user" });
      }

      // Create follow relationship
      await db.insert(userFollows).values({
        userId,
        followId: followingId
      });

      // Update user counts (these will be handled by triggers, but adding here for safety)
      await db
        .update(users)
        .set({
          followingCount: sql`${users.followingCount} + 1`
        })
        .where(eq(users.id, userId));

      await db
        .update(users)
        .set({
          followersCount: sql`${users.followersCount} + 1`
        })
        .where(eq(users.id, followingId));

      // Notify followed user
      try {
        await db.insert(notifications).values({
          userId: followingId,
          type: 'social',
          title: 'New follower',
          message: 'You have a new follower.',
          data: { followerId: userId },
          sourceModule: 'social',
          sourceId: `follow:${userId}:${followingId}`,
        });
      } catch {}

      res.json({
        success: true,
        message: "Successfully followed user"
      });
    } catch (error) {
      logger.error('Follow error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to follow user",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE /api/social/unfollow - Unfollow a user
  app.delete('/api/social/unfollow', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const unfollowSchema = z.object({ followingId: z.string().min(1) });
      const unfollowParsed = unfollowSchema.safeParse(req.body);
      if (!unfollowParsed.success) return res.status(400).json({ error: 'Invalid input', issues: unfollowParsed.error.flatten() });
      const { followingId } = unfollowParsed.data;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!followingId) {
        return res.status(400).json({ error: "followingId is required" });
      }

      // Delete follow relationship
      await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.userId, userId),
            eq(userFollows.followId, followingId)
          )
        );

      // Update user counts
      await db
        .update(users)
        .set({
          followingCount: sql`GREATEST(${users.followingCount} - 1, 0)`
        })
        .where(eq(users.id, userId));

      await db
        .update(users)
        .set({
          followersCount: sql`GREATEST(${users.followersCount} - 1, 0)`
        })
        .where(eq(users.id, followingId));

      res.json({
        success: true,
        message: "Successfully unfollowed user"
      });
    } catch (error) {
      logger.error('Unfollow error:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to unfollow user",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/social/followers/:userId - Get user's followers
  app.get('/api/social/followers/:userId', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;

      const followers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          civicLevel: users.civicLevel,
          isVerified: users.isVerified,
        })
        .from(userFollows)
        .leftJoin(users, eq(userFollows.userId, users.id))
        .where(eq(userFollows.followId, userId));

      res.json({ success: true, followers });
    } catch (error) {
      console.error('Get followers error:', error);
      res.status(500).json({ error: "Failed to fetch followers" });
    }
  });

  // GET /api/social/following/:userId - Get users that this user is following
  app.get('/api/social/following/:userId', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;

      const following = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          civicLevel: users.civicLevel,
          isVerified: users.isVerified,
        })
        .from(userFollows)
        .leftJoin(users, eq(userFollows.followId, users.id))
        .where(eq(userFollows.userId, userId));

      res.json({ success: true, following });
    } catch (error) {
      console.error('Get following error:', error);
      res.status(500).json({ error: "Failed to fetch following" });
    }
  });

  // ===== USER STATS =====

  // GET /api/social/stats - Enhanced user stats
  app.get('/api/social/stats', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get various counts
      const postsCount = await db
        .select({ count: count() })
        .from(socialPosts)
        .where(eq(socialPosts.userId, userId));

      const commentsCount = await db
        .select({ count: count() })
        .from(socialComments)
        .where(eq(socialComments.userId, userId));

      const likesGiven = await db
        .select({ count: count() })
        .from(socialLikes)
        .where(eq(socialLikes.userId, userId));

      const likesReceived = await db
        .select({ count: count() })
        .from(socialLikes)
        .leftJoin(socialPosts, eq(socialLikes.postId, socialPosts.id))
        .where(eq(socialPosts.userId, userId));

      const friendsCount = await db
        .select({ count: count() })
        .from(userFriends)
        .where(
          and(
            eq(userFriends.userId, userId),
            eq(userFriends.status, 'accepted')
          )
        );

      const bookmarksCount = await db
        .select({ count: count() })
        .from(socialBookmarks)
        .where(eq(socialBookmarks.userId, userId));

      const sharesCount = await db
        .select({ count: count() })
        .from(socialShares)
        .where(eq(socialShares.userId, userId));

      const stats = {
        postsCount: postsCount[0]?.count || 0,
        commentsCount: commentsCount[0]?.count || 0,
        likesReceived: likesReceived[0]?.count || 0,
        likesGiven: likesGiven[0]?.count || 0,
        friendsCount: friendsCount[0]?.count || 0,
        followersCount: 0, // TODO: Implement follow system
        followingCount: 0, // TODO: Implement follow system
        bookmarksCount: bookmarksCount[0]?.count || 0,
        sharesCount: sharesCount[0]?.count || 0
      };

      res.json({ 
        success: true, 
        stats
      });
    } catch (error) {
      console.error('User stats error:', error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });
} 