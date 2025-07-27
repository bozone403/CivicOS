// PARANOID: All CivicSocial endpoints must use real, production data only. No demo/test logic allowed. All endpoints must remain JWT-protected via parent router. If you add new endpoints, ensure they are protected and use only real data.
import { Router } from "express";
import { db } from "./db.js";
import { socialPosts, socialComments, socialLikes, userFriends, users, notifications, userMessages } from "../shared/schema.js";
import { eq, desc, and, isNull, or, inArray } from "drizzle-orm";
import pino from "pino";
import jwt from "jsonwebtoken";
const logger = pino();
// JWT Authentication middleware
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
// Online status tracking
const onlineUsers = new Set();
// Check if user is online
async function checkUserOnlineStatus(userId) {
    return onlineUsers.has(userId);
}
// Update user online status
export function updateUserOnlineStatus(userId, isOnline) {
    if (isOnline) {
        onlineUsers.add(userId);
    }
    else {
        onlineUsers.delete(userId);
    }
}
const router = Router();
// Helper: check and notify if a post is trending
async function checkAndNotifyTrending(postId) {
    // Count reactions
    const reactions = await db.select().from(socialLikes).where(eq(socialLikes.postId, postId));
    const reactionCount = reactions.length;
    // Count comments
    const comments = await db.select().from(socialComments).where(eq(socialComments.postId, postId));
    const commentCount = comments.length;
    if (reactionCount >= 10 || commentCount >= 5) {
        // Get post and author
        const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId));
        if (!post)
            return;
        // Check if already notified
        const existing = await db.select().from(notifications).where(and(eq(notifications.userId, post.userId), eq(notifications.type, "social"), eq(notifications.sourceId, String(postId)), eq(notifications.title, "Your post is trending!")));
        if (existing.length === 0) {
            await db.insert(notifications).values({
                userId: post.userId,
                type: "social",
                title: "Your post is trending!",
                message: "Your post is getting lots of engagement. Check it out!",
                sourceModule: "CivicSocial",
                sourceId: String(postId),
                priority: "high",
            });
        }
    }
}
// GET /api/social/feed - Get the user's CivicSocial feed
router.get("/feed", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        // Get posts with user information
        const posts = await db
            .select({
            id: socialPosts.id,
            userId: socialPosts.userId,
            content: socialPosts.content,
            imageUrl: socialPosts.imageUrl,
            type: socialPosts.type,
            originalItemId: socialPosts.originalItemId,
            originalItemType: socialPosts.originalItemType,
            comment: socialPosts.comment,
            createdAt: socialPosts.createdAt,
            updatedAt: socialPosts.updatedAt,
            // User info
            displayName: users.firstName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
        })
            .from(socialPosts)
            .leftJoin(users, eq(socialPosts.userId, users.id))
            .orderBy(desc(socialPosts.createdAt))
            .limit(50);
        // Get post IDs for batch queries
        const postIds = posts.map((p) => p.id);
        // Get reactions for all posts
        let reactions = [];
        if (postIds.length > 0) {
            reactions = await db
                .select({
                id: socialLikes.id,
                userId: socialLikes.userId,
                postId: socialLikes.postId,
                reaction: socialLikes.reaction,
                createdAt: socialLikes.createdAt,
            })
                .from(socialLikes)
                .where(inArray(socialLikes.postId, postIds));
        }
        // Get comments for all posts
        let comments = [];
        if (postIds.length > 0) {
            comments = await db
                .select({
                id: socialComments.id,
                userId: socialComments.userId,
                postId: socialComments.postId,
                content: socialComments.content,
                createdAt: socialComments.createdAt,
                // User info for comments
                displayName: users.firstName,
                email: users.email,
                profileImageUrl: users.profileImageUrl,
            })
                .from(socialComments)
                .leftJoin(users, eq(socialComments.userId, users.id))
                .where(inArray(socialComments.postId, postIds))
                .orderBy(desc(socialComments.createdAt));
        }
        // Group reactions and comments by post
        const reactionsByPost = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.postId])
                acc[reaction.postId] = [];
            acc[reaction.postId].push(reaction);
            return acc;
        }, {});
        const commentsByPost = comments.reduce((acc, comment) => {
            if (!acc[comment.postId])
                acc[comment.postId] = [];
            acc[comment.postId].push(comment);
            return acc;
        }, {});
        // Add reactions and comments to posts
        const postsWithEngagement = posts.map((post) => ({
            ...post,
            reactions: reactionsByPost[post.id] || [],
            comments: commentsByPost[post.id] || [],
            commentsCount: (commentsByPost[post.id] || []).length,
            likesCount: (reactionsByPost[post.id] || []).length,
        }));
        res.json({ feed: postsWithEngagement });
    }
    catch (err) {
        logger.error("Get feed error:", err);
        res.status(500).json({ error: "Failed to get feed" });
    }
});
// GET /api/social/posts/:id - Get a specific post with reactions and comments
router.get("/posts/:id", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId))
            return res.status(400).json({ error: "Invalid post ID." });
        const [post] = await db
            .select({
            id: socialPosts.id,
            userId: socialPosts.userId,
            content: socialPosts.content,
            imageUrl: socialPosts.imageUrl,
            type: socialPosts.type,
            originalItemId: socialPosts.originalItemId,
            originalItemType: socialPosts.originalItemType,
            comment: socialPosts.comment,
            createdAt: socialPosts.createdAt,
            updatedAt: socialPosts.updatedAt,
            // User info
            displayName: users.firstName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
        })
            .from(socialPosts)
            .leftJoin(users, eq(socialPosts.userId, users.id))
            .where(eq(socialPosts.id, postId));
        if (!post)
            return res.status(404).json({ error: "Post not found." });
        // Get reactions for this post
        const reactions = await db
            .select({
            id: socialLikes.id,
            userId: socialLikes.userId,
            reaction: socialLikes.reaction,
            createdAt: socialLikes.createdAt,
        })
            .from(socialLikes)
            .where(eq(socialLikes.postId, postId));
        // Get comments for this post
        const comments = await db
            .select({
            id: socialComments.id,
            userId: socialComments.userId,
            content: socialComments.content,
            createdAt: socialComments.createdAt,
            // User info for comments
            displayName: users.firstName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
        })
            .from(socialComments)
            .leftJoin(users, eq(socialComments.userId, users.id))
            .where(eq(socialComments.postId, postId))
            .orderBy(desc(socialComments.createdAt));
        // Check if current user has reacted
        const userReaction = reactions.find(r => r.userId === userId);
        res.json({
            post: {
                ...post,
                reactions,
                comments,
                userReaction: userReaction?.reaction || null,
                reactionCount: reactions.length,
                commentCount: comments.length,
            }
        });
    }
    catch (err) {
        logger.error("Get post error:", err);
        res.status(500).json({ error: "Failed to get post" });
    }
});
// POST /api/social/posts - Create a new post/share
router.post("/posts", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId) {
            logger.error("[POST /api/social/posts] Not authenticated. req.user:", req.user);
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { content, imageUrl, type, originalItemId, originalItemType, comment } = req.body;
        if (!content && type !== "share") {
            return res.status(400).json({ error: "Content is required for a post." });
        }
        if (type === "share" && (!originalItemId || !originalItemType)) {
            return res.status(400).json({ error: "originalItemId and originalItemType are required for shares." });
        }
        const [inserted] = await db
            .insert(socialPosts)
            .values({
            userId,
            content: content || null,
            imageUrl: imageUrl || null,
            type: type || "post",
            originalItemId: originalItemId || null,
            originalItemType: originalItemType || null,
            comment: comment || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        // Check if post is trending
        await checkAndNotifyTrending(inserted.id);
        res.status(201).json(inserted);
    }
    catch (err) {
        logger.error("Create post error:", err);
        res.status(500).json({ error: "Failed to create post" });
    }
});
// POST /api/social/posts/:id/comment - Add a comment to a post
router.post("/posts/:id/comment", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId))
            return res.status(400).json({ error: "Invalid post ID." });
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Comment content is required." });
        }
        // Verify post exists
        const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId));
        if (!post)
            return res.status(404).json({ error: "Post not found." });
        const [comment] = await db
            .insert(socialComments)
            .values({
            userId,
            postId,
            content: content.trim(),
            createdAt: new Date(),
        })
            .returning();
        // Check if post is trending after new comment
        await checkAndNotifyTrending(postId);
        res.status(201).json(comment);
    }
    catch (err) {
        logger.error("Add comment error:", err);
        res.status(500).json({ error: "Failed to add comment" });
    }
});
// POST /api/social/posts/:id/like - React to a post
router.post("/posts/:id/like", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId))
            return res.status(400).json({ error: "Invalid post ID." });
        const { reaction } = req.body;
        if (!reaction)
            return res.status(400).json({ error: "Reaction is required." });
        // Verify post exists
        const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId));
        if (!post)
            return res.status(404).json({ error: "Post not found." });
        // Check for existing reaction
        const existing = await db.select().from(socialLikes).where(and(eq(socialLikes.userId, userId), eq(socialLikes.postId, postId), isNull(socialLikes.commentId)));
        if (existing.length > 0) {
            if (existing[0].reaction === reaction) {
                // Remove reaction (toggle off)
                await db.delete(socialLikes).where(eq(socialLikes.id, existing[0].id));
                return res.json({ reacted: false });
            }
            else {
                // Change reaction
                const [updated] = await db
                    .update(socialLikes)
                    .set({ reaction })
                    .where(eq(socialLikes.id, existing[0].id))
                    .returning();
                return res.json({ reacted: true, reaction: updated.reaction });
            }
        }
        else {
            // Add new reaction
            const [inserted] = await db
                .insert(socialLikes)
                .values({ userId, postId, reaction })
                .returning();
            return res.json({ reacted: true, reaction: inserted.reaction });
        }
    }
    catch (err) {
        logger.error("Reaction error:", err);
        res.status(500).json({ error: "Failed to react to post" });
    }
});
// DELETE /api/social/posts/:id - Delete a post (owner only)
router.delete("/posts/:id", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId))
            return res.status(400).json({ error: "Invalid post ID." });
        const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId));
        if (!post)
            return res.status(404).json({ error: "Post not found." });
        if (post.userId !== userId)
            return res.status(403).json({ error: "You can only delete your own posts." });
        await db.delete(socialPosts).where(eq(socialPosts.id, postId));
        res.json({ success: true });
    }
    catch (err) {
        logger.error("Delete post error:", err);
        res.status(500).json({ error: "Failed to delete post" });
    }
});
// GET /api/social/conversations - Get user's conversations
router.get("/conversations", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        // Get conversations where user is a participant
        const conversations = await db
            .select({
            id: userFriends.id,
            userId: userFriends.userId,
            friendId: userFriends.friendId,
            status: userFriends.status,
            createdAt: userFriends.createdAt,
            // Friend info
            displayName: users.firstName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
        })
            .from(userFriends)
            .leftJoin(users, eq(userFriends.friendId, users.id))
            .where(and(eq(userFriends.userId, userId), eq(userFriends.status, "accepted")));
        // Get conversations where user is the friend
        const reverseConversations = await db
            .select({
            id: userFriends.id,
            userId: userFriends.friendId,
            friendId: userFriends.userId,
            status: userFriends.status,
            createdAt: userFriends.createdAt,
            // Friend info
            displayName: users.firstName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
        })
            .from(userFriends)
            .leftJoin(users, eq(userFriends.userId, users.id))
            .where(and(eq(userFriends.friendId, userId), eq(userFriends.status, "accepted")));
        // Get last messages for each conversation
        const allConversations = [...conversations, ...reverseConversations].map(async (conv) => {
            const conversationId = conv.friendId;
            const [lastMessage] = await db
                .select({
                id: userMessages.id,
                content: userMessages.content,
                senderId: userMessages.senderId,
                receiverId: userMessages.recipientId,
                timestamp: userMessages.createdAt,
                isRead: userMessages.isRead,
            })
                .from(userMessages)
                .where(or(and(eq(userMessages.senderId, userId), eq(userMessages.recipientId, conversationId)), and(eq(userMessages.senderId, conversationId), eq(userMessages.recipientId, userId))))
                .orderBy(desc(userMessages.createdAt))
                .limit(1);
            return {
                ...conv,
                lastMessage,
                unreadCount: 0, // TODO: Calculate unread count
            };
        });
        const resolvedConversations = await Promise.all(allConversations);
        res.json(resolvedConversations);
    }
    catch (err) {
        logger.error("Get conversations error:", err);
        res.status(500).json({ error: "Failed to get conversations" });
    }
});
// GET /api/social/messages/:conversationId - Get messages for a conversation
router.get("/messages/:conversationId", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const conversationId = req.params.conversationId;
        if (!conversationId)
            return res.status(400).json({ error: "Conversation ID is required." });
        // Verify friendship exists
        const friendship = await db.select().from(userFriends).where(and(or(and(eq(userFriends.userId, userId), eq(userFriends.friendId, conversationId)), and(eq(userFriends.userId, conversationId), eq(userFriends.friendId, userId))), eq(userFriends.status, "accepted")));
        if (friendship.length === 0) {
            return res.status(403).json({ error: "You can only message your friends." });
        }
        const messages = await db
            .select({
            id: userMessages.id,
            content: userMessages.content,
            senderId: userMessages.senderId,
            receiverId: userMessages.recipientId,
            timestamp: userMessages.createdAt,
            isRead: userMessages.isRead,
        })
            .from(userMessages)
            .where(or(and(eq(userMessages.senderId, userId), eq(userMessages.recipientId, conversationId)), and(eq(userMessages.senderId, conversationId), eq(userMessages.recipientId, userId))))
            .orderBy(desc(userMessages.createdAt))
            .limit(50);
        res.json(messages.reverse()); // Return in chronological order
    }
    catch (err) {
        logger.error("Get messages error:", err);
        res.status(500).json({ error: "Failed to get messages" });
    }
});
// POST /api/social/messages/:conversationId - Send a message
router.post("/messages/:conversationId", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const conversationId = req.params.conversationId;
        if (!conversationId)
            return res.status(400).json({ error: "Conversation ID is required." });
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Message content is required." });
        }
        // Verify friendship exists
        const friendship = await db.select().from(userFriends).where(and(or(and(eq(userFriends.userId, userId), eq(userFriends.friendId, conversationId)), and(eq(userFriends.userId, conversationId), eq(userFriends.friendId, userId))), eq(userFriends.status, "accepted")));
        if (friendship.length === 0) {
            return res.status(403).json({ error: "You can only message your friends." });
        }
        const [message] = await db
            .insert(userMessages)
            .values({
            senderId: userId,
            recipientId: conversationId,
            content: content.trim(),
            createdAt: new Date(),
            isRead: false,
        })
            .returning();
        res.status(201).json(message);
    }
    catch (err) {
        logger.error("Send message error:", err);
        res.status(500).json({ error: "Failed to send message" });
    }
});
// GET /api/social/notifications - Get user's notifications
router.get("/notifications", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const userNotifications = await db
            .select({
            id: notifications.id,
            userId: notifications.userId,
            type: notifications.type,
            title: notifications.title,
            message: notifications.message,
            sourceModule: notifications.sourceModule,
            sourceId: notifications.sourceId,
            priority: notifications.priority,
            isRead: notifications.isRead,
            createdAt: notifications.createdAt,
        })
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(50);
        res.json(userNotifications);
    }
    catch (err) {
        logger.error("Get notifications error:", err);
        res.status(500).json({ error: "Failed to get notifications" });
    }
});
// POST /api/social/notifications/:id/read - Mark notification as read
router.post("/notifications/:id/read", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const notificationId = parseInt(req.params.id, 10);
        if (isNaN(notificationId))
            return res.status(400).json({ error: "Invalid notification ID." });
        await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
        res.json({ success: true });
    }
    catch (err) {
        logger.error("Mark notification read error:", err);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});
export default router;
