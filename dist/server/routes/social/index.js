import { db } from "../db.js";
import { users, socialPosts, socialComments, socialLikes, userFriends, userMessages, notifications, userActivity, socialShares, socialBookmarks, userFollows } from "../../shared/schema.js";
import { eq, and, or, desc, asc, count, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import pino from "pino";
const logger = pino();
// Enhanced JWT Auth middleware
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
    // ===== CORE SOCIAL FEED ENDPOINTS =====
    // GET /api/social/posts - Main posts endpoint (alias for feed)
    app.get('/api/social/posts', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
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
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            // Get interaction counts and user interaction status
            const postsWithInteractions = await Promise.all(feedPosts.map(async (post) => {
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
                    .where(and(eq(socialLikes.postId, post.id), eq(socialLikes.userId, currentUserId)))
                    .limit(1);
                return {
                    ...post,
                    likesCount: likesCount[0]?.count || 0,
                    commentsCount: commentsCount[0]?.count || 0,
                    isLiked: userLike.length > 0,
                };
            }));
            res.json({
                success: true,
                posts: postsWithInteractions,
                totalPosts: feedPosts.length,
            });
        }
        catch (error) {
            logger.error('Error fetching social posts:', error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch social posts",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // POST /api/social/posts - Create new post
    app.post('/api/social/posts', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { content, imageUrl, type = 'post', visibility = 'public' } = req.body;
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Post content is required"
                });
            }
            const newPost = await db.insert(socialPosts).values({
                userId: currentUserId,
                content: content.trim(),
                imageUrl,
                type,
                visibility,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();
            res.status(201).json({
                success: true,
                message: "Post created successfully",
                post: newPost[0]
            });
        }
        catch (error) {
            logger.error('Error creating social post:', error);
            res.status(500).json({
                success: false,
                message: "Failed to create post",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // GET /api/social/feed - Enhanced social feed with proper error handling
    app.get('/api/social/feed', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { limit = 20, offset = 0 } = req.query;
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
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            // Get interaction counts and user interaction status
            const postsWithInteractions = await Promise.all(feedPosts.map(async (post) => {
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
                    .where(and(eq(socialLikes.postId, post.id), eq(socialLikes.userId, currentUserId)))
                    .limit(1);
                return {
                    ...post,
                    likesCount: likesCount[0]?.count || 0,
                    commentsCount: commentsCount[0]?.count || 0,
                    isLiked: userLike.length > 0,
                    user: post.user
                };
            }));
            res.json({
                success: true,
                feed: postsWithInteractions
            });
        }
        catch (error) {
            console.error('Social feed error:', error);
            res.status(500).json({ error: "Failed to fetch social feed" });
        }
    });
    // POST /api/social/posts - Enhanced post creation
    app.post('/api/social/posts', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { content, type = 'text', visibility = 'public', imageUrl } = req.body;
            if (!content || content.trim().length === 0) {
                return res.status(400).json({ error: "Post content is required" });
            }
            const post = await db.insert(socialPosts).values({
                userId: currentUserId,
                content: content.trim(),
                type,
                visibility,
                imageUrl: imageUrl || null
            }).returning();
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
        }
        catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({ error: "Failed to create post" });
        }
    });
    // GET /api/social/posts/user/:username - Enhanced user posts
    app.get('/api/social/posts/user/:username', async (req, res) => {
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
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            // Get interaction counts for each post
            const postsWithCounts = await Promise.all(posts.map(async (post) => {
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
            }));
            res.json({
                success: true,
                posts: postsWithCounts
            });
        }
        catch (error) {
            console.error('User posts error:', error);
            res.status(500).json({ error: "Failed to fetch user posts" });
        }
    });
    // ===== INTERACTION ENDPOINTS =====
    // POST /api/social/posts/:id/like - Enhanced like system
    app.post('/api/social/posts/:id/like', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const postId = parseInt(req.params.id);
            const { reaction = '👍' } = req.body;
            if (!userId) {
                return res.status(401).json({ error: "Authentication required" });
            }
            // Check if post exists
            const post = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
            if (post.length === 0) {
                return res.status(404).json({ error: "Post not found" });
            }
            // Check if already liked
            const existingLike = await db.select().from(socialLikes).where(and(eq(socialLikes.postId, postId), eq(socialLikes.userId, userId))).limit(1);
            if (existingLike.length > 0) {
                // Unlike
                await db.delete(socialLikes).where(and(eq(socialLikes.postId, postId), eq(socialLikes.userId, userId)));
                res.json({ success: true, liked: false, message: "Post unliked" });
            }
            else {
                // Like
                await db.insert(socialLikes).values({
                    postId,
                    userId,
                    reaction
                });
                res.json({ success: true, liked: true, message: "Post liked" });
            }
        }
        catch (error) {
            console.error('Like post error:', error);
            res.status(500).json({ error: "Failed to like post" });
        }
    });
    // POST /api/social/posts/:id/comment - Enhanced comment system
    app.post('/api/social/posts/:id/comment', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const postId = parseInt(req.params.id);
            const { content } = req.body;
            if (!userId) {
                return res.status(401).json({ error: "Authentication required" });
            }
            if (!content || content.trim().length === 0) {
                return res.status(400).json({ error: "Comment content is required" });
            }
            // Check if post exists
            const post = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
            if (post.length === 0) {
                return res.status(404).json({ error: "Post not found" });
            }
            const comment = await db.insert(socialComments).values({
                postId,
                userId,
                content: content.trim()
            }).returning();
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
        }
        catch (error) {
            console.error('Comment error:', error);
            res.status(500).json({ error: "Failed to add comment" });
        }
    });
    // ===== MESSAGING SYSTEM =====
    // GET /api/social/conversations - Enhanced conversations
    app.get('/api/social/conversations', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Authentication required" });
            }
            // Get conversations where user is sender or recipient
            const conversations = await db
                .select({
                otherUserId: sql `CASE 
            WHEN ${userMessages.senderId} = ${userId} THEN ${userMessages.recipientId}
            ELSE ${userMessages.senderId}
          END`,
                lastMessage: userMessages.content,
                lastMessageAt: userMessages.createdAt,
                unreadCount: sql `COUNT(CASE WHEN ${userMessages.isRead} = false AND ${userMessages.recipientId} = ${userId} THEN 1 END)`
            })
                .from(userMessages)
                .where(or(eq(userMessages.senderId, userId), eq(userMessages.recipientId, userId)))
                .groupBy(sql `CASE 
          WHEN ${userMessages.senderId} = ${userId} THEN ${userMessages.recipientId}
          ELSE ${userMessages.senderId}
        END`, userMessages.content, userMessages.createdAt)
                .orderBy(desc(userMessages.createdAt));
            // Get user data for each conversation
            const conversationsWithUsers = await Promise.all(conversations.map(async (conv) => {
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
                return {
                    ...conv,
                    otherUser: user
                };
            }));
            res.json({
                success: true,
                conversations: conversationsWithUsers
            });
        }
        catch (error) {
            console.error('Conversations error:', error);
            res.status(500).json({ error: "Failed to fetch conversations" });
        }
    });
    // GET /api/social/messages - Enhanced messages
    app.get('/api/social/messages', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
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
                .where(or(and(eq(userMessages.senderId, userId), eq(userMessages.recipientId, otherUserId)), and(eq(userMessages.senderId, otherUserId), eq(userMessages.recipientId, userId))))
                .orderBy(asc(userMessages.createdAt));
            // Mark messages as read
            await db
                .update(userMessages)
                .set({ isRead: true })
                .where(and(eq(userMessages.recipientId, userId), eq(userMessages.senderId, otherUserId), eq(userMessages.isRead, false)));
            res.json({
                success: true,
                messages
            });
        }
        catch (error) {
            console.error('Messages error:', error);
            res.status(500).json({ error: "Failed to fetch messages" });
        }
    });
    // POST /api/social/messages - Enhanced send message
    app.post('/api/social/messages', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { recipientId, content } = req.body;
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
                content: content.trim()
            }).returning();
            res.json({
                success: true,
                message: message[0]
            });
        }
        catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ error: "Failed to send message" });
        }
    });
    // ===== FRIENDS SYSTEM =====
    // GET /api/social/friends - Enhanced friends list
    app.get('/api/social/friends', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { status = 'accepted' } = req.query;
            if (!userId) {
                return res.status(401).json({ error: "Authentication required" });
            }
            const friends = await db
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
                .where(and(eq(userFriends.userId, userId), eq(userFriends.status, status)));
            res.json({
                success: true,
                friends
            });
        }
        catch (error) {
            console.error('Friends error:', error);
            res.status(500).json({ error: "Failed to fetch friends" });
        }
    });
    // POST /api/social/friends - Enhanced add friend
    app.post('/api/social/friends', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { friendId } = req.body;
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
            const existingFriendship = await db.select().from(userFriends).where(or(and(eq(userFriends.userId, userId), eq(userFriends.friendId, friendId)), and(eq(userFriends.userId, friendId), eq(userFriends.friendId, userId)))).limit(1);
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
        }
        catch (error) {
            console.error('Add friend error:', error);
            res.status(500).json({ error: "Failed to add friend" });
        }
    });
    // POST /api/social/friends/accept - Enhanced accept friend
    app.post('/api/social/friends/accept', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { friendId } = req.body;
            if (!userId) {
                return res.status(401).json({ error: "Authentication required" });
            }
            if (!friendId) {
                return res.status(400).json({ error: "friendId is required" });
            }
            // Update friendship status
            await db.update(userFriends).set({ status: 'accepted' }).where(and(eq(userFriends.userId, friendId), eq(userFriends.friendId, userId)));
            res.json({ success: true, message: "Friend request accepted" });
        }
        catch (error) {
            console.error('Accept friend error:', error);
            res.status(500).json({ error: "Failed to accept friend" });
        }
    });
    // ===== NOTIFICATIONS SYSTEM =====
    // GET /api/social/notifications - Enhanced notifications
    app.get('/api/social/notifications', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
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
        }
        catch (error) {
            console.error('Notifications error:', error);
            res.status(500).json({ error: "Failed to fetch notifications" });
        }
    });
    // POST /api/social/notifications/:id/read - Enhanced mark read
    app.post('/api/social/notifications/:id/read', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const notificationId = parseInt(req.params.id);
            if (!userId) {
                return res.status(401).json({ error: "Authentication required" });
            }
            await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
            res.json({ success: true, message: "Notification marked as read" });
        }
        catch (error) {
            console.error('Mark notification read error:', error);
            res.status(500).json({ error: "Failed to mark notification as read" });
        }
    });
    // ===== ACTIVITY TRACKING =====
    // GET /api/social/activity - Enhanced user activity
    app.get('/api/social/activity', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
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
        }
        catch (error) {
            console.error('User activity error:', error);
            res.status(500).json({ error: "Failed to fetch user activity" });
        }
    });
    // ===== CONTENT MANAGEMENT =====
    // GET /api/social/bookmarks - Enhanced bookmarks
    app.get('/api/social/bookmarks', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
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
        }
        catch (error) {
            console.error('Bookmarks error:', error);
            res.status(500).json({ error: "Failed to fetch bookmarks" });
        }
    });
    // POST /api/social/bookmarks - Enhanced add bookmark
    app.post('/api/social/bookmarks', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { postId } = req.body;
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
            const existingBookmark = await db.select().from(socialBookmarks).where(and(eq(socialBookmarks.userId, userId), eq(socialBookmarks.postId, postId))).limit(1);
            if (existingBookmark.length > 0) {
                // Remove bookmark
                await db.delete(socialBookmarks).where(and(eq(socialBookmarks.userId, userId), eq(socialBookmarks.postId, postId)));
                res.json({ success: true, bookmarked: false, message: "Bookmark removed" });
            }
            else {
                // Add bookmark
                await db.insert(socialBookmarks).values({
                    userId,
                    postId
                });
                res.json({ success: true, bookmarked: true, message: "Post bookmarked" });
            }
        }
        catch (error) {
            console.error('Bookmark error:', error);
            res.status(500).json({ error: "Failed to bookmark post" });
        }
    });
    // GET /api/social/shares - Enhanced shares
    app.get('/api/social/shares', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
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
        }
        catch (error) {
            console.error('Shares error:', error);
            res.status(500).json({ error: "Failed to fetch shares" });
        }
    });
    // POST /api/social/posts/:id/share - Enhanced share post
    app.post('/api/social/posts/:id/share', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const postId = parseInt(req.params.id);
            const { platform = 'internal' } = req.body;
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
        }
        catch (error) {
            console.error('Share post error:', error);
            res.status(500).json({ error: "Failed to share post" });
        }
    });
    // ===== USER SEARCH AND PROFILES =====
    // GET /api/social/users/search - Enhanced user search
    app.get('/api/social/users/search', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { q } = req.query;
            if (!userId) {
                return res.status(401).json({ error: "Authentication required" });
            }
            if (!q || q.length < 2) {
                return res.status(400).json({ error: "Search query must be at least 2 characters" });
            }
            const searchResults = await db
                .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                username: users.username,
                profileImageUrl: users.profileImageUrl,
                civicLevel: users.civicLevel,
                isVerified: users.isVerified,
            })
                .from(users)
                .where(or(sql `${users.firstName} ILIKE ${`%${q}%`}`, sql `${users.lastName} ILIKE ${`%${q}%`}`, sql `${users.username} ILIKE ${`%${q}%`}`))
                .limit(20);
            // Check friendship status for each result
            const resultsWithFriendship = await Promise.all(searchResults.map(async (user) => {
                const friendship = await db.select().from(userFriends).where(or(and(eq(userFriends.userId, userId), eq(userFriends.friendId, user.id)), and(eq(userFriends.userId, user.id), eq(userFriends.friendId, userId)))).limit(1);
                return {
                    ...user,
                    isFriend: friendship.length > 0,
                    friendStatus: friendship[0]?.status || null
                };
            }));
            res.json({
                success: true,
                users: resultsWithFriendship
            });
        }
        catch (error) {
            console.error('User search error:', error);
            res.status(500).json({ error: "Failed to search users" });
        }
    });
    // ===== USER STATS =====
    // GET /api/social/stats - Enhanced user stats
    app.get('/api/social/stats', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
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
                .where(and(eq(userFriends.userId, userId), eq(userFriends.status, 'accepted')));
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
        }
        catch (error) {
            console.error('User stats error:', error);
            res.status(500).json({ error: "Failed to fetch user stats" });
        }
    });
    // POST /api/social/follow - Follow a user
    app.post('/api/social/follow', jwtAuth, async (req, res) => {
        try {
            const followerId = req.user?.id;
            const { userId: followingId } = req.body; // Frontend sends userId, map to followingId
            if (!followerId || !followingId) {
                return res.status(400).json({
                    error: "User ID and follow ID are required",
                    code: "MISSING_PARAMETERS"
                });
            }
            if (followerId === followingId) {
                return res.status(400).json({
                    error: "Cannot follow yourself",
                    code: "SELF_FOLLOW"
                });
            }
            // Check if already following
            const existingFollow = await db.select().from(userFollows).where(and(eq(userFollows.userId, followerId), eq(userFollows.followId, followingId))).limit(1);
            if (existingFollow.length > 0) {
                return res.status(400).json({
                    error: "Already following this user",
                    code: "ALREADY_FOLLOWING"
                });
            }
            // Insert follow relationship
            await db.insert(userFollows).values({
                userId: followerId,
                followId: followingId
            });
            // Note: Follower counts will be updated via database triggers or computed fields
            // For now, we'll rely on the user_follows table for accurate counts
            res.json({
                success: true,
                message: "User followed successfully",
                data: {
                    followerId,
                    followingId,
                    followedAt: new Date()
                }
            });
        }
        catch (error) {
            console.error('Follow user error:', error);
            res.status(500).json({ error: "Failed to follow user" });
        }
    });
    // DELETE /api/social/unfollow - Unfollow a user
    app.delete('/api/social/unfollow', jwtAuth, async (req, res) => {
        try {
            const followerId = req.user?.id;
            const { userId: followingId } = req.body; // Frontend sends userId, map to followingId
            if (!followerId || !followingId) {
                return res.status(400).json({
                    error: "User ID and follow ID are required",
                    code: "MISSING_PARAMETERS"
                });
            }
            // Delete follow relationship
            const result = await db.delete(userFollows).where(and(eq(userFollows.userId, followerId), eq(userFollows.followId, followingId)));
            if (result.rowCount === 0) {
                return res.status(400).json({
                    error: "Not following this user",
                    code: "NOT_FOLLOWING"
                });
            }
            // Note: Follower counts will be updated via database triggers or computed fields
            // For now, we'll rely on the user_follows table for accurate counts
            res.json({
                success: true,
                message: "User unfollowed successfully",
                data: {
                    followerId,
                    followingId,
                    unfollowedAt: new Date()
                }
            });
        }
        catch (error) {
            logger.error('Unfollow user error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                followerId: req.user?.id,
                followingId: req.body.userId
            });
            res.status(500).json({ error: "Failed to unfollow user" });
        }
    });
    // GET /api/social/followers/:userId - Get user's followers
    app.get('/api/social/followers/:userId', jwtAuth, async (req, res) => {
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
        }
        catch (error) {
            console.error('Get followers error:', error);
            res.status(500).json({ error: "Failed to fetch followers" });
        }
    });
    // GET /api/social/following/:userId - Get users that this user is following
    app.get('/api/social/following/:userId', jwtAuth, async (req, res) => {
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
        }
        catch (error) {
            console.error('Get following error:', error);
            res.status(500).json({ error: "Failed to fetch following" });
        }
    });
}
