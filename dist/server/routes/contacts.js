import { db } from "../db.js";
import { politicians, userMessages } from "../../shared/schema.js";
import { eq, desc, count } from "drizzle-orm";
// JWT Auth middleware
function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token" });
    }
    try {
        const token = authHeader.split(" ")[1];
        const JWT_SECRET = process.env.SESSION_SECRET;
        if (!JWT_SECRET) {
            return res.status(500).json({ message: "Server configuration error" });
        }
        const decoded = require('jsonwebtoken').verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
export function registerContactsRoutes(app) {
    // Get all politicians (as government officials)
    app.get('/api/contacts/officials', async (req, res) => {
        try {
            const officials = await db.select().from(politicians).orderBy(desc(politicians.createdAt));
            res.json({
                officials,
                total: officials.length,
                message: "Government officials retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch government officials' });
        }
    });
    // Get officials by jurisdiction
    app.get('/api/contacts/officials/:jurisdiction', async (req, res) => {
        try {
            const { jurisdiction } = req.params;
            const officials = await db.select()
                .from(politicians)
                .where(eq(politicians.jurisdiction, jurisdiction))
                .orderBy(desc(politicians.createdAt));
            res.json({
                officials,
                total: officials.length,
                message: `Officials for ${jurisdiction} retrieved successfully`
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch officials for jurisdiction' });
        }
    });
    // Get contact messages for user
    app.get('/api/contacts/messages', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const messages = await db.select()
                .from(userMessages)
                .where(eq(userMessages.senderId, userId))
                .orderBy(desc(userMessages.createdAt));
            res.json({
                messages,
                total: messages.length,
                message: "Contact messages retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch contact messages' });
        }
    });
    // Submit contact message
    app.post('/api/contacts/message', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { recipientId, subject, message } = req.body;
            const newMessage = await db.insert(userMessages).values({
                senderId: userId,
                recipientId,
                subject,
                content: message,
                createdAt: new Date()
            }).returning();
            res.json({
                message: newMessage[0],
                success: "Contact message sent successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to send contact message' });
        }
    });
    // Get contact statistics
    app.get('/api/contacts/stats', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const [totalMessages, sentMessages, receivedMessages] = await Promise.all([
                db.select({ count: count() }).from(userMessages).where(eq(userMessages.senderId, userId)),
                db.select({ count: count() }).from(userMessages).where(eq(userMessages.senderId, userId)),
                db.select({ count: count() }).from(userMessages).where(eq(userMessages.recipientId, userId))
            ]);
            res.json({
                totalMessages: totalMessages[0]?.count || 0,
                sentMessages: sentMessages[0]?.count || 0,
                receivedMessages: receivedMessages[0]?.count || 0,
                message: "Contact statistics retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch contact statistics' });
        }
    });
}
