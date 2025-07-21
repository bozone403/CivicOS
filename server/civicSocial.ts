import { Router, Request, Response } from "express";
import { db } from "./db.js";
import { socialPosts, socialComments, socialLikes, userFriends, users } from "../shared/schema.js";
import { eq, desc, and, isNull, or } from "drizzle-orm";

const router = Router();

// GET /api/social/feed - Get the user's CivicSocial feed
router.get("/feed", async (req: Request, res: Response) => {
  try {
    // Try id, then sub (JWT), then query param
    const userId = ((req.user as any)?.id || (req.user as any)?.sub || req.query.userId) as string | undefined;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    // Get posts from user and friends (basic version: just all posts, newest first)
    const posts = await db
      .select()
      .from(socialPosts)
      .orderBy(desc(socialPosts.createdAt))
      .limit(50);

    // TODO: Join with user info, likes, comments, etc.
    res.json({ feed: posts });
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ error: "Failed to fetch feed", details: err });
  }
});

// POST /api/social/posts - Create a new post/share
router.post("/posts", async (req: Request, res: Response) => {
  try {
    // Try id, then sub (JWT), then query param
    const userId = ((req.user as any)?.id || (req.user as any)?.sub || req.body.userId) as string | undefined;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

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
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Failed to create post", details: err });
  }
});

// POST /api/social/posts/:id/comment - Add a comment
router.post("/posts/:id/comment", async (req: Request, res: Response) => {
  try {
    const userId = ((req.user as any)?.id || (req.user as any)?.sub || req.body.userId) as string | undefined;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) return res.status(400).json({ error: "Invalid post ID." });

    const { content, parentCommentId } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required for a comment." });

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
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ error: "Failed to add comment", details: err });
  }
});

// POST /api/social/posts/:id/like - Like/unlike a post
router.post("/posts/:id/like", async (req: Request, res: Response) => {
  try {
    const userId = ((req.user as any)?.id || (req.user as any)?.sub || req.body.userId) as string | undefined;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) return res.status(400).json({ error: "Invalid post ID." });

    // Check if like exists
    const existing = await db
      .select()
      .from(socialLikes)
      .where(and(
        eq(socialLikes.userId, userId),
        eq(socialLikes.postId, postId),
        isNull(socialLikes.commentId)
      ));

    if (existing.length > 0) {
      // Unlike (remove like)
      await db.delete(socialLikes).where(eq(socialLikes.id, existing[0].id));
      return res.json({ liked: false });
    } else {
      // Like (add like)
      const [inserted] = await db
        .insert(socialLikes)
        .values({ userId, postId })
        .returning();
      return res.json({ liked: true, like: inserted });
    }
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: "Failed to like/unlike post", details: err });
  }
});

// POST /api/social/friends - Send, accept, or remove a friend request
router.post("/friends", async (req: Request, res: Response) => {
  try {
    const userId = ((req.user as any)?.id || (req.user as any)?.sub || req.body.userId) as string | undefined;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const { friendId, action } = req.body;
    if (!friendId) return res.status(400).json({ error: "friendId is required." });
    if (friendId === userId) return res.status(400).json({ error: "Cannot friend yourself." });

    if (action === "send") {
      // Send friend request (pending)
      const [request] = await db
        .insert(userFriends)
        .values({ userId, friendId, status: "pending" })
        .onConflictDoNothing()
        .returning();
      return res.status(201).json({ request });
    } else if (action === "accept") {
      // Accept friend request
      const updated = await db
        .update(userFriends)
        .set({ status: "accepted" })
        .where(and(eq(userFriends.userId, friendId), eq(userFriends.friendId, userId), eq(userFriends.status, "pending")))
        .returning();
      return res.json({ accepted: updated.length > 0 });
    } else if (action === "remove") {
      // Remove friend (either direction)
      await db.delete(userFriends).where(
        and(
          or(
            and(eq(userFriends.userId, userId), eq(userFriends.friendId, friendId)),
            and(eq(userFriends.userId, friendId), eq(userFriends.friendId, userId))
          )
        )
      );
      return res.json({ removed: true });
    } else {
      return res.status(400).json({ error: "Invalid action. Use send, accept, or remove." });
    }
  } catch (err) {
    console.error("Friend request error:", err);
    res.status(500).json({ error: "Failed to process friend request", details: err });
  }
});

// GET /api/social/friends - List friends and pending requests
router.get("/friends", async (req: Request, res: Response) => {
  try {
    const userId = ((req.user as any)?.id || (req.user as any)?.sub || req.query.userId) as string | undefined;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    // Accepted friends (either direction)
    const friends = await db
      .select()
      .from(userFriends)
      .where(and(
        or(
          eq(userFriends.userId, userId),
          eq(userFriends.friendId, userId)
        ),
        eq(userFriends.status, "accepted")
      ));

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
  } catch (err) {
    console.error("Friends error:", err);
    res.status(500).json({ error: "Failed to fetch friends", details: err });
  }
});

export default router; 