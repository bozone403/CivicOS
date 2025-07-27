import { db } from '../db.js';
import { socialPosts, userFriends, socialLikes, socialComments, userActivities } from '../../shared/schema.js';
import { eq, and, desc, count, sql, inArray, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
// JWT Auth middleware
function jwtAuth(req, res, next) {
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
    }
    catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
export function registerSocialRoutes(app) {
    // GET /api/social/posts - Get social posts
    app.get('/api/social/posts', async (req, res) => {
        try {
            const { tab = 'all', type = 'all', visibility = 'all', sortBy = 'recent', limit = 20, offset = 0 } = req.query;
            const currentUserId = req.user?.id;
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
                        .where(and(eq(userFriends.userId, currentUserId), eq(userFriends.status, 'accepted')));
                    const friendPostIds = friendsPosts.map(p => p.postId);
                    if (friendPostIds.length > 0) {
                        whereConditions.push(inArray(socialPosts.id, friendPostIds));
                    }
                    else {
                        whereConditions.push(sql `1 = 0`); // No friends, no posts
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
                        whereConditions.push(sql `(${socialPosts.visibility} = 'public' OR ${socialPosts.userId} = ${currentUserId})`);
                    }
                    else {
                        whereConditions.push(eq(socialPosts.visibility, 'public'));
                    }
            }
            // Filter by type
            if (type !== 'all') {
                whereConditions.push(eq(socialPosts.type, type));
            }
            // Filter by visibility
            if (visibility !== 'all') {
                whereConditions.push(eq(socialPosts.visibility, visibility));
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
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            // Get user info and engagement stats separately
            const postsWithDetails = await Promise.all(posts.map(async (post) => {
                // Get user info
                const [user] = await db
                    .select({
                    firstName: sql `first_name`,
                    lastName: sql `last_name`,
                    profileImageUrl: sql `profile_image_url`,
                    civicLevel: sql `civic_level`,
                    isVerified: sql `is_verified`,
                })
                    .from(sql `users`)
                    .where(eq(sql `id`, post.userId));
                // Get engagement stats
                const [likesCount] = await db
                    .select({ count: count() })
                    .from(sql `social_likes`)
                    .where(eq(sql `post_id`, post.id));
                const [commentsCount] = await db
                    .select({ count: count() })
                    .from(sql `social_comments`)
                    .where(eq(sql `post_id`, post.id));
                const [sharesCount] = await db
                    .select({ count: count() })
                    .from(sql `social_shares`)
                    .where(eq(sql `post_id`, post.id));
                // Check if current user liked/bookmarked
                const [isLiked] = currentUserId ? await db
                    .select({ count: count() })
                    .from(sql `social_likes`)
                    .where(and(eq(sql `post_id`, post.id), eq(sql `user_id`, currentUserId))) : [{ count: 0 }];
                const [isBookmarked] = currentUserId ? await db
                    .select({ count: count() })
                    .from(sql `social_bookmarks`)
                    .where(and(eq(sql `post_id`, post.id), eq(sql `user_id`, currentUserId))) : [{ count: 0 }];
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
            }));
            // Use the posts with details
            const formattedPosts = postsWithDetails;
            res.json({
                posts: formattedPosts,
                total: formattedPosts.length,
                tab,
                filters: { type, visibility, sortBy },
                pagination: { limit: parseInt(limit), offset: parseInt(offset) }
            });
        }
        catch (error) {
            console.error('Get social posts error:', error);
            res.status(500).json({ error: "Failed to get social posts" });
        }
    });
    // POST /api/social/posts - Create a new post
    app.post('/api/social/posts', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
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
        }
        catch (error) {
            console.error('Create social post error:', error);
            res.status(500).json({ error: "Failed to create post" });
        }
    });
    // POST /api/social/posts/:id/like - Like/unlike a post
    app.post('/api/social/posts/:id/like', jwtAuth, async (req, res) => {
        try {
            const postId = parseInt(req.params.id);
            const currentUserId = req.user.id;
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
            }
            else {
                // Remove like
                await db
                    .delete(socialLikes)
                    .where(and(eq(socialLikes.postId, postId), eq(socialLikes.userId, currentUserId)));
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
        }
        catch (error) {
            console.error('Like post error:', error);
            res.status(500).json({ error: "Failed to like/unlike post" });
        }
    });
    // POST /api/social/posts/:id/comments - Add comment to post
    app.post('/api/social/posts/:id/comments', jwtAuth, async (req, res) => {
        try {
            const postId = parseInt(req.params.id);
            const currentUserId = req.user.id;
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
        }
        catch (error) {
            console.error('Comment on post error:', error);
            res.status(500).json({ error: "Failed to add comment" });
        }
    });
    // POST /api/social/posts/:id/share - Share a post
    app.post('/api/social/posts/:id/share', jwtAuth, async (req, res) => {
        try {
            const originalPostId = parseInt(req.params.id);
            const currentUserId = req.user.id;
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
        }
        catch (error) {
            console.error('Share post error:', error);
            res.status(500).json({ error: "Failed to share post" });
        }
    });
    // GET /api/social/posts/:id/comments - Get comments for a post
    app.get('/api/social/posts/:id/comments', async (req, res) => {
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
                userFirstName: sql `users.first_name`,
                userLastName: sql `users.last_name`,
                userProfileImageUrl: sql `users.profile_image_url`,
                userCivicLevel: sql `users.civic_level`,
                userIsVerified: sql `users.is_verified`,
            })
                .from(socialComments)
                .leftJoin(sql `users`, eq(socialComments.userId, sql `users.id`))
                .where(eq(socialComments.postId, postId))
                .orderBy(desc(socialComments.createdAt))
                .limit(parseInt(limit))
                .offset(parseInt(offset));
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
                pagination: { limit: parseInt(limit), offset: parseInt(offset) }
            });
        }
        catch (error) {
            console.error('Get comments error:', error);
            res.status(500).json({ error: "Failed to get comments" });
        }
    });
    // POST /api/social/friends - Friend requests
    app.post('/api/social/friends', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
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
                        .where(and(eq(userFriends.userId, friendId), eq(userFriends.friendId, currentUserId), eq(userFriends.status, 'pending')));
                    break;
                case 'reject':
                    // Reject friend request
                    await db
                        .delete(userFriends)
                        .where(and(eq(userFriends.userId, friendId), eq(userFriends.friendId, currentUserId), eq(userFriends.status, 'pending')));
                    break;
                case 'remove':
                    // Remove friend
                    await db
                        .delete(userFriends)
                        .where(and(or(and(eq(userFriends.userId, currentUserId), eq(userFriends.friendId, friendId)), and(eq(userFriends.userId, friendId), eq(userFriends.friendId, currentUserId)))));
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
        }
        catch (error) {
            console.error('Friend action error:', error);
            res.status(500).json({ error: "Failed to perform friend action" });
        }
    });
    // GET /api/social/friends - Get friends list
    app.get('/api/social/friends', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { status = 'accepted' } = req.query;
            const friends = await db
                .select({
                id: userFriends.id,
                userId: userFriends.userId,
                friendId: userFriends.friendId,
                status: userFriends.status,
                createdAt: userFriends.createdAt,
                // Friend info
                friendFirstName: sql `users.first_name`,
                friendLastName: sql `users.last_name`,
                friendProfileImageUrl: sql `users.profile_image_url`,
                friendCivicLevel: sql `users.civic_level`,
                friendIsVerified: sql `users.is_verified`,
            })
                .from(userFriends)
                .leftJoin(sql `users`, eq(userFriends.friendId, sql `users.id`))
                .where(and(eq(userFriends.userId, currentUserId), eq(userFriends.status, status)));
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
        }
        catch (error) {
            console.error('Get friends error:', error);
            res.status(500).json({ error: "Failed to get friends" });
        }
    });
    // POST /api/social/messages - Send message
    app.post('/api/social/messages', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
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
        }
        catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ error: "Failed to send message" });
        }
    });
}
