import { Router } from 'express';
import { db } from '../db.js';
import { users, votes, bills, petitions, petitionSignatures, politicians, socialPosts, userActivity } from '../../shared/schema.js';
import { eq, and, count, desc, gte } from 'drizzle-orm';
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch public dashboard data',
            details: error?.message || String(error)
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch public stats',
            details: error?.message || String(error)
        });
    }
});
// Get comprehensive dashboard statistics with real data
router.get('/stats', jwtAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get user's current data
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
        // Get active bills count
        const activeBillsCount = await db
            .select({ count: count() })
            .from(bills)
            .where(eq(bills.status, 'active'));
        // Get user's petition signatures count
        const petitionSignaturesCount = await db
            .select({ count: count() })
            .from(petitionSignatures)
            .where(eq(petitionSignatures.userId, userId));
        // Get total politicians count (for tracking)
        const politiciansCount = await db
            .select({ count: count() })
            .from(politicians);
        // Get user's recent activities (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentActivities = await db
            .select({
            id: userActivity.id,
            type: userActivity.type,
            activityData: userActivity.data,
            timestamp: userActivity.createdAt,
        })
            .from(userActivity)
            .where(and(eq(userActivity.userId, userId), gte(userActivity.createdAt, sevenDaysAgo)))
            .orderBy(desc(userActivity.createdAt))
            .limit(5);
        // Get user's social posts count
        const socialPostsCount = await db
            .select({ count: count() })
            .from(socialPosts)
            .where(eq(socialPosts.userId, userId));
        // Calculate trust score based on various factors
        const trustScore = Math.min(100, Math.max(0, Number(currentUser.trustScore || 100) +
            (voteCount[0]?.count || 0) * 2 +
            (petitionSignaturesCount[0]?.count || 0) * 3 +
            (socialPostsCount[0]?.count || 0) * 1));
        // Calculate civic points based on engagement
        const civicPoints = Number(currentUser.civicPoints || 0) +
            (voteCount[0]?.count || 0) * 10 +
            (petitionSignaturesCount[0]?.count || 0) * 15 +
            (socialPostsCount[0]?.count || 0) * 5;
        // Format recent activities for the frontend
        const formattedActivities = recentActivities.map(activity => ({
            id: activity.id,
            type: activity.type || 'general',
            title: getActivityTitle(activity.type || 'general', activity.activityData),
            timestamp: activity.timestamp?.toISOString() || new Date().toISOString(),
            icon: getActivityIcon(activity.type || 'general')
        }));
        // If no recent activities, provide some default ones
        if (formattedActivities.length === 0) {
            formattedActivities.push({
                id: 999999,
                type: 'welcome',
                title: 'Welcome to CivicOS! Start engaging with democracy.',
                timestamp: new Date().toISOString(),
                icon: 'welcome'
            }, {
                id: 999998,
                type: 'suggestion',
                title: 'Try voting on a bill or signing a petition to earn civic points.',
                timestamp: new Date().toISOString(),
                icon: 'suggestion'
            });
        }
        const stats = {
            totalVotes: voteCount[0]?.count || 0,
            activeBills: activeBillsCount[0]?.count || 0,
            politiciansTracked: politiciansCount[0]?.count || 0,
            petitionsSigned: petitionSignaturesCount[0]?.count || 0,
            civicPoints: Number(civicPoints),
            trustScore: Math.round(trustScore),
            recentActivity: formattedActivities,
            // Additional real data
            userProfile: {
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                email: currentUser.email,
                civicLevel: currentUser.civicLevel || 'Registered',
                profileCompletion: currentUser.profileCompletionPercentage || 0,
                verificationLevel: currentUser.verificationLevel || 'unverified',
                engagementLevel: currentUser.engagementLevel || 'newcomer',
                streakDays: currentUser.streakDays || 0,
                totalBadges: currentUser.totalBadges || 0,
                achievementTier: currentUser.achievementTier || 'bronze'
            },
            engagement: {
                socialPosts: socialPostsCount[0]?.count || 0,
                lastActivityDate: currentUser.lastActivityDate,
                monthlyGoal: currentUser.monthlyGoal || 100,
                yearlyGoal: currentUser.yearlyGoal || 1200,
                politicalAwarenessScore: currentUser.politicalAwarenessScore || 0
            }
        };
        res.json(stats);
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch dashboard statistics',
            fallback: {
                totalVotes: 0,
                activeBills: 0,
                politiciansTracked: 0,
                petitionsSigned: 0,
                civicPoints: 0,
                trustScore: 100,
                recentActivity: [
                    {
                        id: "welcome",
                        type: "welcome",
                        title: "Welcome to CivicOS! Start engaging with democracy.",
                        timestamp: new Date().toISOString(),
                        icon: "welcome"
                    }
                ]
            }
        });
    }
});
// Helper function to get activity icons
function getActivityIcon(activityType) {
    const iconMap = {
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
function getActivityTitle(activityType, activityData) {
    const titleMap = {
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
    }
    catch (error) {
        console.error('Profile data error:', error);
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
    }
    catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({
            error: 'Failed to fetch recommendations'
        });
    }
});
export default router;
