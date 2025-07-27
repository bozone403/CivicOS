import { db } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq, and, desc, count, sql, or, ne, isNotNull, ilike } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
// JWT Auth middleware
function jwtAuth(req, res, next) {
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
    }
    catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
export function registerUserRoutes(app) {
    // GET /api/users/search - Search for users
    app.get('/api/users/search', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            const { q = '', location = '', interests = '', civicLevel = '', limit = 20, offset = 0 } = req.query;
            let whereConditions = [];
            // Exclude current user from search results
            whereConditions.push(ne(users.id, currentUserId));
            // Search by name, email, or location
            if (q && typeof q === 'string') {
                const searchTerm = `%${q.toLowerCase()}%`;
                whereConditions.push(or(ilike(users.firstName, searchTerm), ilike(users.lastName, searchTerm), ilike(users.email, searchTerm), ilike(users.city, searchTerm), ilike(users.province, searchTerm)));
            }
            // Filter by location
            if (location && typeof location === 'string') {
                const locationTerm = `%${location.toLowerCase()}%`;
                whereConditions.push(or(ilike(users.city, locationTerm), ilike(users.province, locationTerm), ilike(users.federalRiding, locationTerm)));
            }
            // Filter by civic level
            if (civicLevel && typeof civicLevel === 'string') {
                whereConditions.push(eq(users.civicLevel, civicLevel));
            }
            // Get users with basic info
            const searchResults = await db
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
                isVerified: users.isVerified,
                trustScore: users.trustScore,
                createdAt: users.createdAt,
            })
                .from(users)
                .where(and(...whereConditions))
                .orderBy(desc(users.createdAt))
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            // Get total count for pagination
            const [totalCount] = await db
                .select({ count: count() })
                .from(users)
                .where(and(...whereConditions));
            // Format results for frontend
            const formattedResults = searchResults.map(user => ({
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
                    : user.firstName || user.email?.split('@')[0] || 'Anonymous User'
            }));
            res.json({
                users: formattedResults,
                total: totalCount?.count || 0,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: formattedResults.length === parseInt(limit)
                },
                searchParams: { q, location, interests, civicLevel }
            });
        }
        catch (error) {
            console.error('User search error:', error);
            res.status(500).json({ error: "Failed to search users" });
        }
    });
    // GET /api/users/:id - Get user profile
    app.get('/api/users/:id', jwtAuth, async (req, res) => {
        try {
            const userId = req.params.id;
            const currentUserId = req.user.id;
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
                .from(sql `social_posts`)
                .where(eq(sql `user_id`, userId));
            const [friendsCount] = await db
                .select({ count: count() })
                .from(sql `user_friends`)
                .where(and(eq(sql `user_id`, userId), eq(sql `status`, 'accepted')));
            const [activitiesCount] = await db
                .select({ count: count() })
                .from(sql `user_activities`)
                .where(eq(sql `user_id`, userId));
            // Check if current user is friends with this user
            const [isFriend] = await db
                .select({ count: count() })
                .from(sql `user_friends`)
                .where(and(or(and(eq(sql `user_id`, currentUserId), eq(sql `friend_id`, userId)), and(eq(sql `user_id`, userId), eq(sql `friend_id`, currentUserId))), eq(sql `status`, 'accepted')));
            // Check if there's a pending friend request
            const [pendingRequest] = await db
                .select({ count: count() })
                .from(sql `user_friends`)
                .where(and(eq(sql `user_id`, currentUserId), eq(sql `friend_id`, userId), eq(sql `status`, 'pending')));
            const [receivedRequest] = await db
                .select({ count: count() })
                .from(sql `user_friends`)
                .where(and(eq(sql `user_id`, userId), eq(sql `friend_id`, currentUserId), eq(sql `status`, 'pending')));
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
        }
        catch (error) {
            console.error('Get user profile error:', error);
            res.status(500).json({ error: "Failed to get user profile" });
        }
    });
    // GET /api/users/:id/posts - Get user's posts
    app.get('/api/users/:id/posts', jwtAuth, async (req, res) => {
        try {
            const userId = req.params.id;
            const { limit = 10, offset = 0 } = req.query;
            const posts = await db
                .select({
                id: sql `social_posts.id`,
                content: sql `social_posts.content`,
                type: sql `social_posts.type`,
                visibility: sql `social_posts.visibility`,
                createdAt: sql `social_posts.created_at`,
                likesCount: sql `(SELECT COUNT(*) FROM social_likes WHERE post_id = social_posts.id)`,
                commentsCount: sql `(SELECT COUNT(*) FROM social_comments WHERE post_id = social_posts.id)`,
            })
                .from(sql `social_posts`)
                .where(eq(sql `social_posts.user_id`, userId))
                .orderBy(desc(sql `social_posts.created_at`))
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            res.json({
                posts,
                total: posts.length,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: posts.length === parseInt(limit)
                }
            });
        }
        catch (error) {
            console.error('Get user posts error:', error);
            res.status(500).json({ error: "Failed to get user posts" });
        }
    });
    // GET /api/users/:id/activity - Get user's recent activity
    app.get('/api/users/:id/activity', jwtAuth, async (req, res) => {
        try {
            const userId = req.params.id;
            const { limit = 10, offset = 0 } = req.query;
            const activities = await db
                .select({
                id: sql `user_activities.id`,
                activityType: sql `user_activities.activity_type`,
                activityData: sql `user_activities.activity_data`,
                createdAt: sql `user_activities.created_at`,
            })
                .from(sql `user_activities`)
                .where(eq(sql `user_activities.user_id`, userId))
                .orderBy(desc(sql `user_activities.created_at`))
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            res.json({
                activities,
                total: activities.length,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: activities.length === parseInt(limit)
                }
            });
        }
        catch (error) {
            console.error('Get user activity error:', error);
            res.status(500).json({ error: "Failed to get user activity" });
        }
    });
    // GET /api/users/suggestions - Get user suggestions
    app.get('/api/users/suggestions', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
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
                .where(and(ne(users.id, currentUserId), isNotNull(users.city)))
                .orderBy(sql `RANDOM()`)
                .limit(parseInt(limit));
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
        }
        catch (error) {
            console.error('Get user suggestions error:', error);
            res.status(500).json({ error: "Failed to get user suggestions" });
        }
    });
}
// Default export for backward compatibility
export default function usersRoutes(app) {
    registerUserRoutes(app);
}
