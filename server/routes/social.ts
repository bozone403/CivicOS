import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { socialPosts, socialComments, socialLikes, users, userFriends } from '../../shared/schema.js';
import { eq, and, desc, count, sql, ne } from 'drizzle-orm';
import { ResponseFormatter } from '../utils/responseFormatter.js';
import jwt from 'jsonwebtoken';

// JWT Auth middleware - inline definition
function jwtAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return ResponseFormatter.unauthorized(res, "Missing or invalid token");
  }
  try {
    const token = authHeader.split(" ")[1];
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      return ResponseFormatter.unauthorized(res, "Server configuration error");
    }
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return ResponseFormatter.unauthorized(res, "Invalid or expired token");
  }
}

export function registerSocialRoutes(app: Express) {
  // Get all social posts with pagination
  app.get('/api/social/posts', jwtAuth, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const posts = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          imageUrl: socialPosts.imageUrl,
          type: socialPosts.type,
          originalItemId: socialPosts.originalItemId,
          originalItemType: socialPosts.originalItemType,
          comment: socialPosts.comment,
          createdAt: socialPosts.createdAt,
          updatedAt: socialPosts.updatedAt,
          userId: socialPosts.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          likeCount: sql<number>`(
            SELECT COUNT(*) FROM social_likes 
            WHERE social_likes.post_id = social_posts.id
          )`,
          commentCount: sql<number>`(
            SELECT COUNT(*) FROM social_comments 
            WHERE social_comments.post_id = social_posts.id
          )`
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .orderBy(desc(socialPosts.createdAt))
        .limit(limit)
        .offset(offset);

      res.json(posts);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to fetch posts' });
    }
  });

  // Create a new social post
  app.post('/api/social/posts', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { content, imageUrl, type, originalItemId, originalItemType, comment } = req.body;
      const userId = (req.user as any).sub;

      if (!content && !imageUrl) {
        return res.status(400).json({ message: 'Content or image is required' });
      }

      const [newPost] = await db
        .insert(socialPosts)
        .values({
          userId,
          content: content || null,
          imageUrl: imageUrl || null,
          type: type || 'post',
          originalItemId: originalItemId || null,
          originalItemType: originalItemType || null,
          comment: comment || null
        })
        .returning();

      res.status(201).json(newPost);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to create post' });
    }
  });

  // Update a social post (only by author)
  app.put('/api/social/posts/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any).sub;
      const { content, imageUrl, comment } = req.body;

      // Check if post exists and user owns it
      const existingPost = await db
        .select()
        .from(socialPosts)
        .where(and(eq(socialPosts.id, postId), eq(socialPosts.userId, userId)))
        .limit(1);

      if (existingPost.length === 0) {
        return res.status(404).json({ message: 'Post not found or you do not have permission to edit it' });
      }

      const [updatedPost] = await db
        .update(socialPosts)
        .set({
          content: content || null,
          imageUrl: imageUrl || null,
          comment: comment || null,
          updatedAt: new Date()
        })
        .where(and(eq(socialPosts.id, postId), eq(socialPosts.userId, userId)))
        .returning();

      res.json(updatedPost);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to update post' });
    }
  });

  // Delete a social post (only by author)
  app.delete('/api/social/posts/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any).sub;

      // Check if post exists and user owns it
      const existingPost = await db
        .select()
        .from(socialPosts)
        .where(and(eq(socialPosts.id, postId), eq(socialPosts.userId, userId)))
        .limit(1);

      if (existingPost.length === 0) {
        return res.status(404).json({ message: 'Post not found or you do not have permission to delete it' });
      }

      // Delete related comments and likes first
      await db.delete(socialComments).where(eq(socialComments.postId, postId));
      await db.delete(socialLikes).where(eq(socialLikes.postId, postId));
      
      // Delete the post
      await db.delete(socialPosts).where(and(eq(socialPosts.id, postId), eq(socialPosts.userId, userId)));

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to delete post' });
    }
  });

  // Get comments for a post
  app.get('/api/social/posts/:id/comments', jwtAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);

      const comments = await db
        .select({
          id: socialComments.id,
          content: socialComments.content,
          parentCommentId: socialComments.parentCommentId,
          createdAt: socialComments.createdAt,
          updatedAt: socialComments.updatedAt,
          userId: socialComments.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          likeCount: sql<number>`(
            SELECT COUNT(*) FROM social_likes 
            WHERE social_likes.comment_id = social_comments.id
          )`
        })
        .from(socialComments)
        .leftJoin(users, eq(socialComments.userId, users.id))
        .where(eq(socialComments.postId, postId))
        .orderBy(socialComments.createdAt);

      res.json(comments);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  // Create a comment
  app.post('/api/social/posts/:id/comments', jwtAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req.user as any).sub;
      const { content, parentCommentId } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }

      const [newComment] = await db
        .insert(socialComments)
        .values({
          postId,
          userId,
          content,
          parentCommentId: parentCommentId || null
        })
        .returning();

      res.status(201).json(newComment);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to create comment' });
    }
  });

  // Update a comment (only by author)
  app.put('/api/social/comments/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = (req.user as any).sub;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }

      const [updatedComment] = await db
        .update(socialComments)
        .set({
          content,
          updatedAt: new Date()
        })
        .where(and(eq(socialComments.id, commentId), eq(socialComments.userId, userId)))
        .returning();

      if (!updatedComment) {
        return res.status(404).json({ message: 'Comment not found or you do not have permission to edit it' });
      }

      res.json(updatedComment);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to update comment' });
    }
  });

  // Delete a comment (only by author)
  app.delete('/api/social/comments/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = (req.user as any).sub;

      // Delete related likes first
      await db.delete(socialLikes).where(eq(socialLikes.commentId, commentId));
      
      // Delete the comment
      const result = await db
        .delete(socialComments)
        .where(and(eq(socialComments.id, commentId), eq(socialComments.userId, userId)));

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Comment not found or you do not have permission to delete it' });
      }

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  });

  // Like/unlike a post or comment
  app.post('/api/social/like', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).sub;
      const { postId, commentId, reaction } = req.body;

      if (!postId && !commentId) {
        return res.status(400).json({ message: 'Either postId or commentId is required' });
      }

      // Check if already liked
      const existingLike = await db
        .select()
        .from(socialLikes)
        .where(and(
          eq(socialLikes.userId, userId),
          postId ? eq(socialLikes.postId, postId) : eq(socialLikes.commentId, commentId)
        ))
        .limit(1);

      if (existingLike.length > 0) {
        // Unlike
        await db
          .delete(socialLikes)
          .where(and(
            eq(socialLikes.userId, userId),
            postId ? eq(socialLikes.postId, postId) : eq(socialLikes.commentId, commentId)
          ));
        res.json({ message: 'Unliked successfully' });
      } else {
        // Like
        await db
          .insert(socialLikes)
          .values({
            userId,
            postId: postId || null,
            commentId: commentId || null,
            reaction: reaction || '👍'
          });
        res.json({ message: 'Liked successfully' });
      }
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to toggle like' });
    }
  });

  // Get user's friends feed
  app.get('/api/social/friends-feed', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).sub;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get friends
      const friends = await db
        .select({ friendId: userFriends.friendId })
        .from(userFriends)
        .where(and(eq(userFriends.userId, userId), eq(userFriends.status, 'accepted')));

      const friendIds = friends.map(f => f.friendId);
      friendIds.push(userId); // Include user's own posts

      if (friendIds.length === 0) {
        return res.json([]);
      }

      const posts = await db
        .select({
          id: socialPosts.id,
          content: socialPosts.content,
          imageUrl: socialPosts.imageUrl,
          type: socialPosts.type,
          originalItemId: socialPosts.originalItemId,
          originalItemType: socialPosts.originalItemType,
          comment: socialPosts.comment,
          createdAt: socialPosts.createdAt,
          updatedAt: socialPosts.updatedAt,
          userId: socialPosts.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          likeCount: sql<number>`(
            SELECT COUNT(*) FROM social_likes 
            WHERE social_likes.post_id = social_posts.id
          )`,
          commentCount: sql<number>`(
            SELECT COUNT(*) FROM social_comments 
            WHERE social_comments.post_id = social_posts.id
          )`
        })
        .from(socialPosts)
        .leftJoin(users, eq(socialPosts.userId, users.id))
        .where(sql`${socialPosts.userId} = ANY(${friendIds})`)
        .orderBy(desc(socialPosts.createdAt))
        .limit(limit)
        .offset(offset);

      res.json(posts);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to fetch friends feed' });
    }
  });
} 