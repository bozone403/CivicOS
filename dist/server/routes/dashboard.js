import { storage } from "../storage.js";
import { db } from "../db.js";
import { bills, votes, politicians, userActivity, petitionSignatures } from "../../shared/schema.js";
import { eq, desc, count } from "drizzle-orm";
import { ResponseFormatter } from "../utils/responseFormatter.js";
import jwt from "jsonwebtoken";
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
export function registerDashboardRoutes(app) {
    // Dashboard stats endpoint
    app.get('/api/dashboard/stats', jwtAuth, async (req, res) => {
        const startTime = Date.now();
        try {
            const userId = req.user?.id;
            if (!userId) {
                return ResponseFormatter.unauthorized(res, "User ID not found in token");
            }
            // Get real political data from database
            const [totalVotesResult, activeBillsResult, politiciansTrackedResult, petitionsSignedResult, userResult] = await Promise.allSettled([
                // Get user's total votes
                db.select({ count: count() }).from(votes).where(eq(votes.userId, userId)),
                // Get active bills count
                db.select({ count: count() }).from(bills).where(eq(bills.status, 'active')),
                // Get total politicians count
                db.select({ count: count() }).from(politicians),
                // Get petitions signed by user
                db.select({ count: count() }).from(petitionSignatures).where(eq(petitionSignatures.userId, userId)),
                // Get user data
                storage.getUser(userId)
            ]);
            // Extract counts from results
            const totalVotes = totalVotesResult.status === 'fulfilled' ? totalVotesResult.value[0]?.count || 0 : 0;
            const activeBills = activeBillsResult.status === 'fulfilled' ? activeBillsResult.value[0]?.count || 0 : 0;
            const politiciansTracked = politiciansTrackedResult.status === 'fulfilled' ? politiciansTrackedResult.value[0]?.count || 0 : 0;
            const petitionsSigned = petitionsSignedResult.status === 'fulfilled' ? petitionsSignedResult.value[0]?.count || 0 : 0;
            // Get user data
            const user = userResult.status === 'fulfilled' ? userResult.value : null;
            const civicPoints = user?.civicPoints || 0;
            const trustScore = user?.trustScore || 100;
            // Get recent activity
            const recentActivity = await db.select()
                .from(userActivity)
                .where(eq(userActivity.userId, userId))
                .orderBy(desc(userActivity.createdAt))
                .limit(5);
            const stats = {
                totalVotes,
                activeBills,
                politiciansTracked,
                petitionsSigned,
                civicPoints,
                trustScore,
                recentActivity: recentActivity.map(activity => ({
                    id: activity.id.toString(),
                    type: activity.activityType,
                    title: `${activity.activityType} activity`,
                    timestamp: activity.createdAt?.toISOString() || new Date().toISOString(),
                    icon: activity.activityType === 'vote' ? 'vote' :
                        activity.activityType === 'petition_sign' ? 'petition' : 'comment'
                }))
            };
            const processingTime = Date.now() - startTime;
            return ResponseFormatter.success(res, stats, "Dashboard statistics retrieved successfully", 200, undefined, undefined, processingTime);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch dashboard stats: ${error.message}`);
        }
    });
    // User profile endpoint
    app.get('/api/users/profile', jwtAuth, async (req, res) => {
        const startTime = Date.now();
        try {
            const userId = req.user?.id;
            if (!userId) {
                return ResponseFormatter.unauthorized(res, "User ID not found in token");
            }
            const user = await storage.getUser(userId);
            if (!user) {
                return ResponseFormatter.notFound(res, "User not found");
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
            const processingTime = Date.now() - startTime;
            return ResponseFormatter.success(res, profile, "User profile retrieved successfully", 200, undefined, undefined, processingTime);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch user profile: ${error.message}`);
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
            // console.error removed for production
            res.status(500).json({ error: 'Failed to update user profile' });
        }
    });
    // User activity endpoint
    app.get('/api/users/activity', jwtAuth, async (req, res) => {
        const startTime = Date.now();
        try {
            const userId = req.user?.id;
            if (!userId) {
                return ResponseFormatter.unauthorized(res, "User ID not found in token");
            }
            const activity = await db.select()
                .from(userActivity)
                .where(eq(userActivity.userId, userId))
                .orderBy(desc(userActivity.createdAt))
                .limit(20);
            const processingTime = Date.now() - startTime;
            return ResponseFormatter.success(res, activity, "User activity retrieved successfully", 200, activity.length, undefined, processingTime);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch user activity: ${error.message}`);
        }
    });
}
