import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { socialPosts, userFriends, socialLikes, socialComments, userActivities, users, profileViews, userMessages, userReports, userBlocks, notifications } from '../../shared/schema.js';
import { eq, and, desc, count, sql, inArray, ne, isNotNull, or, gte, asc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// JWT Auth middleware
function jwtAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server configuration error" });
    }
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function registerSocialRoutes(app: Express) {
  // GET /api/social/posts - Get social posts
  app.get('/api/social/posts', async (req: Request, res: Response) => {
    try {
      const { tab = 'all', type = 'all', visibility = 'all', sortBy = 'recent', limit = 20, offset = 0 } = req.query;
      const currentUserId = (req as any).user?.id;

      let whereConditions = [];

      // Filter by tab
      switch (tab) {
        case 'friends':
          if (!currentUserId) {
            return res.status(401).json({ error: "Authentication required for friends feed" });
          }
          // Get friends' posts
          const friendsPosts = await db
            .select({ postId: socialPosts.id })
            .from(socialPosts)
            .innerJoin(userFriends, eq(socialPosts.userId, userFriends.friendId))
            .where(and(
              eq(userFriends.userId, currentUserId),
              eq(userFriends.status, 'accepted')
            ));
          const friendPostIds = friendsPosts.map(p => p.postId);
          if (friendPostIds.length > 0) {
            whereConditions.push(inArray(socialPosts.id, friendPostIds));
          } else {
            whereConditions.push(sql`1 = 0`); // No friends, no posts
          }
          break;
        case 'my-posts':
          if (!currentUserId) {
            return res.status(401).json({ error: "Authentication required for my posts" });
          }
          whereConditions.push(eq(socialPosts.userId, currentUserId));
          break;
                 case 'trending':
           // Posts with high engagement - we'll filter this in the main query
           break;
        default: // 'all'
          // Show public posts and user's own posts
          if (currentUserId) {
            whereConditions.push(sql`(${socialPosts.visibility} = 'public' OR ${socialPosts.userId} = ${currentUserId})`);
          } else {
            whereConditions.push(eq(socialPosts.visibility, 'public'));
          }
      }

      // Filter by type
      if (type !== 'all') {
        whereConditions.push(eq(socialPosts.type, type as string));
      }

      // Filter by visibility
      if (visibility !== 'all') {
        whereConditions.push(eq(socialPosts.visibility, visibility as string));
      }

             // Get posts with basic info first
       const posts = await db
         .select({
           id: socialPosts.id,
           userId: socialPosts.userId,
           content: socialPosts.content,
           imageUrl: socialPosts.imageUrl,
           type: socialPosts.type,
           visibility: socialPosts.visibility,
           tags: socialPosts.tags,
           location: socialPosts.location,
           mood: socialPosts.mood,
           originalItemId: socialPosts.originalItemId,
           originalItemType: socialPosts.originalItemType,
           comment: socialPosts.comment,
           createdAt: socialPosts.createdAt,
           updatedAt: socialPosts.updatedAt,
         })
         .from(socialPosts)
         .where(and(...whereConditions))
         .orderBy(desc(socialPosts.createdAt))
         .limit(parseInt(limit as string))
         .offset(parseInt(offset as string));

       // Get user info and engagement stats separately
       const postsWithDetails = await Promise.all(
         posts.map(async (post) => {
           // Get user info
           const [user] = await db
             .select({
               firstName: sql`first_name`,
               lastName: sql`last_name`,
               profileImageUrl: sql`profile_image_url`,
               civicLevel: sql`civic_level`,
               isVerified: sql`is_verified`,
             })
             .from(sql`users`)
             .where(eq(sql`id`, post.userId));

           // Get engagement stats
           const [likesCount] = await db
             .select({ count: count() })
             .from(sql`social_likes`)
             .where(eq(sql`post_id`, post.id));

           const [commentsCount] = await db
             .select({ count: count() })
             .from(sql`social_comments`)
             .where(eq(sql`post_id`, post.id));

           const [sharesCount] = await db
             .select({ count: count() })
             .from(sql`social_posts`)
             .where(and(
               eq(sql`original_item_id`, post.id),
               eq(sql`type`, 'share')
             ));

           // Check if current user liked/bookmarked
           const [isLiked] = currentUserId ? await db
             .select({ count: count() })
             .from(sql`social_likes`)
             .where(and(
               eq(sql`post_id`, post.id),
               eq(sql`user_id`, currentUserId)
             )) : [{ count: 0 }];

           const [isBookmarked] = currentUserId ? await db
             .select({ count: count() })
             .from(sql`social_bookmarks`)
             .where(and(
               eq(sql`post_id`, post.id),
               eq(sql`user_id`, currentUserId)
             )) : [{ count: 0 }];

           return {
             ...post,
             user: {
               id: post.userId,
               firstName: user?.firstName,
               lastName: user?.lastName,
               profileImageUrl: user?.profileImageUrl,
               civicLevel: user?.civicLevel,
               isVerified: user?.isVerified,
             },
             likesCount: likesCount?.count || 0,
             commentsCount: commentsCount?.count || 0,
             sharesCount: sharesCount?.count || 0,
             isLiked: (isLiked?.count || 0) > 0,
             isBookmarked: (isBookmarked?.count || 0) > 0,
           };
         })
       );

             // Use the posts with details
       const formattedPosts = postsWithDetails;

      res.json({
        posts: formattedPosts,
        total: formattedPosts.length,
        tab,
        filters: { type, visibility, sortBy },
        pagination: { limit: parseInt(limit as string), offset: parseInt(offset as string) }
      });
    } catch (error) {
      console.error('Get social posts error:', error);
      res.status(500).json({ error: "Failed to get social posts" });
    }
  });

  // POST /api/social/posts - Create a new post
  app.post('/api/social/posts', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { content, imageUrl, type, visibility, tags, location, mood } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Post content is required" });
      }

      // Validate post type
      const validTypes = ['post', 'share', 'poll', 'event'];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid post type" });
      }

      // Validate visibility
      const validVisibility = ['public', 'friends', 'private'];
      if (visibility && !validVisibility.includes(visibility)) {
        return res.status(400).json({ error: "Invalid visibility setting" });
      }

      // Create the post
      const [newPost] = await db
        .insert(socialPosts)
        .values({
          userId: currentUserId,
          content: content.trim(),
          imageUrl,
          type: type || 'post',
          visibility: visibility || 'public',
          tags: tags || [],
          location,
          mood,
        })
        .returning();

      // Record activity
      await db.insert(userActivities).values({
        userId: currentUserId,
        activityType: 'post_create',
        activityData: {
          postId: newPost.id,
          postType: newPost.type,
          contentLength: content.length,
        },
      });

      res.status(201).json(newPost);
    } catch (error) {
      console.error('Create social post error:', error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // POST /api/social/posts/:id/like - Like/unlike a post
  app.post('/api/social/posts/:id/like', jwtAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUserId = (req.user as any).id;
      const { action } = req.body; // 'like' or 'unlike'

      if (!['like', 'unlike'].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      if (action === 'like') {
        // Add like
        await db.insert(socialLikes).values({
          postId,
          userId: currentUserId,
        }).onConflictDoNothing();
      } else {
        // Remove like
        await db
          .delete(socialLikes)
          .where(and(
            eq(socialLikes.postId, postId),
            eq(socialLikes.userId, currentUserId)
          ));
      }

      // Record activity
      await db.insert(userActivities).values({
        userId: currentUserId,
        activityType: action === 'like' ? 'post_like' : 'post_unlike',
        activityData: {
          postId,
          action,
        },
      });

      res.json({ success: true, action });
    } catch (error) {
      console.error('Like post error:', error);
      res.status(500).json({ error: "Failed to like/unlike post" });
    }
  });

  // POST /api/social/posts/:id/comments - Add comment to post
  app.post('/api/social/posts/:id/comments', jwtAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUserId = (req.user as any).id;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      // Create comment
      const [newComment] = await db
        .insert(socialComments)
        .values({
          postId,
          userId: currentUserId,
          content: content.trim(),
        })
        .returning();

      // Record activity
      await db.insert(userActivities).values({
        userId: currentUserId,
        activityType: 'comment_create',
        activityData: {
          postId,
          commentId: newComment.id,
          contentLength: content.length,
        },
      });

      res.status(201).json(newComment);
    } catch (error) {
      console.error('Comment on post error:', error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // PUT /api/social/posts/:id - Edit a post
  app.put('/api/social/posts/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUserId = (req.user as any).id;
      const { content, imageUrl, visibility, tags, location, mood } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Post content is required" });
      }

      // Check if user owns the post
      const [existingPost] = await db
        .select()
        .from(socialPosts)
        .where(and(
          eq(socialPosts.id, postId),
          eq(socialPosts.userId, currentUserId)
        ));

      if (!existingPost) {
        return res.status(404).json({ error: "Post not found or you don't have permission to edit it" });
      }

      // Update the post
      const [updatedPost] = await db
        .update(socialPosts)
        .set({
          content: content.trim(),
          imageUrl,
          visibility: visibility || existingPost.visibility,
          tags: tags || existingPost.tags,
          location,
          mood,
          updatedAt: new Date(),
        })
        .where(and(
          eq(socialPosts.id, postId),
          eq(socialPosts.userId, currentUserId)
        ))
        .returning();

      // Record activity
      await db.insert(userActivities).values({
        userId: currentUserId,
        activityType: 'post_edit',
        activityData: {
          postId,
          contentLength: content.length,
        },
      });

      res.json(updatedPost);
    } catch (error) {
      console.error('Edit post error:', error);
      res.status(500).json({ error: "Failed to edit post" });
    }
  });

  // DELETE /api/social/posts/:id - Delete a post
  app.delete('/api/social/posts/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUserId = (req.user as any).id;

      // Check if user owns the post
      const [existingPost] = await db
        .select()
        .from(socialPosts)
        .where(and(
          eq(socialPosts.id, postId),
          eq(socialPosts.userId, currentUserId)
        ));

      if (!existingPost) {
        return res.status(404).json({ error: "Post not found or you don't have permission to delete it" });
      }

      // Soft delete - mark as deleted instead of actually deleting
      await db
        .update(socialPosts)
        .set({
          content: '[This post has been deleted]',
          imageUrl: null,
          tags: [],
          location: null,
          mood: null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(socialPosts.id, postId),
          eq(socialPosts.userId, currentUserId)
        ));

      // Record activity
      await db.insert(userActivities).values({
        userId: currentUserId,
        activityType: 'post_delete',
        activityData: {
          postId,
        },
      });

      res.json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // POST /api/social/posts/:id/share - Share a post
  app.post('/api/social/posts/:id/share', jwtAuth, async (req: Request, res: Response) => {
    try {
      const originalPostId = parseInt(req.params.id);
      const currentUserId = (req.user as any).id;
      const { comment } = req.body;

      // Get the original post
      const [originalPost] = await db
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.id, originalPostId));

      if (!originalPost) {
        return res.status(404).json({ error: "Original post not found" });
      }

      // Create shared post
      const [sharedPost] = await db
        .insert(socialPosts)
        .values({
          userId: currentUserId,
          content: comment || '',
          type: 'share',
          originalItemId: originalPostId,
          originalItemType: 'post',
          visibility: 'public',
        })
        .returning();

      // Record activity
      await db.insert(userActivities).values({
        userId: currentUserId,
        activityType: 'post_share',
        activityData: {
          originalPostId,
          sharedPostId: sharedPost.id,
        },
      });

      res.status(201).json(sharedPost);
    } catch (error) {
      console.error('Share post error:', error);
      res.status(500).json({ error: "Failed to share post" });
    }
  });

  // GET /api/social/posts/:id/comments - Get comments for a post
  app.get('/api/social/posts/:id/comments', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const { limit = 20, offset = 0 } = req.query;

      const comments = await db
        .select({
          id: socialComments.id,
          postId: socialComments.postId,
          userId: socialComments.userId,
          content: socialComments.content,
          createdAt: socialComments.createdAt,
          // User info
          userFirstName: sql`users.first_name`,
          userLastName: sql`users.last_name`,
          userProfileImageUrl: sql`users.profile_image_url`,
          userCivicLevel: sql`users.civic_level`,
          userIsVerified: sql`users.is_verified`,
        })
        .from(socialComments)
        .leftJoin(sql`users`, eq(socialComments.userId, sql`users.id`))
        .where(eq(socialComments.postId, postId))
        .orderBy(desc(socialComments.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Format comments for frontend
      const formattedComments = comments.map(comment => ({
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.userId,
          firstName: comment.userFirstName,
          lastName: comment.userLastName,
          profileImageUrl: comment.userProfileImageUrl,
          civicLevel: comment.userCivicLevel,
          isVerified: comment.userIsVerified,
        },
      }));

      res.json({
        comments: formattedComments,
        total: formattedComments.length,
        pagination: { limit: parseInt(limit as string), offset: parseInt(offset as string) }
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  // POST /api/social/friends - Friend requests
  app.post('/api/social/friends', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { friendId, action } = req.body; // action: 'send', 'accept', 'reject', 'remove'

      if (!friendId || !action) {
        return res.status(400).json({ error: "Friend ID and action are required" });
      }

      if (currentUserId === friendId) {
        return res.status(400).json({ error: "You cannot friend yourself" });
      }

      switch (action) {
        case 'send':
          // Send friend request
          await db.insert(userFriends).values({
            userId: currentUserId,
            friendId,
            status: 'pending',
          }).onConflictDoNothing();
          break;

        case 'accept':
          // Accept friend request
          await db
            .update(userFriends)
            .set({ status: 'accepted' })
            .where(and(
              eq(userFriends.userId, friendId),
              eq(userFriends.friendId, currentUserId),
              eq(userFriends.status, 'pending')
            ));
          break;

        case 'reject':
          // Reject friend request
          await db
            .delete(userFriends)
            .where(and(
              eq(userFriends.userId, friendId),
              eq(userFriends.friendId, currentUserId),
              eq(userFriends.status, 'pending')
            ));
          break;

        case 'remove':
          // Remove friend
          await db
            .delete(userFriends)
            .where(or(
              and(eq(userFriends.userId, currentUserId), eq(userFriends.friendId, friendId)),
              and(eq(userFriends.userId, friendId), eq(userFriends.friendId, currentUserId))
            ));
          break;

        default:
          return res.status(400).json({ error: "Invalid action" });
      }

      // Record activity
      await db.insert(userActivities).values({
        userId: currentUserId,
        activityType: `friend_${action}`,
        activityData: {
          friendId,
          action,
        },
      });

      res.json({ success: true, action });
    } catch (error) {
      console.error('Friend action error:', error);
      res.status(500).json({ error: "Failed to perform friend action" });
    }
  });

  // GET /api/social/friends - Get friends list
  app.get('/api/social/friends', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { status = 'accepted' } = req.query;

      const friends = await db
        .select({
          id: userFriends.id,
          userId: userFriends.userId,
          friendId: userFriends.friendId,
          status: userFriends.status,
          createdAt: userFriends.createdAt,
          // Friend info
          friendFirstName: sql`users.first_name`,
          friendLastName: sql`users.last_name`,
          friendProfileImageUrl: sql`users.profile_image_url`,
          friendCivicLevel: sql`users.civic_level`,
          friendIsVerified: sql`users.is_verified`,
        })
        .from(userFriends)
        .leftJoin(sql`users`, eq(userFriends.friendId, sql`users.id`))
        .where(and(
          eq(userFriends.userId, currentUserId),
          eq(userFriends.status, status as string)
        ));

      // Format friends for frontend
      const formattedFriends = friends.map(friend => ({
        id: friend.id,
        userId: friend.userId,
        friendId: friend.friendId,
        status: friend.status,
        createdAt: friend.createdAt,
        friend: {
          id: friend.friendId,
          firstName: friend.friendFirstName,
          lastName: friend.friendLastName,
          profileImageUrl: friend.friendProfileImageUrl,
          civicLevel: friend.friendCivicLevel,
          isVerified: friend.friendIsVerified,
        },
      }));

      res.json({
        friends: formattedFriends,
        total: formattedFriends.length,
        status
      });
    } catch (error) {
      console.error('Get friends error:', error);
      res.status(500).json({ error: "Failed to get friends" });
    }
  });

  // GET /api/social/users/search - Search users
  app.get('/api/social/users/search', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { q = '', limit = 20, offset = 0 } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }

      const searchTerm = `%${q.trim()}%`;

      // Search users by name, excluding current user
      const users = await db
        .select({
          id: sql`users.id`,
          firstName: sql`users.first_name`,
          lastName: sql`users.last_name`,
          email: sql`users.email`,
          profileImageUrl: sql`users.profile_image_url`,
          civicLevel: sql`users.civic_level`,
          isVerified: sql`users.is_verified`,
          createdAt: sql`users.created_at`,
          // Check if already friends
          isFriend: sql`CASE WHEN user_friends.id IS NOT NULL THEN true ELSE false END`,
          friendStatus: sql`user_friends.status`,
        })
        .from(sql`users`)
        .leftJoin(userFriends, and(
          eq(sql`users.id`, userFriends.friendId),
          eq(userFriends.userId, currentUserId)
        ))
        .where(and(
          ne(sql`users.id`, currentUserId),
          or(
            sql`LOWER(users.first_name) LIKE LOWER(${searchTerm})`,
            sql`LOWER(users.last_name) LIKE LOWER(${searchTerm})`,
            sql`LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE LOWER(${searchTerm})`
          )
        ))
        .limit(Number(limit))
        .offset(Number(offset));

      // Format users for frontend
      const formattedUsers = users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        civicLevel: user.civicLevel,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        isFriend: user.isFriend,
        friendStatus: user.friendStatus,
        displayName: `${user.firstName} ${user.lastName}`,
      }));

      res.json({
        users: formattedUsers,
        total: formattedUsers.length,
        query: q,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error('User search error:', error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // POST /api/social/messages - Send message
  app.post('/api/social/messages', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { recipientId, content } = req.body;

      if (!recipientId || !content) {
        return res.status(400).json({ error: "Recipient ID and content are required" });
      }

      if (currentUserId === recipientId) {
        return res.status(400).json({ error: "You cannot message yourself" });
      }

      // Create message (assuming you have a messages table)
      // This is a placeholder - you'll need to create the messages table
      const message = {
        id: Date.now(),
        senderId: currentUserId,
        recipientId,
        content: content.trim(),
        createdAt: new Date(),
      };

      // Record activity
      await db.insert(userActivities).values({
        userId: currentUserId,
        activityType: 'message_send',
        activityData: {
          recipientId,
          contentLength: content.length,
        },
      });

      res.status(201).json(message);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // GET /api/social/profile/:userId - Get user profile
  app.get('/api/social/profile/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user?.id;

      // Get user profile
      const [user] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          civicLevel: users.civicLevel,
          isVerified: users.isVerified,
          createdAt: users.createdAt,
          city: users.city,
          province: users.province,
          country: users.country,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user stats
      const [postsCount] = await db
        .select({ count: sql`COUNT(*)` })
        .from(socialPosts)
        .where(eq(socialPosts.userId, userId));

      const [friendsCount] = await db
        .select({ count: sql`COUNT(*)` })
        .from(userFriends)
        .where(and(
          eq(userFriends.userId, userId),
          eq(userFriends.status, 'accepted')
        ));

      // Check if current user is friends with this user
      let friendshipStatus = null;
      if (currentUserId && currentUserId !== userId) {
        const [friendship] = await db
          .select({
            status: userFriends.status,
          })
          .from(userFriends)
          .where(and(
            eq(userFriends.userId, currentUserId),
            eq(userFriends.friendId, userId)
          ));
        
        if (friendship) {
          friendshipStatus = friendship.status;
        }
      }

      // Record profile view if not own profile
      if (currentUserId && currentUserId !== userId) {
        try {
          await db.insert(profileViews).values({
            viewerId: currentUserId,
            profileId: userId,
          });
        } catch (error) {
          // Ignore duplicate view errors
        }
      }

      res.json({
        profile: {
          ...user,
          displayName: `${user.firstName} ${user.lastName}`,
        },
        stats: {
          postsCount: Number(postsCount.count),
          friendsCount: Number(friendsCount.count),
        },
        friendshipStatus,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // PUT /api/social/profile - Update own profile
  app.put('/api/social/profile', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { firstName, lastName, city, province, country } = req.body;

      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (city !== undefined) updateData.city = city;
      if (province !== undefined) updateData.province = province;
      if (country !== undefined) updateData.country = country;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, currentUserId));

      // Record activity
      await db.insert(userActivities).values({
        userId: currentUserId,
        activityType: 'profile_update',
        activityData: {
          updatedFields: Object.keys(updateData),
        },
      });

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // GET /api/social/messages - Get messages between users
  app.get('/api/social/messages', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { otherUserId, limit = 50, offset = 0 } = req.query;

      if (!otherUserId) {
        return res.status(400).json({ error: "Other user ID is required" });
      }

      // Get messages between these two users
      const messages = await db
        .select({
          id: userMessages.id,
          senderId: userMessages.senderId,
          recipientId: userMessages.recipientId,
          content: userMessages.content,
          createdAt: userMessages.createdAt,
          isRead: userMessages.isRead,
        })
        .from(userMessages)
        .where(and(
          or(
            and(eq(userMessages.senderId, currentUserId), eq(userMessages.recipientId, otherUserId as string)),
            and(eq(userMessages.senderId, otherUserId as string), eq(userMessages.recipientId, currentUserId))
          )
        ))
        .orderBy(asc(userMessages.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      // Mark messages as read
      await db
        .update(userMessages)
        .set({ isRead: true })
        .where(and(
          eq(userMessages.senderId, otherUserId as string),
          eq(userMessages.recipientId, currentUserId),
          eq(userMessages.isRead, false)
        ));

      res.json({
        messages,
        total: messages.length,
        otherUserId,
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // GET /api/social/conversations - Get recent conversations
  app.get('/api/social/conversations', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;

      // Get recent messages where user is involved
      const recentMessages = await db
        .select({
          id: userMessages.id,
          senderId: userMessages.senderId,
          recipientId: userMessages.recipientId,
          content: userMessages.content,
          createdAt: userMessages.createdAt,
          isRead: userMessages.isRead,
        })
        .from(userMessages)
        .where(or(
          eq(userMessages.senderId, currentUserId),
          eq(userMessages.recipientId, currentUserId)
        ))
        .orderBy(desc(userMessages.createdAt))
        .limit(20);

      // Group by other user and get latest message
      const conversationsMap = new Map();
      recentMessages.forEach(message => {
        const otherUserId = message.senderId === currentUserId 
          ? message.recipientId 
          : message.senderId;
        
        if (!conversationsMap.has(otherUserId) || 
            (message.createdAt && conversationsMap.get(otherUserId).lastMessageAt && 
             new Date(message.createdAt) > new Date(conversationsMap.get(otherUserId).lastMessageAt))) {
          conversationsMap.set(otherUserId, {
            otherUserId,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            unreadCount: 0,
          });
        }
      });

      // Get unread counts and user info
      const conversationsWithDetails = await Promise.all(
        Array.from(conversationsMap.values()).map(async (conv) => {
          const [unreadCount] = await db
            .select({ count: sql`COUNT(*)` })
            .from(userMessages)
            .where(and(
              eq(userMessages.senderId, conv.otherUserId),
              eq(userMessages.recipientId, currentUserId),
              eq(userMessages.isRead, false)
            ));

          const [otherUser] = await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              profileImageUrl: users.profileImageUrl,
            })
            .from(users)
            .where(eq(users.id, conv.otherUserId));

          return {
            ...conv,
            unreadCount: Number(unreadCount.count),
            otherUser: {
              id: otherUser.id,
              firstName: otherUser.firstName,
              lastName: otherUser.lastName,
              profileImageUrl: otherUser.profileImageUrl,
              displayName: `${otherUser.firstName} ${otherUser.lastName}`,
            },
          };
        })
      );

      res.json({
        conversations: conversationsWithDetails,
        total: conversationsWithDetails.length,
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  // POST /api/social/notifications - Create notification
  app.post('/api/social/notifications', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { recipientId, type, title, message, data } = req.body;

      if (!recipientId || !type || !title || !message) {
        return res.status(400).json({ error: "Recipient ID, type, title, and message are required" });
      }

      const notification = await db.insert(notifications).values({
        userId: recipientId,
        type,
        title,
        message,
        sourceModule: 'social',
        sourceId: currentUserId,
        isRead: false,
      }).returning();

      res.status(201).json(notification[0]);
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // GET /api/social/notifications - Get user notifications
  app.get('/api/social/notifications', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { limit = 20, offset = 0, unreadOnly = false } = req.query;

      let whereConditions = [eq(notifications.userId, currentUserId)];
      
      if (unreadOnly === 'true') {
        whereConditions.push(eq(notifications.isRead, false));
      }

      const userNotifications = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          sourceModule: notifications.sourceModule,
          sourceId: notifications.sourceId,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(and(...whereConditions))
        .orderBy(desc(notifications.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      res.json({
        notifications: userNotifications,
        total: userNotifications.length,
        unreadCount: userNotifications.filter(n => !n.isRead).length,
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // PUT /api/social/notifications/:id/read - Mark notification as read
  app.put('/api/social/notifications/:id/read', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { id } = req.params;

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, Number(id)),
          eq(notifications.userId, currentUserId)
        ));

      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // PUT /api/social/notifications/read-all - Mark all notifications as read
  app.put('/api/social/notifications/read-all', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.userId, currentUserId),
          eq(notifications.isRead, false)
        ));

      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // POST /api/social/posts/:id/report - Report a post
  app.post('/api/social/posts/:id/report', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { id } = req.params;
      const { reason, evidence } = req.body;

      if (!reason) {
        return res.status(400).json({ error: "Report reason is required" });
      }

      // Check if post exists
      const [post] = await db
        .select({ id: socialPosts.id, userId: socialPosts.userId })
        .from(socialPosts)
        .where(eq(socialPosts.id, Number(id)));

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.userId === currentUserId) {
        return res.status(400).json({ error: "You cannot report your own post" });
      }

      // Create report
      await db.insert(userReports).values({
        reporterId: currentUserId,
        reportedId: post.userId,
        reportType: 'post',
        reportReason: reason,
        evidence: {
          postId: Number(id),
          evidence: evidence || {},
        },
      });

      res.json({ message: "Post reported successfully" });
    } catch (error) {
      console.error('Report post error:', error);
      res.status(500).json({ error: "Failed to report post" });
    }
  });

  // POST /api/social/users/:userId/block - Block a user
  app.post('/api/social/users/:userId/block', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { userId } = req.params;
      const { reason } = req.body;

      if (currentUserId === userId) {
        return res.status(400).json({ error: "You cannot block yourself" });
      }

      // Check if user exists
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create block
      await db.insert(userBlocks).values({
        blockerId: currentUserId,
        blockedId: userId,
        reason: reason || null,
      });

      // Remove any existing friendship
      await db
        .delete(userFriends)
        .where(or(
          and(eq(userFriends.userId, currentUserId), eq(userFriends.friendId, userId)),
          and(eq(userFriends.userId, userId), eq(userFriends.friendId, currentUserId))
        ));

      res.json({ message: "User blocked successfully" });
    } catch (error) {
      console.error('Block user error:', error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  // DELETE /api/social/users/:userId/block - Unblock a user
  app.delete('/api/social/users/:userId/block', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { userId } = req.params;

      await db
        .delete(userBlocks)
        .where(and(
          eq(userBlocks.blockerId, currentUserId),
          eq(userBlocks.blockedId, userId)
        ));

      res.json({ message: "User unblocked successfully" });
    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  // GET /api/social/feed/trending - Get trending posts
  app.get('/api/social/feed/trending', async (req: Request, res: Response) => {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const currentUserId = (req as any).user?.id;

      // Get posts with high engagement (likes + comments)
      const trendingPosts = await db
        .select({
          id: socialPosts.id,
          userId: socialPosts.userId,
          content: socialPosts.content,
          imageUrl: socialPosts.imageUrl,
          type: socialPosts.type,
          visibility: socialPosts.visibility,
          tags: socialPosts.tags,
          location: socialPosts.location,
          mood: socialPosts.mood,
          originalItemId: socialPosts.originalItemId,
          originalItemType: socialPosts.originalItemType,
          comment: socialPosts.comment,
          createdAt: socialPosts.createdAt,
          updatedAt: socialPosts.updatedAt,
          // Engagement metrics
          likesCount: sql`(SELECT COUNT(*) FROM ${socialLikes} WHERE ${socialLikes.postId} = ${socialPosts.id})`,
          commentsCount: sql`(SELECT COUNT(*) FROM ${socialComments} WHERE ${socialComments.postId} = ${socialPosts.id})`,
        })
        .from(socialPosts)
        .where(and(
          eq(socialPosts.visibility, 'public'),
          gte(socialPosts.createdAt, sql`NOW() - INTERVAL '7 days'`)
        ))
        .orderBy(desc(sql`(likesCount + commentsCount)`))
        .limit(Number(limit))
        .offset(Number(offset));

      // Get user info and format posts
      const postsWithDetails = await Promise.all(
        trendingPosts.map(async (post) => {
          const [user] = await db
            .select({
              firstName: users.firstName,
              lastName: users.lastName,
              profileImageUrl: users.profileImageUrl,
              civicLevel: users.civicLevel,
              isVerified: users.isVerified,
            })
            .from(users)
            .where(eq(users.id, post.userId));

          return {
            ...post,
            user: {
              id: post.userId,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              civicLevel: user.civicLevel,
              isVerified: user.isVerified,
              displayName: `${user.firstName} ${user.lastName}`,
            },
            engagementScore: Number(post.likesCount) + Number(post.commentsCount),
          };
        })
      );

      res.json({
        posts: postsWithDetails,
        total: postsWithDetails.length,
        type: 'trending',
      });
    } catch (error) {
      console.error('Get trending posts error:', error);
      res.status(500).json({ error: "Failed to get trending posts" });
    }
  });
} 