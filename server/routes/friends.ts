import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { users, userFriends } from "../../shared/schema.js";
import { eq, and, or, desc } from "drizzle-orm";
import { ResponseFormatter } from "../utils/responseFormatter.js";
import jwt from "jsonwebtoken";

// JWT Auth middleware
function jwtAuth(req: any, res: any, next: any) {
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
  } catch (err) {
    return ResponseFormatter.unauthorized(res, "Invalid or expired token");
  }
}

export function registerFriendRoutes(app: Express) {
  // Search users by name, email, or location
  app.get("/api/friends/search", jwtAuth, async (req: Request, res: Response) => {
    try {
      const { q, location, limit = 20, offset = 0 } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        return ResponseFormatter.unauthorized(res, "Authentication required");
      }

      // Get all users first
      const allUsers = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        city: users.city,
        province: users.province,
        country: users.country,
        civicLevel: users.civicLevel,
        trustScore: users.trustScore,
        isVerified: users.isVerified,
        createdAt: users.createdAt
      }).from(users);

      // Filter users based on search criteria
      let filteredUsers = allUsers.filter(user => user.id !== userId);

      if (q) {
        const searchTerm = (q as string).toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm)
        );
      }

      if (location) {
        const locationTerm = (location as string).toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.city?.toLowerCase().includes(locationTerm) ||
          user.province?.toLowerCase().includes(locationTerm) ||
          user.country?.toLowerCase().includes(locationTerm)
        );
      }

      // Apply pagination
      const paginatedUsers = filteredUsers.slice(
        parseInt(offset as string), 
        parseInt(offset as string) + parseInt(limit as string)
      );

      // Get friend status for each user
      const usersWithFriendStatus = await Promise.all(
        paginatedUsers.map(async (user) => {
          // Check if they are already friends
          const existingFriendship = await db.select().from(userFriends)
            .where(and(
              or(
                and(eq(userFriends.userId, userId), eq(userFriends.friendId, user.id)),
                and(eq(userFriends.userId, user.id), eq(userFriends.friendId, userId))
              ),
              eq(userFriends.status, 'accepted')
            ));

          // Check if there's a pending friend request
          const pendingRequest = await db.select().from(userFriends)
            .where(and(
              or(
                and(eq(userFriends.userId, userId), eq(userFriends.friendId, user.id)),
                and(eq(userFriends.userId, user.id), eq(userFriends.friendId, userId))
              ),
              eq(userFriends.status, 'pending')
            ));

          return {
            ...user,
            friendStatus: existingFriendship.length > 0 ? 'friends' : 
                         pendingRequest.length > 0 ? 'pending' : 'not_friends',
            requestDirection: pendingRequest.length > 0 ? 
              (pendingRequest[0].userId === userId ? 'sent' : 'received') : null
          };
        })
      );

      return ResponseFormatter.success(
        res,
        {
          users: usersWithFriendStatus,
          total: usersWithFriendStatus.length,
          query: q || '',
          location: location || ''
        },
        "User search completed successfully"
      );
    } catch (error) {
      return ResponseFormatter.error(res, "Failed to search users", 500);
    }
  });

  // Get user's friends list
  app.get("/api/friends", jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return ResponseFormatter.unauthorized(res, "Authentication required");
      }

      // Get all friendships for the user
      const friendships = await db.select({
        id: userFriends.id,
        userId: userFriends.userId,
        friendId: userFriends.friendId,
        status: userFriends.status,
        createdAt: userFriends.createdAt
      }).from(userFriends)
      .where(and(
        eq(userFriends.userId, userId),
        eq(userFriends.status, 'accepted')
      ));

      // Get friend details
      const friendsList = await Promise.all(
        friendships.map(async (friendship) => {
          const friendId = friendship.friendId;
          
          const friend = await db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
            city: users.city,
            province: users.province,
            country: users.country,
            civicLevel: users.civicLevel,
            trustScore: users.trustScore,
            isVerified: users.isVerified,
            lastActivityDate: users.lastActivityDate
          }).from(users)
          .where(eq(users.id, friendId));

          return {
            ...friend[0],
            friendshipId: friendship.id,
            friendshipCreatedAt: friendship.createdAt
          };
        })
      );

      return ResponseFormatter.success(
        res,
        { friends: friendsList },
        "Friends list retrieved successfully"
      );
    } catch (error) {
      return ResponseFormatter.error(res, "Failed to retrieve friends list", 500);
    }
  });

  // Send friend request
  app.post("/api/friends/request", jwtAuth, async (req: Request, res: Response) => {
    try {
      const { toUserId } = req.body;
      const fromUserId = (req as any).user?.id;

      if (!fromUserId) {
        return ResponseFormatter.unauthorized(res, "Authentication required");
      }

      if (!toUserId) {
        return ResponseFormatter.error(res, "Recipient user ID is required", 400);
      }

      if (fromUserId === toUserId) {
        return ResponseFormatter.error(res, "Cannot send friend request to yourself", 400);
      }

      // Check if users exist
      const [fromUser, toUser] = await Promise.all([
        db.select().from(users).where(eq(users.id, fromUserId)),
        db.select().from(users).where(eq(users.id, toUserId))
      ]);

      if (fromUser.length === 0 || toUser.length === 0) {
        return ResponseFormatter.error(res, "One or both users not found", 404);
      }

      // Check if already friends
      const existingFriendship = await db.select().from(userFriends)
        .where(and(
          or(
            and(eq(userFriends.userId, fromUserId), eq(userFriends.friendId, toUserId)),
            and(eq(userFriends.userId, toUserId), eq(userFriends.friendId, fromUserId))
          ),
          eq(userFriends.status, 'accepted')
        ));

      if (existingFriendship.length > 0) {
        return ResponseFormatter.error(res, "Users are already friends", 400);
      }

      // Check if friend request already exists
      const existingRequest = await db.select().from(userFriends)
        .where(and(
          or(
            and(eq(userFriends.userId, fromUserId), eq(userFriends.friendId, toUserId)),
            and(eq(userFriends.userId, toUserId), eq(userFriends.friendId, fromUserId))
          ),
          eq(userFriends.status, 'pending')
        ));

      if (existingRequest.length > 0) {
        return ResponseFormatter.error(res, "Friend request already exists", 400);
      }

      // Create friend request
      const [newRequest] = await db.insert(userFriends).values({
        userId: fromUserId,
        friendId: toUserId,
        status: 'pending'
      }).returning();

      return ResponseFormatter.success(
        res,
        newRequest,
        "Friend request sent successfully"
      );
    } catch (error) {
      return ResponseFormatter.error(res, "Failed to send friend request", 500);
    }
  });

  // Get pending friend requests
  app.get("/api/friends/requests", jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return ResponseFormatter.unauthorized(res, "Authentication required");
      }

      // Get incoming friend requests
      const incomingRequests = await db.select({
        id: userFriends.id,
        userId: userFriends.userId,
        status: userFriends.status,
        createdAt: userFriends.createdAt
      }).from(userFriends)
      .where(and(
        eq(userFriends.friendId, userId),
        eq(userFriends.status, 'pending')
      ));

      // Get user details for incoming requests
      const incomingWithUserDetails = await Promise.all(
        incomingRequests.map(async (request) => {
          const fromUser = await db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
            city: users.city,
            province: users.province,
            country: users.country,
            civicLevel: users.civicLevel,
            trustScore: users.trustScore,
            isVerified: users.isVerified
          }).from(users)
          .where(eq(users.id, request.userId));

          return {
            ...request,
            fromUser: fromUser[0]
          };
        })
      );

      // Get outgoing friend requests
      const outgoingRequests = await db.select({
        id: userFriends.id,
        friendId: userFriends.friendId,
        status: userFriends.status,
        createdAt: userFriends.createdAt
      }).from(userFriends)
      .where(and(
        eq(userFriends.userId, userId),
        eq(userFriends.status, 'pending')
      ));

      // Get user details for outgoing requests
      const outgoingWithUserDetails = await Promise.all(
        outgoingRequests.map(async (request) => {
          const toUser = await db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
            city: users.city,
            province: users.province,
            country: users.country,
            civicLevel: users.civicLevel,
            trustScore: users.trustScore,
            isVerified: users.isVerified
          }).from(users)
          .where(eq(users.id, request.friendId));

          return {
            ...request,
            toUser: toUser[0]
          };
        })
      );

      return ResponseFormatter.success(
        res,
        {
          incoming: incomingWithUserDetails,
          outgoing: outgoingWithUserDetails
        },
        "Friend requests retrieved successfully"
      );
    } catch (error) {
      return ResponseFormatter.error(res, "Failed to retrieve friend requests", 500);
    }
  });

  // Accept friend request
  app.post("/api/friends/accept", jwtAuth, async (req: Request, res: Response) => {
    try {
      const { requestId } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return ResponseFormatter.unauthorized(res, "Authentication required");
      }

      if (!requestId) {
        return ResponseFormatter.error(res, "Request ID is required", 400);
      }

      // Get the friend request
      const [request] = await db.select().from(userFriends)
        .where(and(
          eq(userFriends.id, parseInt(requestId)),
          eq(userFriends.friendId, userId),
          eq(userFriends.status, 'pending')
        ));

      if (!request) {
        return ResponseFormatter.error(res, "Friend request not found or already processed", 404);
      }

      // Update request status to accepted
      await db.update(userFriends)
        .set({ status: 'accepted' })
        .where(eq(userFriends.id, parseInt(requestId)));

      return ResponseFormatter.success(
        res,
        { message: "Friend request accepted successfully" },
        "Friend request accepted successfully"
      );
    } catch (error) {
      return ResponseFormatter.error(res, "Failed to accept friend request", 500);
    }
  });

  // Reject friend request
  app.post("/api/friends/reject", jwtAuth, async (req: Request, res: Response) => {
    try {
      const { requestId } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return ResponseFormatter.unauthorized(res, "Authentication required");
      }

      if (!requestId) {
        return ResponseFormatter.error(res, "Request ID is required", 400);
      }

      // Update request status to rejected
      await db.update(userFriends)
        .set({ status: 'rejected' })
        .where(and(
          eq(userFriends.id, parseInt(requestId)),
          eq(userFriends.friendId, userId),
          eq(userFriends.status, 'pending')
        ));

      return ResponseFormatter.success(
        res,
        { message: "Friend request rejected" },
        "Friend request rejected successfully"
      );
    } catch (error) {
      return ResponseFormatter.error(res, "Failed to reject friend request", 500);
    }
  });

  // Remove friend
  app.delete("/api/friends/:friendId", jwtAuth, async (req: Request, res: Response) => {
    try {
      const { friendId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return ResponseFormatter.unauthorized(res, "Authentication required");
      }

      // Delete friendship
      await db.delete(userFriends)
        .where(and(
          or(
            and(eq(userFriends.userId, userId), eq(userFriends.friendId, friendId)),
            and(eq(userFriends.userId, friendId), eq(userFriends.friendId, userId))
          )
        ));

      return ResponseFormatter.success(
        res,
        { message: "Friend removed successfully" },
        "Friend removed successfully"
      );
    } catch (error) {
      return ResponseFormatter.error(res, "Failed to remove friend", 500);
    }
  });
} 