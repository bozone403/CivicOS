import { db } from '../db.js';
import { sql } from 'drizzle-orm';
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
        return res.status(401).json({ error: "Invalid token" });
    }
}
export default function usersRoutes(app) {
    // Get public profile by username
    app.get('/api/users/profile/:username', async (req, res) => {
        try {
            const { username } = req.params;
            const user = await db.execute(sql `
        SELECT 
          id, 
          email, 
          first_name, 
          last_name, 
          bio, 
          profile_image_url, 
          civic_level, 
          is_verified,
          location,
          created_at,
          civic_points
        FROM users 
        WHERE username = ${username} OR email = ${username}
      `);
            if (user.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            const userData = user.rows[0];
            // Get user stats
            const stats = await db.execute(sql `
        SELECT 
          (SELECT COUNT(*) FROM social_posts WHERE user_id = ${userData.id}) as posts_count,
          (SELECT COUNT(*) FROM user_friends WHERE friend_id = ${userData.id} AND status = 'accepted') as followers_count,
          (SELECT COUNT(*) FROM user_friends WHERE user_id = ${userData.id} AND status = 'accepted') as following_count
      `);
            const profile = {
                id: userData.id,
                username: userData.email?.split('@')[0] || 'anonymous',
                firstName: userData.first_name,
                lastName: userData.last_name,
                email: userData.email,
                bio: userData.bio,
                profileImageUrl: userData.profile_image_url,
                civicLevel: userData.civic_level,
                isVerified: userData.is_verified,
                location: userData.location,
                joinDate: userData.created_at,
                postsCount: parseInt(stats.rows[0]?.posts_count || '0'),
                followersCount: parseInt(stats.rows[0]?.followers_count || '0'),
                followingCount: parseInt(stats.rows[0]?.following_count || '0'),
                civicPoints: userData.civic_points || 0,
            };
            res.json({ profile });
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({ error: "Failed to fetch user profile" });
        }
    });
    // Get user posts
    app.get('/api/social/posts/user/:username', async (req, res) => {
        try {
            const { username } = req.params;
            // Get user ID from username
            const user = await db.execute(sql `
        SELECT id FROM users WHERE username = ${username} OR email = ${username}
      `);
            if (user.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            const userId = user.rows[0].id;
            // Get user's posts
            const posts = await db.execute(sql `
        SELECT 
          sp.id,
          sp.content,
          sp.image_url,
          sp.type,
          sp.visibility,
          sp.tags,
          sp.location,
          sp.mood,
          sp.created_at,
          sp.updated_at,
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.profile_image_url,
          (SELECT COUNT(*) FROM social_likes WHERE post_id = sp.id) as likes_count,
          (SELECT COUNT(*) FROM social_comments WHERE post_id = sp.id) as comments_count,
          (SELECT COUNT(*) FROM social_posts WHERE original_item_id = sp.id AND type = 'share') as shares_count
        FROM social_posts sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.user_id = ${userId}
        ORDER BY sp.created_at DESC
      `);
            const formattedPosts = posts.rows.map((post) => ({
                id: post.id,
                content: post.content,
                imageUrl: post.image_url,
                type: post.type,
                visibility: post.visibility,
                tags: post.tags || [],
                location: post.location,
                mood: post.mood,
                createdAt: post.created_at,
                updatedAt: post.updated_at,
                likesCount: parseInt(post.likes_count || '0'),
                commentsCount: parseInt(post.comments_count || '0'),
                sharesCount: parseInt(post.shares_count || '0'),
                isLiked: false, // TODO: Check if current user liked this post
                user: {
                    id: post.user_id,
                    firstName: post.first_name,
                    lastName: post.last_name,
                    profileImageUrl: post.profile_image_url,
                },
            }));
            res.json({ posts: formattedPosts });
        }
        catch (error) {
            console.error('Error fetching user posts:', error);
            res.status(500).json({ error: "Failed to fetch user posts" });
        }
    });
    // Get user achievements
    app.get('/api/users/:username/achievements', async (req, res) => {
        try {
            const { username } = req.params;
            // Get user ID from username
            const user = await db.execute(sql `
        SELECT id FROM users WHERE username = ${username} OR email = ${username}
      `);
            if (user.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            const userId = user.rows[0].id;
            // Get user's achievements
            const achievements = await db.execute(sql `
        SELECT 
          b.id,
          b.name,
          b.description,
          b.icon,
          ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ${userId} AND ub.is_completed = true
        ORDER BY ub.earned_at DESC
      `);
            const formattedAchievements = achievements.rows.map((achievement) => ({
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                earnedAt: achievement.earned_at,
            }));
            res.json({ achievements: formattedAchievements });
        }
        catch (error) {
            console.error('Error fetching user achievements:', error);
            res.status(500).json({ error: "Failed to fetch user achievements" });
        }
    });
    // Search users
    app.get('/api/users/search', async (req, res) => {
        try {
            const { q, limit = 10 } = req.query;
            if (!q || typeof q !== 'string') {
                return res.status(400).json({ error: "Search query is required" });
            }
            const searchTerm = `%${q}%`;
            const results = await db.execute(sql `
        SELECT 
          id,
          email,
          first_name,
          last_name,
          bio,
          profile_image_url,
          civic_level,
          is_verified,
          location
        FROM users 
        WHERE 
          first_name ILIKE ${searchTerm} OR 
          last_name ILIKE ${searchTerm} OR 
          email ILIKE ${searchTerm} OR
          bio ILIKE ${searchTerm}
        ORDER BY 
          CASE 
            WHEN first_name ILIKE ${searchTerm} OR last_name ILIKE ${searchTerm} THEN 1
            WHEN email ILIKE ${searchTerm} THEN 2
            ELSE 3
          END,
          created_at DESC
        LIMIT ${parseInt(limit)}
      `);
            const users = results.rows.map((user) => ({
                id: user.id,
                username: user.email?.split('@')[0] || 'anonymous',
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                bio: user.bio,
                profileImageUrl: user.profile_image_url,
                civicLevel: user.civic_level,
                isVerified: user.is_verified,
                location: user.location,
            }));
            res.json({ users });
        }
        catch (error) {
            console.error('Error searching users:', error);
            res.status(500).json({ error: "Failed to search users" });
        }
    });
    // Update user profile
    app.put('/api/users/profile', jwtAuth, async (req, res) => {
        try {
            const { firstName, lastName, bio, profileImageUrl } = req.body;
            const userId = req.user.sub;
            const updateData = {};
            if (firstName !== undefined)
                updateData.first_name = firstName;
            if (lastName !== undefined)
                updateData.last_name = lastName;
            if (bio !== undefined)
                updateData.bio = bio;
            if (profileImageUrl !== undefined)
                updateData.profile_image_url = profileImageUrl;
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ error: "No fields to update" });
            }
            await db.execute(sql `
        UPDATE users 
        SET ${Object.keys(updateData).map(key => `${key} = ${updateData[key]}`).join(', ')}
        WHERE id = ${userId}
      `);
            res.json({ message: "Profile updated successfully" });
        }
        catch (error) {
            console.error('Error updating user profile:', error);
            res.status(500).json({ error: "Failed to update profile" });
        }
    });
}
