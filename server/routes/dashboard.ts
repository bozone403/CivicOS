import { Express, Request, Response } from "express";
import { storage } from "../storage.js";
import { db } from "../db.js";
import { users, bills, votes, politicians, petitions, userActivity } from "../../shared/schema.js";
import { eq, and, desc, sql, count } from "drizzle-orm";

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

export function registerDashboardRoutes(app: Express) {
  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log('Dashboard stats requested for user:', userId);

      // Get user data with timeout
      const user = await Promise.race([
        storage.getUser(userId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('User lookup timeout')), 5000))
      ]) as any;

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log('User found, getting stats...');

      // Get basic stats with timeouts
      const [userVotes, activeBills, allPoliticians, userPetitions, recentActivity] = await Promise.allSettled([
        storage.getUserVotes(userId),
        storage.getActiveBills(),
        storage.getAllPoliticians(),
        db.select().from(petitions).where(eq(petitions.creatorId, userId)),
        db.select().from(userActivity).where(eq(userActivity.userId, userId)).orderBy(desc(userActivity.createdAt)).limit(5)
      ]);

      console.log('Stats collected, building response...');

      // Calculate dashboard stats with fallbacks
      const stats = {
        totalVotes: userVotes.status === 'fulfilled' ? userVotes.value.length : 0,
        activeBills: activeBills.status === 'fulfilled' ? activeBills.value.length : 0,
        politiciansTracked: allPoliticians.status === 'fulfilled' ? allPoliticians.value.length : 0,
        petitionsSigned: userPetitions.status === 'fulfilled' ? userPetitions.value.length : 0,
        civicPoints: user.civicPoints || 0,
        trustScore: parseFloat(user.trustScore?.toString() || '100'),
        recentActivity: recentActivity.status === 'fulfilled' ? recentActivity.value.map((activity: any) => ({
          id: activity.id,
          type: activity.activityType,
          title: `${activity.activityType} activity`,
          timestamp: activity.createdAt,
          icon: activity.activityType === 'vote' ? 'vote' : 
                activity.activityType === 'petition_sign' ? 'petition' : 'comment'
        })) : []
      };

      console.log('Dashboard stats response:', stats);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats', details: (error as Error).message });
    }
  });

  // User profile endpoint
  app.get('/api/users/profile', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
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
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  // Update user profile endpoint
  app.put('/api/users/profile', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
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
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });

  // User activity endpoint
  app.get('/api/users/activity', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const activity = await db.select()
        .from(userActivity)
        .where(eq(userActivity.userId, userId))
        .orderBy(desc(userActivity.createdAt))
        .limit(20);

      res.json(activity);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ error: 'Failed to fetch user activity' });
    }
  });
} 