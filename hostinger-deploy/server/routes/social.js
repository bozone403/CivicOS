import { db } from "../db.js";
import { users, socialPosts, socialComments, socialLikes, userFriends, userMessages, notifications } from "../../shared/schema.js";
import { eq, and, or, desc, asc, ne } from "drizzle-orm";
import { sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { count } from "drizzle-orm";
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
    // GET /api/social/feed - Get social feed
    app.get('/api/social/feed', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { limit = 20, offset = 0 } = req.query;
            // Get posts from friends and public posts
            const feedPosts = await db
                .select({
                id: socialPosts.id,
                content: socialPosts.content,
                imageUrl: socialPosts.imageUrl,
                type: socialPosts.type,
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
            // Check if current user has liked each post
            const postsWithUserInteraction = await Promise.all(feedPosts.map(async (post) => {
                const userLike = await db
                    .select()
                    .from(socialLikes)
                    .where(and(eq(socialLikes.postId, post.id), eq(socialLikes.userId, currentUserId)))
                    .limit(1);
                return {
                    ...post,
                    isLiked: userLike.length > 0,
                    user: post.user
                };
            }));
            res.json({
                success: true,
                feed: postsWithUserInteraction
            });
        }
        catch (error) {
            console.error('Error fetching social feed:', error);
            res.status(500).json({ error: "Failed to fetch social feed" });
        }
    });
    // GET /api/social/posts/user/:username - Get posts by username
    app.get('/api/social/posts/user/:username', async (req, res) => {
        try {
            const { username } = req.params;
            const { limit = 20, offset = 0 } = req.query;
            // Get user by username
            const [user] = await db
                .select({ id: users.id })
                .from(users)
                .where(eq(users.username, username));
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            // Get posts by user
            const userPosts = await db
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
                    username: users.username,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    profileImageUrl: users.profileImageUrl,
                    civicLevel: users.civicLevel,
                    isVerified: users.isVerified,
                }
            })
                .from(socialPosts)
                .leftJoin(users, eq(socialPosts.userId, users.id))
                .where(eq(socialPosts.userId, user.id))
                .orderBy(desc(socialPosts.createdAt))
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            // Get like counts for each post
            const postsWithStats = await Promise.all(userPosts.map(async (post) => {
                const [likesCount] = await db
                    .select({ count: count() })
                    .from(socialLikes)
                    .where(eq(socialLikes.postId, post.id));
                const [commentsCount] = await db
                    .select({ count: count() })
                    .from(socialComments)
                    .where(eq(socialComments.postId, post.id));
                return {
                    ...post,
                    likesCount: likesCount?.count || 0,
                    commentsCount: commentsCount?.count || 0,
                    isLiked: false // Will be set by frontend if user is logged in
                };
            }));
            res.json({
                success: true,
                posts: postsWithStats
            });
        }
        catch (error) {
            console.error('Error fetching user posts:', error);
            res.status(500).json({ error: "Failed to fetch user posts" });
        }
    });
    // GET /api/social/posts - Get posts
    app.get('/api/social/posts', jwtAuth, async (req, res) => {
        try {
            const { limit = 20, offset = 0, userId } = req.query;
            let whereCondition;
            if (userId) {
                whereCondition = and(eq(socialPosts.userId, userId), eq(socialPosts.visibility, 'public'));
            }
            else {
                whereCondition = eq(socialPosts.visibility, 'public');
            }
            const posts = await db
                .select({
                id: socialPosts.id,
                content: socialPosts.content,
                imageUrl: socialPosts.imageUrl,
                type: socialPosts.type,
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
                .where(whereCondition)
                .orderBy(desc(socialPosts.createdAt))
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            res.json({
                success: true,
                posts
            });
        }
        catch (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ error: "Failed to fetch posts" });
        }
    });
    // GET /api/social/wall/:userId - Get user's wall posts
    app.get('/api/social/wall/:userId', jwtAuth, async (req, res) => {
        try {
            const { userId } = req.params;
            const { limit = 20, offset = 0 } = req.query;
            const posts = await db
                .select({
                id: socialPosts.id,
                content: socialPosts.content,
                imageUrl: socialPosts.imageUrl,
                type: socialPosts.type,
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
                .where(and(eq(socialPosts.userId, userId), eq(socialPosts.visibility, 'public')))
                .orderBy(desc(socialPosts.createdAt))
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            res.json({
                success: true,
                posts
            });
        }
        catch (error) {
            console.error('Error fetching user wall posts:', error);
            res.status(500).json({ error: "Failed to fetch user wall posts" });
        }
    });
    // POST /api/social/posts - Create post
    app.post('/api/social/posts', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { content, imageUrl, type = 'post', visibility = 'public' } = req.body;
            if (!content) {
                return res.status(400).json({ error: "Content is required" });
            }
            const newPost = await db.insert(socialPosts).values({
                userId: currentUserId,
                content: content.trim(),
                imageUrl,
                type,
                visibility,
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();
            // Activity tracking can be added later
            res.json({
                success: true,
                post: newPost[0]
            });
        }
        catch (error) {
            console.error('Error creating post:', error);
            res.status(500).json({ error: "Failed to create post" });
        }
    });
    // PUT /api/social/posts/:id - Update post
    app.put('/api/social/posts/:id', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const postId = parseInt(req.params.id);
            const { content, imageUrl, visibility } = req.body;
            // Check if post exists and belongs to current user
            const [existingPost] = await db
                .select()
                .from(socialPosts)
                .where(and(eq(socialPosts.id, postId), eq(socialPosts.userId, currentUserId)));
            if (!existingPost) {
                return res.status(404).json({ error: "Post not found or you don't have permission to edit it" });
            }
            // Update post
            const [updatedPost] = await db
                .update(socialPosts)
                .set({
                content: content || existingPost.content,
                imageUrl: imageUrl || existingPost.imageUrl,
                visibility: visibility || existingPost.visibility,
                updatedAt: new Date()
            })
                .where(eq(socialPosts.id, postId))
                .returning();
            res.json({
                success: true,
                post: updatedPost
            });
        }
        catch (error) {
            console.error('Error updating post:', error);
            res.status(500).json({ error: "Failed to update post" });
        }
    });
    // DELETE /api/social/posts/:id - Delete post
    app.delete('/api/social/posts/:id', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const postId = parseInt(req.params.id);
            // Check if post exists and belongs to current user
            const [existingPost] = await db
                .select()
                .from(socialPosts)
                .where(and(eq(socialPosts.id, postId), eq(socialPosts.userId, currentUserId)));
            if (!existingPost) {
                return res.status(404).json({ error: "Post not found or you don't have permission to delete it" });
            }
            // Soft delete by updating content
            await db
                .update(socialPosts)
                .set({
                content: "[This post has been deleted]",
                updatedAt: new Date()
            })
                .where(eq(socialPosts.id, postId));
            res.json({
                success: true,
                message: "Post deleted successfully"
            });
        }
        catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json({ error: "Failed to delete post" });
        }
    });
    // POST /api/social/posts/:id/like - Like/unlike post
    app.post('/api/social/posts/:id/like', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const postId = parseInt(req.params.id);
            // Check if already liked
            const existingLike = await db
                .select()
                .from(socialLikes)
                .where(and(eq(socialLikes.postId, postId), eq(socialLikes.userId, currentUserId)))
                .limit(1);
            if (existingLike.length > 0) {
                // Unlike
                await db
                    .delete(socialLikes)
                    .where(and(eq(socialLikes.postId, postId), eq(socialLikes.userId, currentUserId)));
                res.json({
                    success: true,
                    liked: false
                });
            }
            else {
                // Like
                await db.insert(socialLikes).values({
                    userId: currentUserId,
                    postId,
                    createdAt: new Date()
                });
                res.json({
                    success: true,
                    liked: true
                });
            }
        }
        catch (error) {
            console.error('Error liking post:', error);
            res.status(500).json({ error: "Failed to like post" });
        }
    });
    // GET /api/social/friends - Get friends
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
                .where(and(eq(userFriends.userId, currentUserId), eq(userFriends.status, status)));
            res.json({
                success: true,
                friends
            });
        }
        catch (error) {
            console.error('Error fetching friends:', error);
            res.status(500).json({ error: "Failed to fetch friends" });
        }
    });
    // POST /api/social/friends - Friend actions
    app.post('/api/social/friends', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { friendId, action } = req.body;
            if (!friendId || !action) {
                return res.status(400).json({ error: "Friend ID and action are required" });
            }
            switch (action) {
                case 'send_request':
                    await db.insert(userFriends).values({
                        userId: currentUserId,
                        friendId,
                        status: 'pending',
                        createdAt: new Date()
                    });
                    break;
                case 'accept_request':
                    await db
                        .update(userFriends)
                        .set({ status: 'accepted', updatedAt: new Date() })
                        .where(and(eq(userFriends.userId, friendId), eq(userFriends.friendId, currentUserId), eq(userFriends.status, 'pending')));
                    break;
                case 'decline_request':
                    await db
                        .delete(userFriends)
                        .where(and(eq(userFriends.userId, friendId), eq(userFriends.friendId, currentUserId), eq(userFriends.status, 'pending')));
                    break;
                case 'remove_friend':
                    await db
                        .delete(userFriends)
                        .where(and(eq(userFriends.userId, currentUserId), eq(userFriends.friendId, friendId), eq(userFriends.status, 'accepted')));
                    break;
                default:
                    return res.status(400).json({ error: "Invalid action" });
            }
            res.json({
                success: true,
                message: `Friend ${action} completed`
            });
        }
        catch (error) {
            console.error('Error with friend action:', error);
            res.status(500).json({ error: "Failed to perform friend action" });
        }
    });
    // GET /api/social/users/search - Search users
    app.get('/api/social/users/search', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { q } = req.query;
            if (!q || q.length < 2) {
                return res.status(400).json({ error: "Search query must be at least 2 characters" });
            }
            const searchResults = await db
                .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                profileImageUrl: users.profileImageUrl,
                civicLevel: users.civicLevel,
                isVerified: users.isVerified,
            })
                .from(users)
                .where(and(ne(users.id, currentUserId), or(sql `${users.firstName} ILIKE ${`%${q}%`}`, sql `${users.lastName} ILIKE ${`%${q}%`}`, sql `CONCAT(${users.firstName}, ' ', ${users.lastName}) ILIKE ${`%${q}%`}`)))
                .limit(10);
            // Check friend status for each user
            const usersWithFriendStatus = await Promise.all(searchResults.map(async (user) => {
                const friendship = await db
                    .select()
                    .from(userFriends)
                    .where(and(eq(userFriends.userId, currentUserId), eq(userFriends.friendId, user.id)))
                    .limit(1);
                return {
                    ...user,
                    isFriend: friendship.length > 0 && friendship[0].status === 'accepted',
                    friendStatus: friendship.length > 0 ? friendship[0].status : null
                };
            }));
            res.json({
                success: true,
                users: usersWithFriendStatus
            });
        }
        catch (error) {
            console.error('Error searching users:', error);
            res.status(500).json({ error: "Failed to search users" });
        }
    });
    // GET /api/social/profile/:userId - Get user profile
    app.get('/api/social/profile/:userId', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { userId } = req.params;
            // Get user profile
            const user = await db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);
            if (!user.length) {
                return res.status(404).json({ error: "User not found" });
            }
            // Get user stats
            const postsCount = await db
                .select({ count: sql `count(*)` })
                .from(socialPosts)
                .where(eq(socialPosts.userId, userId));
            const friendsCount = await db
                .select({ count: sql `count(*)` })
                .from(userFriends)
                .where(and(eq(userFriends.userId, userId), eq(userFriends.status, 'accepted')));
            // Check friendship status
            const friendship = await db
                .select()
                .from(userFriends)
                .where(and(eq(userFriends.userId, currentUserId), eq(userFriends.friendId, userId)))
                .limit(1);
            res.json({
                success: true,
                profile: user[0],
                stats: {
                    postsCount: postsCount[0]?.count || 0,
                    friendsCount: friendsCount[0]?.count || 0
                },
                friendshipStatus: friendship.length > 0 ? friendship[0].status : null
            });
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({ error: "Failed to fetch user profile" });
        }
    });
    // PUT /api/social/profile - Update profile
    app.put('/api/social/profile', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { firstName, lastName, city, province, country } = req.body;
            const updateData = {};
            if (firstName)
                updateData.firstName = firstName;
            if (lastName)
                updateData.lastName = lastName;
            if (city !== undefined)
                updateData.city = city;
            if (province !== undefined)
                updateData.province = province;
            if (country !== undefined)
                updateData.country = country;
            await db
                .update(users)
                .set(updateData)
                .where(eq(users.id, currentUserId));
            res.json({
                success: true,
                message: "Profile updated successfully"
            });
        }
        catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ error: "Failed to update profile" });
        }
    });
    // GET /api/social/messages - Get messages
    app.get('/api/social/messages', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { otherUserId } = req.query;
            if (!otherUserId) {
                return res.status(400).json({ error: "Other user ID is required" });
            }
            const messages = await db
                .select()
                .from(userMessages)
                .where(or(and(eq(userMessages.senderId, currentUserId), eq(userMessages.recipientId, otherUserId)), and(eq(userMessages.senderId, otherUserId), eq(userMessages.recipientId, currentUserId))))
                .orderBy(asc(userMessages.createdAt));
            res.json({
                success: true,
                messages
            });
        }
        catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: "Failed to fetch messages" });
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
            const message = await db.insert(userMessages).values({
                senderId: currentUserId,
                recipientId,
                content: content.trim(),
                createdAt: new Date()
            }).returning();
            // Create notification
            await db.insert(notifications).values({
                userId: recipientId,
                type: 'message',
                title: 'New Message',
                message: `You have a new message from ${currentUserId}`,
                sourceModule: 'social',
                sourceId: currentUserId,
                isRead: false,
            });
            res.json({
                success: true,
                message: message[0]
            });
        }
        catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ error: "Failed to send message" });
        }
    });
    // GET /api/social/notifications - Get notifications
    app.get('/api/social/notifications', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { unreadOnly = false } = req.query;
            let whereCondition;
            if (unreadOnly === 'true') {
                whereCondition = and(eq(notifications.userId, currentUserId), eq(notifications.isRead, false));
            }
            else {
                whereCondition = eq(notifications.userId, currentUserId);
            }
            const userNotifications = await db
                .select()
                .from(notifications)
                .where(whereCondition)
                .orderBy(desc(notifications.createdAt))
                .limit(50);
            res.json({
                success: true,
                notifications: userNotifications
            });
        }
        catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ error: "Failed to fetch notifications" });
        }
    });
    // PUT /api/social/notifications/:id/read - Mark notification as read
    app.put('/api/social/notifications/:id/read', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const notificationId = parseInt(req.params.id);
            await db
                .update(notifications)
                .set({ isRead: true })
                .where(and(eq(notifications.id, notificationId), eq(notifications.userId, currentUserId)));
            res.json({
                success: true,
                message: "Notification marked as read"
            });
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({ error: "Failed to mark notification as read" });
        }
    });
    // PUT /api/social/notifications/read-all - Mark all notifications as read
    app.put('/api/social/notifications/read-all', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            await db
                .update(notifications)
                .set({ isRead: true })
                .where(and(eq(notifications.userId, currentUserId), eq(notifications.isRead, false)));
            res.json({
                success: true,
                message: "All notifications marked as read"
            });
        }
        catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({ error: "Failed to mark all notifications as read" });
        }
    });
}
