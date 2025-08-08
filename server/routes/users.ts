import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq, and, desc, count, sql, or, inArray, ne, isNotNull, ilike } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { socialPosts, userFriends, userActivity } from '../../shared/schema.js';

// JWT Auth middleware
function jwtAuth(req: any, res: any, next: any) {
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
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function registerUserRoutes(app: Express) {
  // GET /api/users/search - Search for users
  app.get('/api/users/search', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { 
        q = '', 
        location = '', 
        interests = '', 
        civicLevel = '', 
        limit = 20, 
        offset = 0 
      } = req.query;

      let whereConditions: any[] = [];

      // Exclude current user from search results
      whereConditions.push(ne(users.id, currentUserId));

      // Search by name, email, or location
      if (q && typeof q === 'string') {
        const searchTerm = `%${q.toLowerCase()}%`;
        whereConditions.push(
          or(
            ilike(users.firstName, searchTerm),
            ilike(users.lastName, searchTerm),
            ilike(users.username, searchTerm),
            ilike(users.email, searchTerm),
            ilike(users.city, searchTerm),
            ilike(users.province, searchTerm)
          )
        );
      }

      // Filter by location
      if (location && typeof location === 'string') {
        const locationTerm = `%${location.toLowerCase()}%`;
        whereConditions.push(
          or(
            ilike(users.city, locationTerm),
            ilike(users.province, locationTerm),
            ilike(users.federalRiding, locationTerm)
          )
        );
      }

      // Filter by civic level
      if (civicLevel && typeof civicLevel === 'string') {
        whereConditions.push(eq(users.civicLevel, civicLevel));
      }

      // Get users with basic info
      const searchResults = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          city: users.city,
          province: users.province,
          civicLevel: users.civicLevel,
          isVerified: users.isVerified,
          trustScore: users.trustScore,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(and(...whereConditions))
        .orderBy(desc(users.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Get total count for pagination
      const [totalCount] = await db
        .select({ count: count() })
        .from(users)
        .where(and(...whereConditions));

      // Format results for frontend
      const formattedResults = searchResults.map(user => ({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        location: user.city && user.province ? `${user.city}, ${user.province}` : user.city || user.province,
        civicLevel: user.civicLevel,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
        joinedAt: user.createdAt,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || user.username || 'Anonymous User'
      }));

      res.json({
        users: formattedResults,
        total: totalCount?.count || 0,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: formattedResults.length === parseInt(limit as string)
        },
        searchParams: { q, location, interests, civicLevel }
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // GET /api/users/profile - Get current user profile
  app.get('/api/users/profile', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;

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
          postalCode: users.postalCode,
          civicLevel: users.civicLevel,
          isVerified: users.isVerified,
          trustScore: users.trustScore,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, currentUserId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's social stats
      const [postsCount] = await db
        .select({ count: count() })
        .from(socialPosts)
        .where(eq(socialPosts.userId, user.id));

      const [friendsCount] = await db
        .select({ count: count() })
        .from(userFriends)
        .where(and(
          eq(userFriends.userId, user.id),
          eq(userFriends.status, 'accepted')
        ));

      const [activitiesCount] = await db
        .select({ count: count() })
        .from(userActivity)
        .where(eq(userActivity.userId, user.id));

      const profile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        location: user.city && user.province ? `${user.city}, ${user.province}` : user.city || user.province,
        civicLevel: user.civicLevel,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
        joinedAt: user.createdAt,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || user.email?.split('@')[0] || 'Anonymous User',
        stats: {
          posts: postsCount?.count || 0,
          friends: friendsCount?.count || 0,
          activities: activitiesCount?.count || 0
        }
      };

      res.json(profile);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to get current user profile" });
    }
  });

  // GET /api/users/profile/:username - Get user profile by username
  app.get('/api/users/profile/:username', async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          profileBannerUrl: users.profileBannerUrl,
          bio: users.bio,
          website: users.website,
          socialLinks: users.socialLinks,
          interests: users.interests,
          politicalAffiliation: users.politicalAffiliation,
          occupation: users.occupation,
          education: users.education,
          city: users.city,
          province: users.province,
          postalCode: users.postalCode,
          civicLevel: users.civicLevel,
          isVerified: users.isVerified,
          trustScore: users.trustScore,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          // Profile customization
          profileTheme: users.profileTheme,
          profileAccentColor: users.profileAccentColor,
          profileBioVisibility: users.profileBioVisibility,
          profileLocationVisibility: users.profileLocationVisibility,
          profileStatsVisibility: users.profileStatsVisibility,
          profilePostsVisibility: users.profilePostsVisibility,
          profileCustomFields: users.profileCustomFields,
          profileLayout: users.profileLayout,
          profileShowBadges: users.profileShowBadges,
          profileShowStats: users.profileShowStats,
          profileShowActivity: users.profileShowActivity,
          profileShowFriends: users.profileShowFriends,
          profileShowPosts: users.profileShowPosts,
          profileLastUpdated: users.profileLastUpdated,
        })
        .from(users)
        .where(eq(users.username, username));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's social stats
      const [postsCount] = await db
        .select({ count: count() })
        .from(socialPosts)
        .where(eq(socialPosts.userId, user.id));

      const [friendsCount] = await db
        .select({ count: count() })
        .from(userFriends)
        .where(and(
          eq(userFriends.userId, user.id),
          eq(userFriends.status, 'accepted')
        ));

      const [activitiesCount] = await db
        .select({ count: count() })
        .from(userActivity)
        .where(eq(userActivity.userId, user.id));

      const profile = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        profileBannerUrl: user.profileBannerUrl,
        bio: user.bio,
        website: user.website,
        socialLinks: user.socialLinks,
        interests: user.interests,
        politicalAffiliation: user.politicalAffiliation,
        occupation: user.occupation,
        education: user.education,
        location: user.city && user.province ? `${user.city}, ${user.province}` : user.city || user.province,
        civicLevel: user.civicLevel,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
        joinedAt: user.createdAt,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || user.username || 'Anonymous User',
        // Profile customization
        profileTheme: user.profileTheme,
        profileAccentColor: user.profileAccentColor,
        profileBioVisibility: user.profileBioVisibility,
        profileLocationVisibility: user.profileLocationVisibility,
        profileStatsVisibility: user.profileStatsVisibility,
        profilePostsVisibility: user.profilePostsVisibility,
        profileCustomFields: user.profileCustomFields,
        profileLayout: user.profileLayout,
        profileShowBadges: user.profileShowBadges,
        profileShowStats: user.profileShowStats,
        profileShowActivity: user.profileShowActivity,
        profileShowFriends: user.profileShowFriends,
        profileShowPosts: user.profileShowPosts,
        profileLastUpdated: user.profileLastUpdated,
        stats: {
          posts: postsCount?.count || 0,
          friends: friendsCount?.count || 0,
          activities: activitiesCount?.count || 0
        }
      };

      res.json({ profile });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // GET /api/users/:id/profile - Get specific user profile
  app.get('/api/users/:id/profile', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.id || '').replace(/^user_/i, '');

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
          postalCode: users.postalCode,
          civicLevel: users.civicLevel,
          isVerified: users.isVerified,
          trustScore: users.trustScore,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's social stats
      const [postsCount] = await db
        .select({ count: count() })
        .from(socialPosts)
        .where(eq(socialPosts.userId, userId));

      const [friendsCount] = await db
        .select({ count: count() })
        .from(userFriends)
        .where(and(
          eq(userFriends.userId, userId),
          eq(userFriends.status, 'accepted')
        ));

      const [activitiesCount] = await db
        .select({ count: count() })
        .from(userActivity)
        .where(eq(userActivity.userId, userId));

      const profile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        location: user.city && user.province ? `${user.city}, ${user.province}` : user.city || user.province,
        civicLevel: user.civicLevel,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
        joinedAt: user.createdAt,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || user.email?.split('@')[0] || 'Anonymous User',
        stats: {
          posts: postsCount?.count || 0,
          friends: friendsCount?.count || 0,
          activities: activitiesCount?.count || 0
        }
      };

      res.json(profile);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // GET /api/users/:id/stats - Get user stats
  app.get('/api/users/:id/stats', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.id || '').replace(/^user_/i, '');

      // Get user's social stats
      const [postsCount] = await db
        .select({ count: count() })
        .from(socialPosts)
        .where(eq(socialPosts.userId, userId));

      const [friendsCount] = await db
        .select({ count: count() })
        .from(userFriends)
        .where(and(
          eq(userFriends.userId, userId),
          eq(userFriends.status, 'accepted')
        ));

      const [activitiesCount] = await db
        .select({ count: count() })
        .from(userActivity)
        .where(eq(userActivity.userId, userId));

      const stats = {
        posts: postsCount?.count || 0,
        friends: friendsCount?.count || 0,
        activities: activitiesCount?.count || 0
      };

      res.json(stats);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to get user stats" });
    }
  });

  // GET /api/users/:id - Get user profile
  app.get('/api/users/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.id || '').replace(/^user_/i, '');
      const currentUserId = (req.user as any).id;

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
          postalCode: users.postalCode,
          civicLevel: users.civicLevel,
          isVerified: users.isVerified,
          trustScore: users.trustScore,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's social stats
      const [postsCount] = await db
        .select({ count: count() })
        .from(socialPosts)
        .where(eq(socialPosts.userId, userId));

      const [friendsCount] = await db
        .select({ count: count() })
        .from(userFriends)
        .where(and(
          eq(userFriends.userId, userId),
          eq(userFriends.status, 'accepted')
        ));

      const [activitiesCount] = await db
        .select({ count: count() })
        .from(userActivity)
        .where(eq(userActivity.userId, userId));

      // Check if current user is friends with this user
      const [isFriend] = await db
        .select({ count: count() })
        .from(userFriends)
        .where(and(
          or(
            and(eq(userFriends.userId, currentUserId), eq(userFriends.friendId, userId)),
            and(eq(userFriends.userId, userId), eq(userFriends.friendId, currentUserId))
          ),
          eq(userFriends.status, 'accepted')
        ));

      // Check if there's a pending friend request
      const [pendingRequest] = await db
        .select({ count: count() })
        .from(userFriends)
        .where(and(
          eq(userFriends.userId, currentUserId),
          eq(userFriends.friendId, userId),
          eq(userFriends.status, 'pending')
        ));

      const [receivedRequest] = await db
        .select({ count: count() })
        .from(userFriends)
        .where(and(
          eq(userFriends.userId, userId),
          eq(userFriends.friendId, currentUserId),
          eq(userFriends.status, 'pending')
        ));

      const profile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        location: user.city && user.province ? `${user.city}, ${user.province}` : user.city || user.province,
        civicLevel: user.civicLevel,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
        joinedAt: user.createdAt,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || user.email?.split('@')[0] || 'Anonymous User',
        stats: {
          posts: postsCount?.count || 0,
          friends: friendsCount?.count || 0,
          activities: activitiesCount?.count || 0
        },
        friendship: {
          isFriend: (isFriend?.count || 0) > 0,
          pendingRequest: (pendingRequest?.count || 0) > 0,
          receivedRequest: (receivedRequest?.count || 0) > 0,
          canSendRequest: !isFriend?.count && !pendingRequest?.count && !receivedRequest?.count
        }
      };

      res.json(profile);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // GET /api/users/:id/posts - Get user's posts
  app.get('/api/users/:id/posts', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.id || '').replace(/^user_/i, '');
      const { limit = 10, offset = 0 } = req.query;

      const posts = await db
        .select({
          id: sql`social_posts.id`,
          content: sql`social_posts.content`,
          type: sql`social_posts.type`,
          visibility: sql`social_posts.visibility`,
          createdAt: sql`social_posts.created_at`,
          likesCount: sql`(SELECT COUNT(*) FROM social_likes WHERE post_id = social_posts.id)`,
          commentsCount: sql`(SELECT COUNT(*) FROM social_comments WHERE post_id = social_posts.id)`,
        })
        .from(sql`social_posts`)
        .where(eq(sql`social_posts.user_id`, userId))
        .orderBy(desc(sql`social_posts.created_at`))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json({
        posts,
        total: posts.length,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: posts.length === parseInt(limit as string)
        }
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to get user posts" });
    }
  });

  // GET /api/users/:id/activity - Get user's recent activity
  app.get('/api/users/:id/activity', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.id || '').replace(/^user_/i, '');
      const { limit = 10, offset = 0 } = req.query;

      const activities = await db
        .select({
          id: sql`user_activities.id`,
          activityType: sql`user_activities.activity_type`,
          activityData: sql`user_activities.activity_data`,
          createdAt: sql`user_activities.created_at`,
        })
        .from(sql`user_activities`)
        .where(eq(sql`user_activities.user_id`, userId))
        .orderBy(desc(sql`user_activities.created_at`))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json({
        activities,
        total: activities.length,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: activities.length === parseInt(limit as string)
        }
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to get user activity" });
    }
  });

  // GET /api/users/suggestions - Get user suggestions
  app.get('/api/users/suggestions', jwtAuth, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const { limit = 5 } = req.query;

      // Get users with similar interests or location
      const suggestions = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          civicLevel: users.civicLevel,
          city: users.city,
          province: users.province,
        })
        .from(users)
        .where(and(
          ne(users.id, currentUserId),
          isNotNull(users.city)
        ))
        .orderBy(sql`RANDOM()`)
        .limit(parseInt(limit as string));

      const formattedSuggestions = suggestions.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        civicLevel: user.civicLevel,
        location: user.city && user.province ? `${user.city}, ${user.province}` : user.city || user.province,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || 'Anonymous User'
      }));

      res.json({
        suggestions: formattedSuggestions,
        total: formattedSuggestions.length
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to get user suggestions" });
    }
  });
}

// Default export for backward compatibility
export default function usersRoutes(app: Express) {
  registerUserRoutes(app);
} 