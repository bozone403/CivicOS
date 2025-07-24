import { db } from '../db.js';
import { userMessages, users, userFriends } from '../../shared/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
// JWT Auth middleware - inline definition since the import doesn't exist
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
export function registerMessageRoutes(app) {
    // Get unread message count for current user
    app.get('/api/messages/unread/count', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await db.execute(sql `
        SELECT COUNT(*) as unread_count
        FROM user_messages 
        WHERE recipient_id = ${userId} AND is_read = false
      `);
            const unreadCount = parseInt(result.rows[0]?.unread_count) || 0;
            res.json({ unreadCount });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch unread count' });
        }
    });
    // Get user's conversations (list of people they've messaged or received messages from)
    app.get('/api/messages/conversations', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            // Get all conversations for the user
            const conversations = await db.execute(sql `
        SELECT DISTINCT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.avatar_url,
          u.civic_level,
          u.trust_score,
          (
            SELECT content 
            FROM user_messages 
            WHERE (sender_id = ${userId} AND recipient_id = u.id) 
               OR (sender_id = u.id AND recipient_id = ${userId})
            ORDER BY created_at DESC 
            LIMIT 1
          ) as last_message,
          (
            SELECT created_at 
            FROM user_messages 
            WHERE (sender_id = ${userId} AND recipient_id = u.id) 
               OR (sender_id = u.id AND recipient_id = ${userId})
            ORDER BY created_at DESC 
            LIMIT 1
          ) as last_message_time,
          (
            SELECT COUNT(*) 
            FROM user_messages 
            WHERE sender_id = u.id AND recipient_id = ${userId} AND is_read = false
          ) as unread_count
        FROM users u
        WHERE u.id IN (
          SELECT DISTINCT 
            CASE 
              WHEN sender_id = ${userId} THEN recipient_id
              ELSE sender_id
            END
          FROM user_messages 
          WHERE sender_id = ${userId} OR recipient_id = ${userId}
        )
        ORDER BY last_message_time DESC
      `);
            res.json(conversations.rows);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch conversations' });
        }
    });
    // Get messages between two users
    app.get('/api/messages/:recipientId', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const recipientId = req.params.recipientId;
            // Verify the recipient exists
            const recipient = await db.select().from(users).where(eq(users.id, recipientId));
            if (recipient.length === 0) {
                return res.status(404).json({ error: 'Recipient not found' });
            }
            // Get messages between the two users
            const messages = await db.select({
                id: userMessages.id,
                senderId: userMessages.senderId,
                recipientId: userMessages.recipientId,
                subject: userMessages.subject,
                content: userMessages.content,
                isRead: userMessages.isRead,
                createdAt: userMessages.createdAt
            }).from(userMessages)
                .where(and(sql `(sender_id = ${userId} AND recipient_id = ${recipientId}) OR (sender_id = ${recipientId} AND recipient_id = ${userId})`))
                .orderBy(desc(userMessages.createdAt));
            // Mark messages as read
            await db.update(userMessages)
                .set({ isRead: true })
                .where(and(eq(userMessages.recipientId, userId), eq(userMessages.senderId, recipientId), eq(userMessages.isRead, false)));
            res.json(messages);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    });
    // Send a message
    app.post('/api/messages', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const { recipientId, subject, content } = req.body;
            if (!recipientId || !content) {
                return res.status(400).json({ error: 'Recipient ID and content are required' });
            }
            // Verify the recipient exists
            const recipient = await db.select().from(users).where(eq(users.id, recipientId));
            if (recipient.length === 0) {
                return res.status(404).json({ error: 'Recipient not found' });
            }
            // Check if they are friends (optional - you can remove this check if you want to allow messaging anyone)
            const friendship = await db.select().from(userFriends)
                .where(and(sql `(user_id = ${userId} AND friend_id = ${recipientId}) OR (user_id = ${recipientId} AND friend_id = ${userId})`, eq(userFriends.status, 'accepted')));
            if (friendship.length === 0) {
                return res.status(403).json({ error: 'You can only message your friends' });
            }
            // Create the message
            const [message] = await db.insert(userMessages).values({
                senderId: userId,
                recipientId,
                subject: subject || null,
                content,
                isRead: false
            }).returning();
            res.json(message);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to send message' });
        }
    });
    // Mark message as read
    app.put('/api/messages/:messageId/read', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const messageId = parseInt(req.params.messageId);
            const [updatedMessage] = await db.update(userMessages)
                .set({ isRead: true })
                .where(and(eq(userMessages.id, messageId), eq(userMessages.recipientId, userId)))
                .returning();
            if (!updatedMessage) {
                return res.status(404).json({ error: 'Message not found' });
            }
            res.json(updatedMessage);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to mark message as read' });
        }
    });
    // Delete a message (only sender can delete)
    app.delete('/api/messages/:messageId', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const messageId = parseInt(req.params.messageId);
            const [deletedMessage] = await db.delete(userMessages)
                .where(and(eq(userMessages.id, messageId), eq(userMessages.senderId, userId)))
                .returning();
            if (!deletedMessage) {
                return res.status(404).json({ error: 'Message not found or you cannot delete it' });
            }
            res.json({ success: true, message: 'Message deleted successfully' });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to delete message' });
        }
    });
}
