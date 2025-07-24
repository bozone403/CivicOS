import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { users } from "../../shared/schema.js";
import { eq, ilike, or, and, desc, ne, isNotNull } from "drizzle-orm";

// JWT Auth middleware
function jwtAuth(req: any, res: any, next: any) {
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
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function registerUserRoutes(app: Express) {
  // Public user search (no auth required for basic discovery)
  app.get('/api/users/search/public', async (req: Request, res: Response) => {
    try {
      const { q, limit = 20, offset = 0 } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const searchTerm = q.trim();
      if (searchTerm.length < 2) {
        return res.status(400).json({ message: 'Search query must be at least 2 characters' });
      }

      // Search users by name, email, or location (public info only)
      const searchResults = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          city: users.city,
          province: users.province,
          civicLevel: users.civicLevel,
          trustScore: users.trustScore,
          civicPoints: users.civicPoints,
          createdAt: users.createdAt
        })
        .from(users)
        .where(
          or(
            ilike(users.firstName, `%${searchTerm}%`),
            ilike(users.lastName, `%${searchTerm}%`),
            ilike(users.city, `%${searchTerm}%`),
            ilike(users.province, `%${searchTerm}%`)
          )
        )
        .orderBy(desc(users.civicPoints))
        .limit(Number(limit))
        .offset(Number(offset));

      // Format results for frontend (no email for privacy)
      const formattedResults = searchResults.map(user => ({
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User',
        avatar: user.profileImageUrl,
        location: [user.city, user.province].filter(Boolean).join(', ') || 'Location not set',
        civicLevel: user.civicLevel,
        trustScore: user.trustScore,
        civicPoints: user.civicPoints,
        memberSince: user.createdAt?.toISOString().split('T')[0] || 'Unknown'
      }));

      res.json({
        users: formattedResults,
        total: formattedResults.length,
        query: searchTerm,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to search users',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Authenticated user search (with email and more details)
  app.get('/api/users/search', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { q, limit = 20, offset = 0 } = req.query;
      const currentUserId = (req as any).user?.id;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const searchTerm = q.trim();
      if (searchTerm.length < 2) {
        return res.status(400).json({ message: 'Search query must be at least 2 characters' });
      }

      // Search users by name, email, or location
      const searchResults = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          city: users.city,
          province: users.province,
          civicLevel: users.civicLevel,
          trustScore: users.trustScore,
          civicPoints: users.civicPoints,
          createdAt: users.createdAt
        })
        .from(users)
        .where(
          and(
            // Don't include current user in search results
            ne(users.id, currentUserId),
            // Search in name, email, or location
            or(
              ilike(users.firstName, `%${searchTerm}%`),
              ilike(users.lastName, `%${searchTerm}%`),
              ilike(users.email, `%${searchTerm}%`),
              ilike(users.city, `%${searchTerm}%`),
              ilike(users.province, `%${searchTerm}%`)
            )
          )
        )
        .orderBy(desc(users.civicPoints))
        .limit(Number(limit))
        .offset(Number(offset));

      // Format results for frontend
      const formattedResults = searchResults.map(user => ({
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User',
        email: user.email,
        avatar: user.profileImageUrl,
        location: [user.city, user.province].filter(Boolean).join(', ') || 'Location not set',
        civicLevel: user.civicLevel,
        trustScore: user.trustScore,
        civicPoints: user.civicPoints,
        memberSince: user.createdAt?.toISOString().split('T')[0] || 'Unknown'
      }));

      res.json({
        users: formattedResults,
        total: formattedResults.length,
        query: searchTerm,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to search users',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GET /api/users/:id - Get user profile
  app.get('/api/users/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const [user] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          city: users.city,
          province: users.province,
          civicLevel: users.civicLevel,
          trustScore: users.trustScore,
          civicPoints: users.civicPoints,
          currentLevel: users.currentLevel,
          totalBadges: users.totalBadges,
          streakDays: users.streakDays,
          achievementTier: users.achievementTier,
          engagementLevel: users.engagementLevel,
          createdAt: users.createdAt,
          lastActivityDate: users.lastActivityDate
        })
        .from(users)
        .where(eq(users.id, id));

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't expose email for other users
      const isOwnProfile = currentUserId === id;
      const profileData = {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User',
        email: isOwnProfile ? user.email : undefined,
        avatar: user.profileImageUrl,
        bio: user.bio,
        location: [user.city, user.province].filter(Boolean).join(', ') || 'Location not set',
        civicLevel: user.civicLevel,
        trustScore: user.trustScore,
        civicPoints: user.civicPoints,
        currentLevel: user.currentLevel,
        totalBadges: user.totalBadges,
        streakDays: user.streakDays,
        achievementTier: user.achievementTier,
        engagementLevel: user.engagementLevel,
        memberSince: user.createdAt?.toISOString().split('T')[0] || 'Unknown',
        lastActive: user.lastActivityDate?.toISOString().split('T')[0] || 'Unknown',
        isOwnProfile
      };

      res.json(profileData);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to fetch user profile',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // PUT /api/users/:id - Update user profile
  app.put('/api/users/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      const { firstName, lastName, bio, city, province } = req.body;

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Only allow users to update their own profile
      if (currentUserId !== id) {
        return res.status(403).json({ message: 'Can only update own profile' });
      }

      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (bio !== undefined) updateData.bio = bio;
      if (city !== undefined) updateData.city = city;
      if (province !== undefined) updateData.province = province;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          bio: users.bio,
          city: users.city,
          province: users.province,
          updatedAt: users.updatedAt
        });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || 'Anonymous User',
          bio: updatedUser.bio,
          location: [updatedUser.city, updatedUser.province].filter(Boolean).join(', ') || 'Location not set',
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to update user profile',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GET /api/users/suggestions - Get user suggestions for friend requests
  app.get('/api/users/suggestions', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req as any).user?.id;
      const { limit = 10 } = req.query;

      // Get users with similar civic engagement levels or locations
      const [currentUser] = await db
        .select({
          civicLevel: users.civicLevel,
          city: users.city,
          province: users.province
        })
        .from(users)
        .where(eq(users.id, currentUserId));

      if (!currentUser) {
        return res.status(404).json({ message: 'Current user not found' });
      }

      // Get suggested users based on civic level and location
      const suggestions = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          city: users.city,
          province: users.province,
          civicLevel: users.civicLevel,
          civicPoints: users.civicPoints,
          trustScore: users.trustScore
        })
        .from(users)
        .where(ne(users.id, currentUserId))
        .orderBy(desc(users.civicPoints))
        .limit(Number(limit));

      const formattedSuggestions = suggestions.map(user => ({
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User',
        avatar: user.profileImageUrl,
        location: [user.city, user.province].filter(Boolean).join(', ') || 'Location not set',
        civicLevel: user.civicLevel,
        civicPoints: user.civicPoints,
        trustScore: user.trustScore
      }));

      res.json({
        suggestions: formattedSuggestions,
        total: formattedSuggestions.length
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ 
        error: 'Failed to fetch user suggestions',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
} 