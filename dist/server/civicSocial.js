// PARANOID: All CivicSocial endpoints must use real, production data only. No demo/test logic allowed. All endpoints must remain JWT-protected via parent router. If you add new endpoints, ensure they are protected and use only real data.
import { Router } from "express";
import { db } from "./db.js";
import { socialPosts, socialComments, socialLikes, userFriends, notifications } from "../shared/schema.js";
import { eq, desc, and, isNull, or, inArray } from "drizzle-orm";
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
router.get("/feed", async (req, res) => {
    try {
        const userId = (req.user?.id || req.user?.sub || req.query.userId);
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const posts = await db
            .select()
            .from(socialPosts)
            .orderBy(desc(socialPosts.createdAt))
            .limit(50);
        // For each post, get reactions grouped by emoji
        const postIds = posts.map((p) => p.id);
        let reactions = [];
        if (postIds.length > 0) {
            reactions = await db
                .select({ postId: socialLikes.postId, reaction: socialLikes.reaction, userId: socialLikes.userId })
                .from(socialLikes)
                .where(inArray(socialLikes.postId, postIds));
        }
        // Group reactions by postId and emoji
        const reactionMap = {};
        for (const r of reactions) {
            if (!reactionMap[r.postId])
                reactionMap[r.postId] = {};
            if (!reactionMap[r.postId][r.reaction])
                reactionMap[r.postId][r.reaction] = [];
            reactionMap[r.postId][r.reaction].push(r.userId);
        }
        // Attach reactions to posts
        const postsWithReactions = posts.map((p) => ({
            ...p,
            reactions: reactionMap[p.id] || {},
        }));
        res.json({ feed: postsWithReactions });
    }
    catch (err) {
        console.error("Feed error:", err);
        res.status(500).json({ error: "Failed to fetch feed", details: err });
    }
});
// POST /api/social/posts - Create a new post/share
router.post("/posts", async (req, res) => {
    try {
        // Debug: log auth header and body
        console.log("[POST /api/social/posts] Authorization:", req.headers.authorization);
        console.log("[POST /api/social/posts] req.user:", req.user);
        console.log("[POST /api/social/posts] req.body:", req.body);
        // Try id, then sub (JWT), then query param
        const userId = (req.user?.id || req.user?.sub || req.body.userId);
        if (!userId) {
            console.error("[POST /api/social/posts] Not authenticated. req.user:", req.user);
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
            content,
            imageUrl,
            type: type || "post",
            originalItemId,
            originalItemType,
            comment,
        })
            .returning();
        res.status(201).json({ post: inserted });
    }
    catch (err) {
        console.error("Create post error:", err);
        res.status(500).json({ error: "Failed to create post", details: err });
    }
});
// POST /api/social/posts/:id/comment - Add a comment
router.post("/posts/:id/comment", async (req, res) => {
    try {
        const userId = (req.user?.id || req.user?.sub || req.body.userId);
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId))
            return res.status(400).json({ error: "Invalid post ID." });
        const { content, parentCommentId } = req.body;
        if (!content)
            return res.status(400).json({ error: "Content is required for a comment." });
        const [inserted] = await db
            .insert(socialComments)
            .values({
            postId,
            userId,
            content,
            parentCommentId,
        })
            .returning();
        res.status(201).json({ comment: inserted });
    }
    catch (err) {
        console.error("Create comment error:", err);
        res.status(500).json({ error: "Failed to add comment", details: err });
    }
});
// POST /api/social/posts/:id/like - Like/unlike a post
router.post("/posts/:id/like", async (req, res) => {
    try {
        const userId = (req.user?.id || req.user?.sub || req.body.userId);
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId))
            return res.status(400).json({ error: "Invalid post ID." });
        const reaction = req.body.reaction || "👍";
        // Check if a reaction exists for this user/post
        const existing = await db
            .select()
            .from(socialLikes)
            .where(and(eq(socialLikes.userId, userId), eq(socialLikes.postId, postId), isNull(socialLikes.commentId)));
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
        console.error("Reaction error:", err);
        res.status(500).json({ error: "Failed to react to post", details: err });
    }
});
// DELETE /api/social/posts/:id - Delete a post (owner only)
router.delete("/posts/:id", async (req, res) => {
    try {
        const userId = (req.user?.id || req.user?.sub);
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
        console.error("Delete post error:", err);
        res.status(500).json({ error: "Failed to delete post", details: err });
    }
});
// POST /api/social/friends - Send, accept, or remove a friend request
router.post("/friends", async (req, res) => {
    try {
        const userId = (req.user?.id || req.user?.sub || req.body.userId);
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const { friendId, action } = req.body;
        if (!friendId)
            return res.status(400).json({ error: "friendId is required." });
        if (friendId === userId)
            return res.status(400).json({ error: "Cannot friend yourself." });
        if (action === "send") {
            // Send friend request (pending)
            const [request] = await db
                .insert(userFriends)
                .values({ userId, friendId, status: "pending" })
                .onConflictDoNothing()
                .returning();
            return res.status(201).json({ request });
        }
        else if (action === "accept") {
            // Accept friend request
            const updated = await db
                .update(userFriends)
                .set({ status: "accepted" })
                .where(and(eq(userFriends.userId, friendId), eq(userFriends.friendId, userId), eq(userFriends.status, "pending")))
                .returning();
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
        console.error("Friend request error:", err);
        res.status(500).json({ error: "Failed to process friend request", details: err });
    }
});
// GET /api/social/friends - List friends and pending requests
router.get("/friends", async (req, res) => {
    try {
        const userId = (req.user?.id || req.user?.sub || req.query.userId);
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        // Accepted friends (either direction)
        const friends = await db
            .select()
            .from(userFriends)
            .where(and(or(eq(userFriends.userId, userId), eq(userFriends.friendId, userId)), eq(userFriends.status, "accepted")));
        // Pending requests sent by user
        const sent = await db
            .select()
            .from(userFriends)
            .where(and(eq(userFriends.userId, userId), eq(userFriends.status, "pending")));
        // Pending requests received by user
        const received = await db
            .select()
            .from(userFriends)
            .where(and(eq(userFriends.friendId, userId), eq(userFriends.status, "pending")));
        res.json({ friends, sent, received });
    }
    catch (err) {
        console.error("Friends error:", err);
        res.status(500).json({ error: "Failed to fetch friends", details: err });
    }
});
export default router;
