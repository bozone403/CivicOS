import { Express, Request, Response } from 'express';
import { storage } from '../storage.js';
import { db } from '../db.js';
import { users, userActivities, profileViews, userBlocks, userReports, votes, petitionSignatures, socialPosts, userFriends } from '../../shared/schema.js';
import { eq, and, desc, count, sql, inArray } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

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

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export function registerUserRoutes(app: Express) {
  // GET /api/users/:id/profile - Get user profile
  app.get('/api/users/:id/profile', async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      
      const [user] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          bio: users.bio,
          website: users.website,
          socialLinks: users.socialLinks,
          interests: users.interests,
          politicalAffiliation: users.politicalAffiliation,
          occupation: users.occupation,
          education: users.education,
          profileImageUrl: users.profileImageUrl,
          profileBannerUrl: users.profileBannerUrl,
          profileTheme: users.profileTheme,
          profileAccentColor: users.profileAccentColor,
          profileVisibility: users.profileVisibility,
          profileBioVisibility: users.profileBioVisibility,
          profileCompletionPercentage: users.profileCompletionPercentage,
          civicLevel: users.civicLevel,
          trustScore: users.trustScore,
          civicPoints: users.civicPoints,
          city: users.city,
          province: users.province,
          federalRiding: users.federalRiding,
          provincialRiding: users.provincialRiding,
          isVerified: users.isVerified,
          verificationLevel: users.verificationLevel,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check profile visibility
      if (user.profileVisibility === 'private') {
        // Only allow access if the requester is the user themselves
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(403).json({ error: "Profile is private" });
        }
        
        try {
          const token = authHeader.split(" ")[1];
          const secret = process.env.SESSION_SECRET;
          if (!secret) {
            return res.status(500).json({ error: "Server configuration error" });
          }
          const decoded = jwt.verify(token, secret) as any;
          if (decoded.id !== userId) {
            return res.status(403).json({ error: "Profile is private" });
          }
        } catch (err) {
          return res.status(403).json({ error: "Profile is private" });
        }
      }

      // Record profile view if authenticated
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.split(" ")[1];
          const secret = process.env.SESSION_SECRET;
          if (secret) {
            const decoded = jwt.verify(token, secret) as any;
            if (decoded.id !== userId) {
              // Record the view
              await db.insert(profileViews).values({
                viewerId: decoded.id,
                profileId: userId,
              }).onConflictDoNothing();
            }
          }
        } catch (err) {
          // Ignore errors in view tracking
        }
      }

      res.json(user);
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // PUT /api/users/:id/profile - Update user profile
  app.put('/api/users/:id/profile', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const currentUserId = (req.user as any).id;
      
      // Only allow users to update their own profile
      if (currentUserId !== userId) {
        return res.status(403).json({ error: "You can only update your own profile" });
      }

      const updates = req.body;
      
      // Validate required fields
      if (updates.firstName && updates.firstName.length > 50) {
        return res.status(400).json({ error: "First name too long" });
      }
      
      if (updates.lastName && updates.lastName.length > 50) {
        return res.status(400).json({ error: "Last name too long" });
      }
      
      if (updates.bio && updates.bio.length > 500) {
        return res.status(400).json({ error: "Bio too long" });
      }

      // Update the user
      const [updatedUser] = await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  // POST /api/users/:id/upload-image - Upload profile or banner image
  app.post('/api/users/:id/upload-image', jwtAuth, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const currentUserId = (req.user as any).id;
      const imageType = req.body.type; // 'profile' or 'banner'
      
      // Only allow users to upload their own images
      if (currentUserId !== userId) {
        return res.status(403).json({ error: "You can only upload images for your own profile" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      if (!['profile', 'banner'].includes(imageType)) {
        return res.status(400).json({ error: "Invalid image type" });
      }

      // Generate public URL for the uploaded image
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Update the user's profile with the new image URL
      const updateData = imageType === 'profile' 
        ? { profileImageUrl: imageUrl }
        : { profileBannerUrl: imageUrl };

      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      res.json({
        success: true,
        imageUrl,
        user: updatedUser
      });
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // GET /api/users/:id/stats - Get user statistics
  app.get('/api/users/:id/stats', async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      
      // Get user's civic engagement stats
      const stats = await storage.getUserStats(userId);
      
             // Get additional stats from other tables
       const [votesCount] = await db
         .select({ count: count() })
         .from(votes)
         .where(eq(votes.userId, userId));

       const [petitionsCount] = await db
         .select({ count: count() })
         .from(petitionSignatures)
         .where(eq(petitionSignatures.userId, userId));

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

      const [profileViewsCount] = await db
        .select({ count: count() })
        .from(profileViews)
        .where(eq(profileViews.profileId, userId));

             res.json({
         totalVotes: votesCount?.count || 0,
         totalPetitions: petitionsCount?.count || 0,
         totalDiscussions: 0, // TODO: Implement discussions count
         totalContacts: 0, // TODO: Implement contacts count
         civicPoints: (stats as any).civicPoints || 0,
         trustScore: parseFloat(stats.trustScore) || 0,
         civicLevel: stats.civicLevel || 'Registered',
         achievementCount: 0, // TODO: Implement achievements
         streakDays: 0, // TODO: Implement streak tracking
         postsCount: postsCount?.count || 0,
         friendsCount: friendsCount?.count || 0,
         profileViews: profileViewsCount?.count || 0,
       });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: "Failed to get user stats" });
    }
  });

  // GET /api/users/:id/activity - Get user activity
  app.get('/api/users/:id/activity', async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Get user activities
      const activities = await db
        .select({
          id: userActivities.id,
          activityType: userActivities.activityType,
          activityData: userActivities.activityData,
          createdAt: userActivities.createdAt,
        })
        .from(userActivities)
        .where(eq(userActivities.userId, userId))
        .orderBy(desc(userActivities.createdAt))
        .limit(limit);

      // Format activities for display
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        type: activity.activityType,
        description: getActivityDescription(activity.activityType, activity.activityData),
        timestamp: activity.createdAt,
        data: activity.activityData,
      }));

      res.json(formattedActivities);
    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json({ error: "Failed to get user activity" });
    }
  });

  // POST /api/users/:id/activity - Record user activity
  app.post('/api/users/:id/activity', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const currentUserId = (req.user as any).id;
      const { activityType, activityData } = req.body;
      
      // Only allow users to record their own activity
      if (currentUserId !== userId) {
        return res.status(403).json({ error: "You can only record your own activity" });
      }

      const [activity] = await db
        .insert(userActivities)
        .values({
          userId,
          activityType,
          activityData,
        })
        .returning();

      res.status(201).json(activity);
    } catch (error) {
      console.error('Record user activity error:', error);
      res.status(500).json({ error: "Failed to record user activity" });
    }
  });

  // GET /api/users/search - Search users
  app.get('/api/users/search', async (req: Request, res: Response) => {
    try {
      const { q, limit = 20, offset = 0 } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      const searchTerm = `%${q}%`;
      
      const searchResults = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          civicLevel: users.civicLevel,
          trustScore: users.trustScore,
          isVerified: users.isVerified,
          profileVisibility: users.profileVisibility,
        })
        .from(users)
        .where(and(
          sql`(
            ${users.firstName} ILIKE ${searchTerm} OR 
            ${users.lastName} ILIKE ${searchTerm} OR 
            ${users.email} ILIKE ${searchTerm} OR
            ${users.bio} ILIKE ${searchTerm}
          )`,
          eq(users.profileVisibility, 'public')
        ))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json({
        users: searchResults,
        total: searchResults.length,
        query: q,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // POST /api/users/:id/block - Block a user
  app.post('/api/users/:id/block', jwtAuth, async (req: Request, res: Response) => {
    try {
      const targetUserId = req.params.id;
      const blockerId = (req.user as any).id;
      const { reason } = req.body;
      
      if (blockerId === targetUserId) {
        return res.status(400).json({ error: "You cannot block yourself" });
      }

      const [block] = await db
        .insert(userBlocks)
        .values({
          blockerId,
          blockedId: targetUserId,
          reason,
        })
        .onConflictDoNothing()
        .returning();

      res.status(201).json(block);
    } catch (error) {
      console.error('Block user error:', error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  // DELETE /api/users/:id/block - Unblock a user
  app.delete('/api/users/:id/block', jwtAuth, async (req: Request, res: Response) => {
    try {
      const targetUserId = req.params.id;
      const blockerId = (req.user as any).id;
      
      await db
        .delete(userBlocks)
        .where(and(
          eq(userBlocks.blockerId, blockerId),
          eq(userBlocks.blockedId, targetUserId)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  // POST /api/users/:id/report - Report a user
  app.post('/api/users/:id/report', jwtAuth, async (req: Request, res: Response) => {
    try {
      const reportedId = req.params.id;
      const reporterId = (req.user as any).id;
      const { reportType, reportReason, evidence } = req.body;
      
      if (reporterId === reportedId) {
        return res.status(400).json({ error: "You cannot report yourself" });
      }

      if (!reportType || !reportReason) {
        return res.status(400).json({ error: "Report type and reason are required" });
      }

      const [report] = await db
        .insert(userReports)
        .values({
          reporterId,
          reportedId,
          reportType,
          reportReason,
          evidence,
        })
        .returning();

      res.status(201).json(report);
    } catch (error) {
      console.error('Report user error:', error);
      res.status(500).json({ error: "Failed to report user" });
    }
  });
}

// Helper function to generate activity descriptions
function getActivityDescription(activityType: string, data: any): string {
  switch (activityType) {
    case 'vote':
      return `Voted on ${data?.itemType || 'legislation'}`;
    case 'petition_sign':
      return `Signed petition: ${data?.petitionTitle || 'Unknown petition'}`;
    case 'profile_update':
      return 'Updated profile information';
    case 'friend_add':
      return `Added ${data?.friendName || 'a friend'}`;
    case 'post_create':
      return 'Created a new post';
    case 'comment_create':
      return 'Added a comment';
    case 'verification_complete':
      return 'Completed identity verification';
    default:
      return 'Performed an action';
  }
} 