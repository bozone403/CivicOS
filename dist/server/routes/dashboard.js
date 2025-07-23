import { storage } from "../storage.js";
import { db } from "../db.js";
import { petitions, userActivity } from "../../shared/schema.js";
import { eq, desc } from "drizzle-orm";
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
export function registerDashboardRoutes(app) {
    // Dashboard stats endpoint
    app.get('/api/dashboard/stats', /* jwtAuth, */ async (req, res) => {
        try {
            // Temporarily use a test user ID for development
            const userId = req.user?.id || '37a4951c-05eb-44f4-bf9a-081c7fd34f72';
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            // Get user data
            const user = await storage.getUser(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            // Get user stats from database
            const userStats = await storage.getUserStats(userId);
            // Get user votes from database
            const userVotes = await storage.getUserVotes(userId);
            // Get active bills from database
            const activeBills = await storage.getActiveBills();
            // Get all politicians from database
            const allPoliticians = await storage.getAllPoliticians();
            // Get user's petitions from database
            const userPetitions = await db.select()
                .from(petitions)
                .where(eq(petitions.creatorId, userId));
            // Get recent activity from database
            const recentActivity = await db.select()
                .from(userActivity)
                .where(eq(userActivity.userId, userId))
                .orderBy(desc(userActivity.createdAt))
                .limit(5);
            // Calculate dashboard stats
            const stats = {
                totalVotes: userVotes.length,
                activeBills: activeBills.length,
                politiciansTracked: allPoliticians.length,
                petitionsSigned: userPetitions.length,
                civicPoints: user.civicPoints || 0,
                trustScore: parseFloat(user.trustScore?.toString() || '100'),
                recentActivity: recentActivity.map(activity => ({
                    id: activity.id,
                    type: activity.activityType,
                    title: `${activity.activityType} activity`,
                    timestamp: activity.createdAt,
                    icon: activity.activityType === 'vote' ? 'vote' :
                        activity.activityType === 'petition_sign' ? 'petition' : 'comment'
                }))
            };
            res.json(stats);
        }
        catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    });
    // User profile endpoint
    app.get('/api/users/profile', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const user = await storage.getUser(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            // Return user profile without sensitive data
            const profile = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                city: user.city,
                province: user.province,
                postalCode: user.postalCode,
                civicPoints: user.civicPoints,
                trustScore: user.trustScore,
                verificationLevel: user.verificationLevel,
                engagementLevel: user.engagementLevel,
                achievementTier: user.achievementTier,
                profileCompleteness: user.profileCompleteness,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
            res.json(profile);
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({ error: 'Failed to fetch user profile' });
        }
    });
    // Update user profile endpoint
    app.put('/api/users/profile', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { firstName, lastName, city, province, postalCode } = req.body;
            const updatedUser = await storage.updateUser(userId, {
                firstName,
                lastName,
                city,
                province,
                postalCode,
                profileCompleteness: 75, // Increased for profile update
                updatedAt: new Date()
            });
            res.json({
                message: "Profile updated successfully",
                user: updatedUser
            });
        }
        catch (error) {
            console.error('Error updating user profile:', error);
            res.status(500).json({ error: 'Failed to update user profile' });
        }
    });
    // User activity endpoint
    app.get('/api/users/activity', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const activity = await db.select()
                .from(userActivity)
                .where(eq(userActivity.userId, userId))
                .orderBy(desc(userActivity.createdAt))
                .limit(20);
            res.json(activity);
        }
        catch (error) {
            console.error('Error fetching user activity:', error);
            res.status(500).json({ error: 'Failed to fetch user activity' });
        }
    });
}
