import { Router } from "express";
import { db } from "./db.js";
import { notifications } from "../shared/schema.js";
import { eq, and, desc } from "drizzle-orm";
import pino from "pino";
const logger = pino();
const router = Router();
// Get notifications - no auth required for demo
router.get("/", async (req, res) => {
    try {
        const result = await db.select().from(notifications)
            .where(eq(notifications.userId, req.user.id))
            .orderBy(desc(notifications.createdAt));
        res.json(result);
    }
    catch (error) {
        logger.error({ msg: 'Error fetching notifications', error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
});
// Mark as read
router.patch("/:id/read", async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        await db.update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, notificationId), eq(notifications.userId, req.user.id)));
        res.json({ success: true });
    }
    catch (error) {
        logger.error({ msg: 'Error marking notification as read', error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ message: "Failed to mark notification as read" });
    }
});
// Delete notification
router.delete("/:id", async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        await db.delete(notifications)
            .where(and(eq(notifications.id, notificationId), eq(notifications.userId, req.user.id)));
        res.json({ success: true });
    }
    catch (error) {
        logger.error({ msg: 'Error deleting notification', error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ message: "Failed to delete notification" });
    }
});
// Clear all notifications
router.delete("/", async (req, res) => {
    try {
        await db.delete(notifications)
            .where(eq(notifications.userId, req.user.id));
        res.json({ success: true });
    }
    catch (error) {
        logger.error({ msg: 'Error clearing notifications', error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ message: "Failed to clear notifications" });
    }
});
export default router;
