import { Router } from 'express';
import { comprehensiveDataService } from '../utils/comprehensiveDataService.js';

const router = Router();

// Get comprehensive dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get data from comprehensive service
    const dashboardStats = comprehensiveDataService.getDashboardStats();
    const economicData = comprehensiveDataService.getEconomicData();
    const politicians = comprehensiveDataService.getPoliticians();
    const bills = comprehensiveDataService.getBills();
    const news = comprehensiveDataService.getNews({ limit: 5 });

    // Enhanced dashboard statistics
    const stats = {
      ...dashboardStats,
      
      // Additional economic indicators
      economicHealth: {
        gdpGrowth: economicData.gdp.growth,
        inflationRate: economicData.inflation.current,
        unemploymentRate: economicData.unemployment.current,
        cadUsd: economicData.currency.cadUsd,
        lastUpdated: economicData.lastUpdated
      },
      
      // Political landscape summary
      politicalSummary: {
        currentPM: "Mark Carney",
        majorityParty: "Liberal",
        opposition: "Conservative",
        totalMPs: 338,
        activeBills: bills.length,
        recentNews: news.length
      },
      
      // User engagement metrics (simulated for demo)
      userEngagement: {
        weeklyLogins: 18,
        commentsPosted: 42,
        articlesRead: 167,
        votesParticipated: 89,
        petitionsSigned: dashboardStats.petitionsSigned,
        trustScoreChange: "+3 this week"
      },
      
      // Quick actions available
      quickActions: [
        {
          id: "contact-mp",
          title: "Contact Your MP",
          description: "Send a message to your representative",
          icon: "message-square",
          urgent: false
        },
        {
          id: "vote-bill",
          title: "Vote on Bill C-60",
          description: "Climate Finance Act needs your input",
          icon: "vote",
          urgent: true
        },
        {
          id: "petition-housing",
          title: "Housing Crisis Petition",
          description: "Join 45,000 Canadians demanding action",
          icon: "file-text",
          urgent: false
        },
        {
          id: "verify-identity",
          title: "Complete Verification",
          description: "Unlock all platform features",
          icon: "shield",
          urgent: true
        }
      ],
      
      // Trending topics
      trendingTopics: [
        {
          topic: "Climate Finance",
          mentions: 2847,
          sentiment: "positive",
          change: "+23%"
        },
        {
          topic: "Housing Crisis",
          mentions: 1923,
          sentiment: "negative", 
          change: "+45%"
        },
        {
          topic: "Mark Carney Transition",
          mentions: 3421,
          sentiment: "positive",
          change: "+156%"
        },
        {
          topic: "Federal Budget",
          mentions: 1456,
          sentiment: "neutral",
          change: "+12%"
        }
      ],
      
      // Government efficiency metrics
      governmentMetrics: {
        billsPassedThisSession: 23,
        averageTimeToPassage: "127 days",
        parliamentarySittings: 89,
        questionPeriodEngagement: "78%",
        transparencyScore: 7.8
      }
    };

    res.json(stats);
  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      fallback: {
        totalVotes: 847,
        activeBills: 12,
        politiciansTracked: 67,
        petitionsSigned: 23,
        civicPoints: 1847,
        trustScore: 81,
        recentActivity: [
          {
            id: "1",
            type: "government",
            title: "Mark Carney sworn in as PM",
            timestamp: "2025-07-24T15:30:00Z",
            icon: "crown"
          }
        ]
      }
    });
  }
});

// Get user's civic profile summary
router.get('/profile', async (req, res) => {
  try {
    const profileData = {
      civicLevel: "Engaged Citizen",
      rankPercentile: 78,
      badgesEarned: [
        { name: "First Vote", icon: "vote", date: "2025-07-20" },
        { name: "Bill Reader", icon: "book", date: "2025-07-21" },
        { name: "News Analyzer", icon: "brain", date: "2025-07-22" },
        { name: "Truth Seeker", icon: "search", date: "2025-07-23" }
      ],
      nextBadge: {
        name: "Petition Creator",
        progress: 67,
        requirement: "Create your first petition"
      },
      engagementStreak: 12,
      impactScore: 847,
      achievements: {
        totalActions: 234,
        correctPredictions: 67,
        factChecksContributed: 12,
        discussionsStarted: 8
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

// Get personalized recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = {
      bills: [
        {
          id: "C-60",
          title: "Climate Finance and Green Infrastructure Act",
          reason: "Based on your interest in environmental policy",
          urgency: "high",
          action: "Vote now - closes in 3 days"
        },
        {
          id: "C-56", 
          title: "Affordable Housing and Groceries Act (Enhanced)",
          reason: "You live in high-cost housing area",
          urgency: "medium",
          action: "Read summary and vote"
        }
      ],
      politicians: [
        {
          name: "Mark Carney",
          riding: "Ottawa Centre",
          reason: "Current Prime Minister - stay informed",
          action: "View recent statements"
        },
        {
          name: "Pierre Poilievre",
          riding: "Carleton",
          reason: "Opposition leader's policy positions",
          action: "Compare voting record"
        }
      ],
      news: [
        {
          title: "Carney's First 100 Days Analysis",
          source: "CBC News",
          reason: "Government transition coverage",
          credibility: 95
        },
        {
          title: "Housing Market Response to New Policies",
          source: "Globe and Mail",
          reason: "Economic policy impact analysis",
          credibility: 92
        }
      ],
      actions: [
        {
          type: "petition",
          title: "Support Universal Pharmacare",
          signatures: 67834,
          target: 100000,
          reason: "Based on your healthcare interests"
        },
        {
          type: "contact",
          title: "Email Your MP About Climate Action",
          reason: "Bill C-60 voting deadline approaching",
          template: "pre-written"
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