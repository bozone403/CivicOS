import { Router } from 'express';
import { db } from '../db.js';
import { users, votes, bills, petitions, petitionSignatures, politicians, socialPosts, userActivity, userFollows } from '../../shared/schema.js';
import { eq, and, count, sql, desc } from 'drizzle-orm';
import { jwtAuth } from '../routes/auth.js';

const router = Router();

// Public dashboard endpoint for testing (no auth required)
router.get('/public', async (req, res) => {
  try {
    // Get public statistics
    const activeBillsCount = await db
      .select({ count: count() })
      .from(bills)
      .where(eq(bills.status, 'active'));

    const politiciansCount = await db
      .select({ count: count() })
      .from(politicians);

    const totalPetitionsCount = await db
      .select({ count: count() })
      .from(petitions);

    res.json({
      success: true,
      publicStats: {
        activeBills: activeBillsCount[0]?.count || 0,
        totalPoliticians: politiciansCount[0]?.count || 0,
        totalPetitions: totalPetitionsCount[0]?.count || 0,
        platformStatus: 'operational',
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch public dashboard data',
      details: (error as any)?.message || String(error)
    });
  }
});

// Public stats endpoint for unauthenticated users
router.get('/public-stats', async (req, res) => {
  try {
    // Get public statistics that don't require user authentication
    const activeBillsCount = await db
      .select({ count: count() })
      .from(bills)
      .where(eq(bills.status, 'active'));

    const politiciansCount = await db
      .select({ count: count() })
      .from(politicians);

    const totalPetitionsCount = await db
      .select({ count: count() })
      .from(petitions);

    res.json({
      success: true,
      totalVotes: 0,
      activeBills: activeBillsCount[0]?.count || 0,
      politiciansTracked: politiciansCount[0]?.count || 0,
      petitionsSigned: 0,
      civicPoints: 0,
      trustScore: 100,
      recentActivity: []
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch public stats',
      details: (error as any)?.message || String(error)
    });
  }
});

// Get comprehensive dashboard statistics (public aggregates + per-user when authed)
router.get('/stats', async (req: any, res) => {
  try {
    // Public aggregates
    const [activeBillsCount] = await db
      .select({ count: count() })
      .from(bills)
      .where(eq(bills.status, 'active'));

    const [politiciansCount] = await db
      .select({ count: count() })
      .from(politicians);

    const [totalPetitionsCount] = await db
      .select({ count: count() })
      .from(petitions);

    // If user is authenticated, enrich with per-user stats
    let totalVotesUser = 0;
    let petitionsSignedUser = 0;
    let politiciansTrackedUser = politiciansCount?.count || 0; // default to overall if not authed
    let civicPoints = 0;
    let trustScore = 100;
    let recentActivity: Array<{ id: string; type: string; title: string; timestamp: string; icon: string }>= [];

    const authHeader = req.headers?.authorization as string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Minimal decode: downstream handlers already verify; here we only attempt if present
      try {
        const token = authHeader.split(' ')[1];
        const jwt = await import('jsonwebtoken');
        const decoded: any = jwt.verify(token, process.env.SESSION_SECRET as string);
        const userId = decoded?.id as string | undefined;
        if (userId) {
          const [voteCount] = await db.select({ count: count() }).from(votes).where(eq(votes.userId, userId));
          totalVotesUser = voteCount?.count || 0;

          const [sigCount] = await db.select({ count: count() }).from(petitionSignatures).where(eq(petitionSignatures.userId, userId));
          petitionsSignedUser = sigCount?.count || 0;

          const [followsCount] = await db.select({ count: count() }).from(userFollows).where(eq(userFollows.userId, userId));
          politiciansTrackedUser = followsCount?.count || 0;

          const userRow = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          civicPoints = userRow[0]?.civicPoints || 0;
          trustScore = Math.min(100, Math.max(0, Math.round((civicPoints / 1000) * 100)));

          const activityRows = await db
            .select()
            .from(userActivity)
            .where(eq(userActivity.userId, userId))
            .orderBy(desc(userActivity.createdAt))
            .limit(10);
          recentActivity = activityRows.map((a) => ({
            id: String(a.id),
            type: a.activityType || 'general',
            title: getActivityTitle(a.activityType || 'general', a.activityData),
            timestamp: a.createdAt?.toISOString?.() || new Date().toISOString(),
            icon: getActivityIcon(a.activityType || 'general'),
          }));
        }
      } catch {}
    }

    res.json({
      success: true,
      totalVotes: totalVotesUser,
      activeBills: activeBillsCount?.count || 0,
      politiciansTracked: politiciansTrackedUser,
      petitionsSigned: petitionsSignedUser,
      civicPoints,
      trustScore,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard stats',
      details: (error as any)?.message || String(error)
    });
  }
});

