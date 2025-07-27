// PARANOID: All CivicSocial endpoints must use real, production data only. No demo/test logic allowed. All endpoints must remain JWT-protected via parent router. If you add new endpoints, ensure they are protected and use only real data.
import { Router } from "express";
import { db } from "./db.js";
import { socialPosts, socialComments, socialLikes, socialShares, socialBookmarks, userFriends, users, notifications, userMessages } from "../shared/schema.js";
import { eq, desc, and, isNull, or, inArray, count, sql } from "drizzle-orm";
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
// GET /api/social/posts - Get social posts (frontend compatibility)
router.get("/posts", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const { tab = 'all', type = 'all', visibility = 'all', sortBy = 'recent', limit = 20, offset = 0 } = req.query;
        let whereConditions = [];
        // Filter by tab
        switch (tab) {
            case 'friends':
                // Get friends' posts
                const friendsPosts = await db
                    .select({ postId: socialPosts.id })
                    .from(socialPosts)
                    .innerJoin(userFriends, eq(socialPosts.userId, userFriends.friendId))
                    .where(and(eq(userFriends.userId, userId), eq(userFriends.status, 'accepted')));
                const friendPostIds = friendsPosts.map(p => p.postId);
                if (friendPostIds.length > 0) {
                    whereConditions.push(inArray(socialPosts.id, friendPostIds));
                }
                else {
                    whereConditions.push(sql `1 = 0`); // No friends, no posts
                }
                break;
            case 'my-posts':
                whereConditions.push(eq(socialPosts.userId, userId));
                break;
            case 'trending':
                // Posts with high engagement - we'll filter this in the main query
                break;
            default: // 'all'
                // Show public posts and user's own posts
                whereConditions.push(sql `(${socialPosts.visibility} = 'public' OR ${socialPosts.userId} = ${userId})`);
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
                firstName: users.firstName,
                lastName: users.lastName,
                profileImageUrl: users.profileImageUrl,
                civicLevel: users.civicLevel,
                isVerified: users.isVerified,
            })
                .from(users)
                .where(eq(users.id, post.userId));
            // Get engagement stats
            const [likesCount] = await db
                .select({ count: count() })
                .from(socialLikes)
                .where(eq(socialLikes.postId, post.id));
            const [commentsCount] = await db
                .select({ count: count() })
                .from(socialComments)
                .where(eq(socialComments.postId, post.id));
            // Check if current user liked/bookmarked
            const [isLiked] = await db
                .select({ count: count() })
                .from(socialLikes)
                .where(and(eq(socialLikes.postId, post.id), eq(socialLikes.userId, userId)));
            // Get shares count
            const [sharesCount] = await db
                .select({ count: count() })
                .from(socialShares)
                .where(eq(socialShares.postId, post.id));
            // Check if current user bookmarked
            const [isBookmarked] = await db
                .select({ count: count() })
                .from(socialBookmarks)
                .where(and(eq(socialBookmarks.postId, post.id), eq(socialBookmarks.userId, userId)));
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
        res.json({
            posts: postsWithDetails,
            total: postsWithDetails.length,
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
        const { content, imageUrl, type, originalItemId, originalItemType, comment, visibility, tags, location, mood } = req.body;
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
            visibility: visibility || "public",
            tags: tags || [],
            location: location || null,
            mood: mood || null,
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
// POST /api/social/posts/:id/comments - Add comment to post (frontend compatibility)
router.post("/posts/:id/comments", jwtAuth, async (req, res) => {
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
        const { action, reaction } = req.body;
        // Handle both old format (action) and new format (reaction)
        const reactionType = reaction || (action === 'like' ? '👍' : action === 'unlike' ? null : '👍');
        // Verify post exists
        const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId));
        if (!post)
            return res.status(404).json({ error: "Post not found." });
        // Check for existing reaction
        const existing = await db.select().from(socialLikes).where(and(eq(socialLikes.userId, userId), eq(socialLikes.postId, postId), isNull(socialLikes.commentId)));
        if (existing.length > 0) {
            if (action === 'unlike' || !reactionType) {
                // Remove reaction (toggle off)
                await db.delete(socialLikes).where(eq(socialLikes.id, existing[0].id));
                return res.json({ reacted: false });
            }
            else if (existing[0].reaction === reactionType) {
                // Remove reaction (toggle off)
                await db.delete(socialLikes).where(eq(socialLikes.id, existing[0].id));
                return res.json({ reacted: false });
            }
            else {
                // Change reaction
                const [updated] = await db
                    .update(socialLikes)
                    .set({ reaction: reactionType })
                    .where(eq(socialLikes.id, existing[0].id))
                    .returning();
                return res.json({ reacted: true, reaction: updated.reaction });
            }
        }
        else {
            if (action === 'unlike' || !reactionType) {
                return res.json({ reacted: false });
            }
            // Add new reaction
            const [inserted] = await db
                .insert(socialLikes)
                .values({ userId, postId, reaction: reactionType })
                .returning();
            return res.json({ reacted: true, reaction: inserted.reaction });
        }
    }
    catch (err) {
        logger.error("Reaction error:", err);
        res.status(500).json({ error: "Failed to react to post" });
    }
});
// POST /api/social/posts/:id/share - Share a post (frontend compatibility)
router.post("/posts/:id/share", jwtAuth, async (req, res) => {
    try {
        const originalPostId = parseInt(req.params.id, 10);
        const currentUserId = req.user.id || req.user.sub;
        const { comment } = req.body;
        if (!currentUserId)
            return res.status(401).json({ error: "Not authenticated" });
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
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        // Record the share
        await db.insert(socialShares).values({
            userId: currentUserId,
            postId: originalPostId,
            sharedPostId: sharedPost.id,
            shareType: 'repost',
            createdAt: new Date(),
        });
        res.status(201).json(sharedPost);
    }
    catch (error) {
        console.error('Share post error:', error);
        res.status(500).json({ error: "Failed to share post" });
    }
});
// POST /api/social/posts/:id/bookmark - Bookmark/unbookmark a post
router.post("/posts/:id/bookmark", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId))
            return res.status(400).json({ error: "Invalid post ID." });
        const { action } = req.body; // 'bookmark' or 'unbookmark'
        // Verify post exists
        const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId));
        if (!post)
            return res.status(404).json({ error: "Post not found." });
        if (action === 'bookmark') {
            // Add bookmark
            await db.insert(socialBookmarks).values({
                userId,
                postId,
                createdAt: new Date(),
            }).onConflictDoNothing();
            return res.json({ bookmarked: true });
        }
        else if (action === 'unbookmark') {
            // Remove bookmark
            await db
                .delete(socialBookmarks)
                .where(and(eq(socialBookmarks.postId, postId), eq(socialBookmarks.userId, userId)));
            return res.json({ bookmarked: false });
        }
        else {
            return res.status(400).json({ error: "Invalid action. Use 'bookmark' or 'unbookmark'." });
        }
    }
    catch (err) {
        logger.error("Bookmark error:", err);
        res.status(500).json({ error: "Failed to bookmark/unbookmark post" });
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
// GET /api/social/friends - Get user's friends and friend requests
router.get("/friends", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        // Get accepted friends
        const friends = await db
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
            isOnline: sql `${users.id} = ANY(${Array.from(onlineUsers)})`,
        })
            .from(userFriends)
            .leftJoin(users, eq(userFriends.friendId, users.id))
            .where(and(eq(userFriends.userId, userId), eq(userFriends.status, "accepted")));
        // Get reverse friendships
        const reverseFriends = await db
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
            isOnline: sql `${users.id} = ANY(${Array.from(onlineUsers)})`,
        })
            .from(userFriends)
            .leftJoin(users, eq(userFriends.userId, users.id))
            .where(and(eq(userFriends.friendId, userId), eq(userFriends.status, "accepted")));
        // Get pending friend requests sent by user
        const pendingSent = await db
            .select({
            id: userFriends.id,
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
            .where(and(eq(userFriends.userId, userId), eq(userFriends.status, "pending")));
        // Get pending friend requests received by user
        const pendingReceived = await db
            .select({
            id: userFriends.id,
            userId: userFriends.userId,
            status: userFriends.status,
            createdAt: userFriends.createdAt,
            // Friend info
            displayName: users.firstName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
        })
            .from(userFriends)
            .leftJoin(users, eq(userFriends.userId, users.id))
            .where(and(eq(userFriends.friendId, userId), eq(userFriends.status, "pending")));
        res.json({
            friends: [...friends, ...reverseFriends],
            pendingSent,
            pendingReceived,
        });
    }
    catch (err) {
        logger.error("Get friends error:", err);
        res.status(500).json({ error: "Failed to get friends" });
    }
});
// POST /api/social/friends - Send, accept, or remove friend request
router.post("/friends", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const { friendId, action } = req.body;
        if (!friendId)
            return res.status(400).json({ error: "friendId is required." });
        if (friendId === userId)
            return res.status(400).json({ error: "Cannot friend yourself." });
        if (action === "send") {
            // Send friend request
            const [request] = await db
                .insert(userFriends)
                .values({ userId, friendId, status: "pending" })
                .onConflictDoNothing()
                .returning();
            // Send notification to recipient
            await db.insert(notifications).values({
                userId: friendId,
                type: "social",
                title: "New Friend Request",
                message: "You have a new friend request!",
                sourceModule: "CivicSocial",
                sourceId: String(request?.id || ""),
                priority: "medium",
            });
            return res.status(201).json({ request });
        }
        else if (action === "accept") {
            // Accept friend request
            const updated = await db
                .update(userFriends)
                .set({ status: "accepted" })
                .where(and(eq(userFriends.userId, friendId), eq(userFriends.friendId, userId), eq(userFriends.status, "pending")))
                .returning();
            if (updated.length > 0) {
                // Send notification to sender
                await db.insert(notifications).values({
                    userId: friendId,
                    type: "social",
                    title: "Friend Request Accepted",
                    message: "Your friend request was accepted!",
                    sourceModule: "CivicSocial",
                    sourceId: String(updated[0].id),
                    priority: "medium",
                });
            }
            return res.json({ accepted: updated.length > 0 });
        }
        else if (action === "remove") {
            // Remove friend (either direction)
            await db.delete(userFriends).where(and(or(and(eq(userFriends.userId, userId), eq(userFriends.friendId, friendId)), and(eq(userFriends.userId, friendId), eq(userFriends.friendId, userId)))));
            return res.json({ removed: true });
        }
        else {
            return res.status(400).json({ error: "Invalid action. Use send, accept, or remove." });
        }
    }
    catch (err) {
        logger.error("Friend request error:", err);
        res.status(500).json({ error: "Failed to process friend request" });
    }
});
// GET /api/social/users/search - Search for users
router.get("/users/search", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const { q, limit = 20 } = req.query;
        if (!q)
            return res.status(400).json({ error: "Search query is required." });
        const searchTerm = `%${q}%`;
        const searchResults = await db
            .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
            civicLevel: users.civicLevel,
            trustScore: users.trustScore,
            isVerified: users.isVerified,
            createdAt: users.createdAt,
        })
            .from(users)
            .where(and(or(sql `${users.firstName} ILIKE ${searchTerm}`, sql `${users.lastName} ILIKE ${searchTerm}`, sql `${users.email} ILIKE ${searchTerm}`), sql `${users.id} != ${userId}`))
            .limit(parseInt(limit));
        res.json({ users: searchResults });
    }
    catch (err) {
        logger.error("Search users error:", err);
        res.status(500).json({ error: "Failed to search users" });
    }
});
// GET /api/social/users/:id - Get user profile
router.get("/users/:id", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const profileId = req.params.id;
        if (!profileId)
            return res.status(400).json({ error: "User ID is required." });
        const [user] = await db
            .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
            civicLevel: users.civicLevel,
            trustScore: users.trustScore,
            isVerified: users.isVerified,
            createdAt: users.createdAt,
        })
            .from(users)
            .where(eq(users.id, profileId));
        if (!user)
            return res.status(404).json({ error: "User not found." });
        // Get user's posts count
        const postsCount = await db
            .select({ count: count() })
            .from(socialPosts)
            .where(eq(socialPosts.userId, profileId));
        // Get friend status
        const friendship = await db
            .select()
            .from(userFriends)
            .where(and(or(and(eq(userFriends.userId, userId), eq(userFriends.friendId, profileId)), and(eq(userFriends.userId, profileId), eq(userFriends.friendId, userId)))));
        res.json({
            ...user,
            postsCount: postsCount[0]?.count || 0,
            isOnline: onlineUsers.has(profileId),
            friendship: friendship[0] || null,
        });
    }
    catch (err) {
        logger.error("Get user profile error:", err);
        res.status(500).json({ error: "Failed to get user profile" });
    }
});
// GET /api/social/trending - Get trending posts
router.get("/trending", jwtAuth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.sub;
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        // Get posts with high engagement in the last 24 hours
        const trendingPosts = await db
            .select({
            id: socialPosts.id,
            userId: socialPosts.userId,
            content: socialPosts.content,
            imageUrl: socialPosts.imageUrl,
            type: socialPosts.type,
            createdAt: socialPosts.createdAt,
            // User info
            displayName: users.firstName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
            // Engagement counts
            reactionCount: sql `(
          SELECT COUNT(*) FROM social_likes 
          WHERE social_likes.post_id = social_posts.id
        )`,
            commentCount: sql `(
          SELECT COUNT(*) FROM social_comments 
          WHERE social_comments.post_id = social_posts.id
        )`,
        })
            .from(socialPosts)
            .leftJoin(users, eq(socialPosts.userId, users.id))
            .where(sql `social_posts.created_at > NOW() - INTERVAL '24 hours'`)
            .orderBy(desc(sql `(
        SELECT COUNT(*) FROM social_likes 
        WHERE social_likes.post_id = social_posts.id
      ) + (
        SELECT COUNT(*) FROM social_comments 
        WHERE social_comments.post_id = social_posts.id
      )`))
            .limit(10);
        res.json({ trending: trendingPosts });
    }
    catch (err) {
        logger.error("Get trending posts error:", err);
        res.status(500).json({ error: "Failed to get trending posts" });
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
