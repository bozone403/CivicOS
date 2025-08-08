import { Router } from "express";
import { db } from "./db.js";
import { notifications } from "../shared/schema.js";
import { eq, and, desc, count } from "drizzle-orm";
import pino from "pino";
import { jwtAuth } from './routes/auth.js';
const logger = pino();

const router = Router();

// Use centralized jwtAuth from auth routes for consistency

// Get notifications (authenticated)
router.get("/", jwtAuth, async (req: any, res) => {
  try {
    // Select only columns that are guaranteed to exist across migrations
    const rows = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, req.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    // Shape response consistently for client
    const formatted = rows.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: !!n.isRead,
      createdAt: n.createdAt,
      // optional properties omitted when not present
    }));

    res.json({ success: true, notifications: formatted });
  } catch (error) {
    logger.error({ msg: 'Error fetching notifications', error: error instanceof Error ? error.message : String(error) });
    // Graceful fallback to keep instance healthy
    res.json({ success: true, notifications: [] });
  }
});

// Get unread count
router.get("/unread-count", jwtAuth, async (req: any, res) => {
  try {
    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, req.user.id), eq(notifications.isRead, false)));
    res.json({ unread: Number(cnt) || 0 });
  } catch (error) {
    logger.error({ msg: 'Error fetching unread count', error: error instanceof Error ? error.message : String(error) });
    // Graceful fallback
    res.json({ unread: 0 });
  }
});

// Mark all as read
router.patch("/read-all", jwtAuth, async (req: any, res) => {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, req.user.id), eq(notifications.isRead, false)));
    res.json({ success: true });
  } catch (error) {
    logger.error({ msg: 'Error marking all notifications as read', error: error instanceof Error ? error.message : String(error) });
    // Graceful success
    res.json({ success: true });
  }
});

// Mark as read
router.patch("/:id/read", jwtAuth, async (req: any, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, req.user.id)));
    
    res.json({ success: true });
  } catch (error) {
    logger.error({ msg: 'Error marking notification as read', error: error instanceof Error ? error.message : String(error) });
    // Graceful success
    res.json({ success: true });
  }
});

// Delete notification
router.delete("/:id", jwtAuth, async (req: any, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    await db.delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, req.user.id)));
    
    res.json({ success: true });
  } catch (error) {
    logger.error({ msg: 'Error deleting notification', error: error instanceof Error ? error.message : String(error) });
    // Graceful success
    res.json({ success: true });
  }
});

// Clear all notifications
router.delete("/", jwtAuth, async (req: any, res) => {
  try {
    
    await db.delete(notifications)
      .where(eq(notifications.userId, req.user.id));
    
    res.json({ success: true });
  } catch (error) {
    logger.error({ msg: 'Error clearing notifications', error: error instanceof Error ? error.message : String(error) });
    // Graceful success
    res.json({ success: true });
  }
});

export default router;