// Helper function to get activity icons
function getActivityIcon(activityType: string): string {
  const iconMap: { [key: string]: string } = {
    'vote': 'vote',
    'petition': 'target',
    'comment': 'message-square',
    'post': 'file-text',
    'like': 'heart',
    'share': 'share',
    'friend': 'users',
    'profile': 'user',
    'welcome': 'home',
    'suggestion': 'lightbulb',
    'general': 'activity'
  };
  
  return iconMap[activityType] || 'activity';
}

// Helper function to get activity titles
function getActivityTitle(activityType: string, activityData: any): string {
  const titleMap: { [key: string]: string } = {
    'vote': 'Voted on a bill',
    'petition': 'Signed a petition',
    'comment': 'Posted a comment',
    'post': 'Created a social post',
    'like': 'Liked content',
    'share': 'Shared content',
    'friend': 'Added a friend',
    'profile': 'Updated profile',
    'welcome': 'Welcome to CivicOS!',
    'suggestion': 'Activity suggestion',
    'general': 'Activity recorded'
  };
  
  return titleMap[activityType] || 'Activity recorded';
}

// Get user's civic profile summary with real data
router.get('/profile', jwtAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const currentUser = user[0];

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's vote count
    const voteCount = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.userId, userId));

    // Get user's petition signatures count
    const petitionSignaturesCount = await db
      .select({ count: count() })
      .from(petitionSignatures)
      .where(eq(petitionSignatures.userId, userId));

    // Get user's social posts count
    const socialPostsCount = await db
      .select({ count: count() })
      .from(socialPosts)
      .where(eq(socialPosts.userId, userId));

    // Calculate rank percentile based on civic points
    const allUsers = await db.select({ civicPoints: users.civicPoints }).from(users);
    const sortedUsers = allUsers.sort((a, b) => (b.civicPoints || 0) - (a.civicPoints || 0));
    const userRank = sortedUsers.findIndex(user => user.civicPoints === currentUser.civicPoints) + 1;
    const rankPercentile = Math.round(((sortedUsers.length - userRank) / sortedUsers.length) * 100);

    const profileData = {
      civicLevel: currentUser.civicLevel || "Registered",
      rankPercentile: rankPercentile,
      badgesEarned: [
        { name: "First Vote", icon: "vote", date: currentUser.createdAt?.toISOString().split('T')[0] || "2025-01-01" },
        { name: "Profile Complete", icon: "user", date: currentUser.updatedAt?.toISOString().split('T')[0] || "2025-01-01" },
        { name: "Engaged Citizen", icon: "activity", date: currentUser.lastActivityDate?.toISOString().split('T')[0] || "2025-01-01" }
      ],
      nextBadge: {
        name: "Petition Creator",
        progress: Math.min(100, (petitionSignaturesCount[0]?.count || 0) * 50),
        requirement: "Sign your first petition"
      },
      engagementStreak: currentUser.streakDays || 0,
      impactScore: (voteCount[0]?.count || 0) * 10 + (petitionSignaturesCount[0]?.count || 0) * 15 + (socialPostsCount[0]?.count || 0) * 5,
      achievements: {
        totalActions: (voteCount[0]?.count || 0) + (petitionSignaturesCount[0]?.count || 0) + (socialPostsCount[0]?.count || 0),
        correctPredictions: 0, // Would need a separate table for this
        factChecksContributed: 0, // Would need a separate table for this
        discussionsStarted: socialPostsCount[0]?.count || 0
      }
    };

    res.json(profileData);
  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      error: 'Failed to fetch profile data'
    });
  }
});

// Get personalized recommendations based on user data
router.get('/recommendations', jwtAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get active bills for recommendations
    const activeBills = await db
      .select()
      .from(bills)
      .where(eq(bills.status, 'active'))
      .limit(3);

    // Get active petitions for recommendations
    const activePetitions = await db
      .select()
      .from(petitions)
      .where(eq(petitions.status, 'active'))
      .limit(3);

    const recommendations = {
      bills: activeBills.map(bill => ({
        id: bill.id,
        title: bill.title,
        reason: "Active bill in parliament",
        urgency: "medium",
        action: "Read summary and vote"
      })),
      petitions: activePetitions.map(petition => ({
        id: petition.id,
        title: petition.title,
        reason: "Active petition seeking signatures",
        urgency: "medium",
        action: "Read and sign if you support"
      })),
      actions: [
        {
          type: "profile",
          title: "Complete Your Profile",
          reason: "Unlock more features and earn civic points",
          template: "profile-completion"
        },
        {
          type: "verification",
          title: "Verify Your Identity",
          reason: "Access enhanced features and increase trust score",
          template: "identity-verification"
        }
      ]
    };

    res.json(recommendations);
  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      error: 'Failed to fetch recommendations'
    });
  }
});

export default router; 