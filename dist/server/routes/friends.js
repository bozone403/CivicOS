import { db } from "../db.js";
import { userFriends, users, notifications } from "../../shared/schema.js";
import { eq, and, or } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { ResponseFormatter } from "../utils/responseFormatter.js";
// JWT Auth middleware
function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return ResponseFormatter.unauthorized(res, "Missing or invalid token");
    }
    try {
        const token = authHeader.split(" ")[1];
        const secret = process.env.SESSION_SECRET;
        if (!secret) {
            return ResponseFormatter.unauthorized(res, "Server configuration error");
        }
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        return ResponseFormatter.unauthorized(res, "Invalid or expired token");
    }
}
export function registerFriendRoutes(app) {
    // GET /api/friends - Get user's friends list
    app.get('/api/friends', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user?.id;
            // Get accepted friendships
            const friendships = await db
                .select({
                id: userFriends.id,
                friendId: userFriends.friendId,
                status: userFriends.status,
                createdAt: userFriends.createdAt
            })
                .from(userFriends)
                .where(and(eq(userFriends.userId, currentUserId), eq(userFriends.status, 'accepted')));
            // Get friend details
            const friendIds = friendships.map(f => f.friendId);
            const friends = friendIds.length > 0 ? await db
                .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                profileImageUrl: users.profileImageUrl,
                city: users.city,
                province: users.province,
                civicLevel: users.civicLevel,
                civicPoints: users.civicPoints,
                trustScore: users.trustScore,
                lastActivityDate: users.lastActivityDate
            })
                .from(users)
                .where(eq(users.id, friendIds)) : [];
            const formattedFriends = friends.map(friend => ({
                id: friend.id,
                name: `${friend.firstName || ''} ${friend.lastName || ''}`.trim() || 'Anonymous User',
                avatar: friend.profileImageUrl,
                location: [friend.city, friend.province].filter(Boolean).join(', ') || 'Location not set',
                civicLevel: friend.civicLevel,
                civicPoints: friend.civicPoints,
                trustScore: friend.trustScore,
                lastActive: friend.lastActivityDate?.toISOString().split('T')[0] || 'Unknown'
            }));
            res.json({
                friends: formattedFriends,
                total: formattedFriends.length
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({
                error: 'Failed to fetch friends',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // GET /api/friends/requests - Get pending friend requests
    app.get('/api/friends/requests', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user?.id;
            // Get pending requests sent to current user
            const pendingRequests = await db
                .select({
                id: userFriends.id,
                userId: userFriends.userId,
                status: userFriends.status,
                createdAt: userFriends.createdAt
            })
                .from(userFriends)
                .where(and(eq(userFriends.friendId, currentUserId), eq(userFriends.status, 'pending')));
            // Get user details for requests
            const requesterIds = pendingRequests.map(r => r.userId);
            const requesters = requesterIds.length > 0 ? await db
                .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                profileImageUrl: users.profileImageUrl,
                city: users.city,
                province: users.province,
                civicLevel: users.civicLevel,
                civicPoints: users.civicPoints
            })
                .from(users)
                .where(eq(users.id, requesterIds)) : [];
            const formattedRequests = pendingRequests.map(request => {
                const requester = requesters.find(r => r.id === request.userId);
                return {
                    id: request.id,
                    requester: {
                        id: requester?.id || request.userId,
                        name: requester ? `${requester.firstName || ''} ${requester.lastName || ''}`.trim() || 'Anonymous User' : 'Unknown User',
                        avatar: requester?.profileImageUrl,
                        location: requester ? [requester.city, requester.province].filter(Boolean).join(', ') || 'Location not set' : 'Unknown',
                        civicLevel: requester?.civicLevel,
                        civicPoints: requester?.civicPoints
                    },
                    createdAt: request.createdAt?.toISOString().split('T')[0] || 'Unknown'
                };
            });
            res.json({
                requests: formattedRequests,
                total: formattedRequests.length
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({
                error: 'Failed to fetch friend requests',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // POST /api/friends/request - Send friend request
    app.post('/api/friends/request', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user?.id;
            const { friendId } = req.body;
            if (!friendId) {
                return res.status(400).json({ message: 'Friend ID is required' });
            }
            if (currentUserId === friendId) {
                return res.status(400).json({ message: 'Cannot send friend request to yourself' });
            }
            // Check if friendship already exists
            const existingFriendship = await db
                .select()
                .from(userFriends)
                .where(or(and(eq(userFriends.userId, currentUserId), eq(userFriends.friendId, friendId)), and(eq(userFriends.userId, friendId), eq(userFriends.friendId, currentUserId))));
            if (existingFriendship.length > 0) {
                const friendship = existingFriendship[0];
                if (friendship.status === 'accepted') {
                    return res.status(400).json({ message: 'Already friends' });
                }
                else if (friendship.status === 'pending') {
                    return res.status(400).json({ message: 'Friend request already sent' });
                }
            }
            // Create friend request
            const [newFriendship] = await db
                .insert(userFriends)
                .values({
                userId: currentUserId,
                friendId: friendId,
                status: 'pending'
            })
                .returning();
            // Send notification to friend
            await db.insert(notifications).values({
                userId: friendId,
                type: 'friend_request',
                title: 'New Friend Request',
                message: 'Someone wants to be your friend on CivicOS',
                sourceModule: 'CivicSocial',
                sourceId: String(newFriendship.id)
            });
            res.json({
                message: 'Friend request sent successfully',
                friendship: {
                    id: newFriendship.id,
                    status: newFriendship.status,
                    createdAt: newFriendship.createdAt
                }
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({
                error: 'Failed to send friend request',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // POST /api/friends/accept - Accept friend request
    app.post('/api/friends/accept', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user?.id;
            const { requestId } = req.body;
            if (!requestId) {
                return res.status(400).json({ message: 'Request ID is required' });
            }
            // Update friend request status
            const [updatedFriendship] = await db
                .update(userFriends)
                .set({ status: 'accepted' })
                .where(and(eq(userFriends.id, requestId), eq(userFriends.friendId, currentUserId), eq(userFriends.status, 'pending')))
                .returning();
            if (!updatedFriendship) {
                return res.status(404).json({ message: 'Friend request not found' });
            }
            // Create reciprocal friendship
            await db.insert(userFriends).values({
                userId: currentUserId,
                friendId: updatedFriendship.userId,
                status: 'accepted'
            });
            // Send notification to requester
            await db.insert(notifications).values({
                userId: updatedFriendship.userId,
                type: 'friend_accepted',
                title: 'Friend Request Accepted',
                message: 'Your friend request has been accepted!',
                sourceModule: 'CivicSocial',
                sourceId: String(updatedFriendship.id)
            });
            res.json({
                message: 'Friend request accepted successfully',
                friendship: {
                    id: updatedFriendship.id,
                    status: updatedFriendship.status,
                    updatedAt: updatedFriendship.updatedAt
                }
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({
                error: 'Failed to accept friend request',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // POST /api/friends/reject - Reject friend request
    app.post('/api/friends/reject', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user?.id;
            const { requestId } = req.body;
            if (!requestId) {
                return res.status(400).json({ message: 'Request ID is required' });
            }
            // Delete friend request
            const deletedFriendship = await db
                .delete(userFriends)
                .where(and(eq(userFriends.id, requestId), eq(userFriends.friendId, currentUserId), eq(userFriends.status, 'pending')))
                .returning();
            if (deletedFriendship.length === 0) {
                return res.status(404).json({ message: 'Friend request not found' });
            }
            res.json({
                message: 'Friend request rejected successfully'
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({
                error: 'Failed to reject friend request',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // DELETE /api/friends/:friendId - Remove friend
    app.delete('/api/friends/:friendId', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user?.id;
            const { friendId } = req.params;
            if (!friendId) {
                return res.status(400).json({ message: 'Friend ID is required' });
            }
            // Delete both sides of the friendship
            await db
                .delete(userFriends)
                .where(or(and(eq(userFriends.userId, currentUserId), eq(userFriends.friendId, friendId)), and(eq(userFriends.userId, friendId), eq(userFriends.friendId, currentUserId))));
            res.json({
                message: 'Friend removed successfully'
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({
                error: 'Failed to remove friend',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });
}
