import express from 'express';
import { db } from '../db.js';
import { bills, votes, electoralCandidates, electoralVotes, users } from '../../shared/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { aiService } from '../utils/aiService.js';
import { ElectionDataService } from '../electionDataService.js';

const router = express.Router();

// Get all bills for voting
router.get('/bills', async (req, res) => {
  try {
    const allBills = await db.select().from(bills).orderBy(desc(bills.createdAt));
    res.json(allBills);
  } catch (error) {
    // console.error removed for production
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Vote on a bill
router.post('/bills/vote', async (req, res) => {
  try {
    const { billId, vote } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!billId || !vote) {
      return res.status(400).json({ error: 'Bill ID and vote are required' });
    }

    // Check if user already voted on this bill
    const existingVote = await db.select().from(votes)
      .where(and(
        eq(votes.userId, userId),
        eq(votes.itemId, billId),
        eq(votes.itemType, 'bill')
      ));

    if (existingVote.length > 0) {
      return res.status(400).json({ error: 'You have already voted on this bill' });
    }

    // Create verification ID and block hash
    const verificationId = `vote_${userId}_${billId}_${Date.now()}`;
    const blockHash = `hash_${verificationId}_${Math.random().toString(36)}`;

    // Insert vote
    await db.insert(votes).values({
      userId,
      itemId: billId,
      itemType: 'bill',
      voteValue: vote === 'yes' ? 1 : vote === 'no' ? -1 : 0,
      reasoning: req.body.reasoning || null,
      verificationId,
      blockHash,
      isVerified: true
    });

    res.json({ success: true, message: 'Vote recorded successfully' });
  } catch (error) {
    // console.error removed for production
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Get electoral candidates
router.get('/electoral/candidates', async (req, res) => {
  try {
    // Populate candidates if they don't exist
    await ElectionDataService.populateElectoralCandidates();
    
    // Get candidates with voting statistics
    const candidates = await ElectionDataService.getElectoralCandidatesWithStats();
    res.json(candidates);
  } catch (error) {
    // console.error removed for production
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Get electoral voting results
router.get('/electoral/results', async (req, res) => {
  try {
    const results = await ElectionDataService.getElectoralResults();
    res.json(results);
  } catch (error) {
    // console.error removed for production
    res.status(500).json({ error: 'Failed to fetch electoral results' });
  }
});

// Get electoral voting trends
router.get('/electoral/trends', async (req, res) => {
  try {
    const trends = await ElectionDataService.getElectoralTrends();
    res.json(trends);
  } catch (error) {
    // console.error removed for production
    res.status(500).json({ error: 'Failed to fetch electoral trends' });
  }
});

// Get user's electoral voting history
router.get('/electoral/history', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const history = await ElectionDataService.getUserElectoralHistory(userId);
    res.json(history);
  } catch (error) {
    // console.error removed for production
    res.status(500).json({ error: 'Failed to fetch user electoral history' });
  }
});

// Vote on electoral candidate
router.post('/electoral/vote', async (req, res) => {
  try {
    const { candidateId, voteType, reasoning } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!candidateId || !voteType) {
      return res.status(400).json({ error: 'Candidate ID and vote type are required' });
    }

    // Check if user already voted on this candidate
    const existingVote = await db.select().from(electoralVotes)
      .where(and(
        eq(electoralVotes.userId, userId),
        eq(electoralVotes.candidateId, candidateId)
      ));

    if (existingVote.length > 0) {
      return res.status(400).json({ error: 'You have already voted on this candidate' });
    }

    // Create verification ID and block hash
    const verificationId = `electoral_${userId}_${candidateId}_${Date.now()}`;
    const blockHash = `hash_${verificationId}_${Math.random().toString(36)}`;

    // Insert electoral vote
    await db.insert(electoralVotes).values({
      userId,
      candidateId,
      voteType,
      reasoning: reasoning || null,
      verificationId,
      blockHash,
      isVerified: true
    });

    res.json({ success: true, message: 'Electoral vote recorded successfully' });
  } catch (error) {
    // console.error removed for production
    res.status(500).json({ error: 'Failed to record electoral vote' });
  }
});

// Get electoral voting results
router.get('/electoral/results', async (req, res) => {
  try {
    const results = await db.execute(sql`
      SELECT 
        ec.id,
        ec.name,
        ec.party,
        ec.position,
        COUNT(ev.id) as total_votes,
        COUNT(CASE WHEN ev.vote_type = 'preference' THEN 1 END) as preference_votes,
        COUNT(CASE WHEN ev.vote_type = 'support' THEN 1 END) as support_votes,
        COUNT(CASE WHEN ev.vote_type = 'oppose' THEN 1 END) as oppose_votes,
        ec.trust_score
      FROM electoral_candidates ec
      LEFT JOIN electoral_votes ev ON ec.id = ev.candidate_id
      GROUP BY ec.id, ec.name, ec.party, ec.position, ec.trust_score
      ORDER BY total_votes DESC, ec.name
    `);

    res.json(results.rows);
  } catch (error) {
    // console.error removed for production
    res.status(500).json({ error: 'Failed to fetch electoral results' });
  }
});

// Get user's electoral votes
router.get('/electoral/user-votes', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userVotes = await db.select({
      candidateId: electoralVotes.candidateId,
      voteType: electoralVotes.voteType,
      reasoning: electoralVotes.reasoning,
      timestamp: electoralVotes.timestamp
    }).from(electoralVotes)
    .where(eq(electoralVotes.userId, userId))
    .orderBy(desc(electoralVotes.timestamp));

    res.json(userVotes);
  } catch (error) {
    // console.error removed for production
    res.status(500).json({ error: 'Failed to fetch user votes' });
  }
});

// Initialize electoral candidates (run once)
router.post('/electoral/initialize', async (req, res) => {
  try {
    const candidates = [
      {
        name: "Mark Carney",
        party: "Liberal Party",
        position: "Prime Minister of Canada",
        jurisdiction: "Federal",
        bio: "Former Bank of Canada Governor and Bank of England Governor. Appointed Prime Minister in 2025, bringing significant financial expertise to government leadership.",
        keyPolicies: ["Economic stability", "Climate action", "Financial regulation", "International cooperation"],
        trustScore: "75.00"
      },
      {
        name: "Pierre Poilievre",
        party: "Conservative Party",
        position: "Leader of the Opposition",
        jurisdiction: "Federal",
        bio: "Conservative Party leader known for his focus on economic issues, inflation concerns, and cryptocurrency advocacy.",
        keyPolicies: ["Economic freedom", "Reduced government spending", "Digital currency", "Common sense policies"],
        trustScore: "65.00"
      },
      {
        name: "Yves-François Blanchet",
        party: "Bloc Québécois",
        position: "Party Leader",
        jurisdiction: "Federal",
        bio: "Leader of the Bloc Québécois, advocating for Quebec's interests and sovereignty within the Canadian federation.",
        keyPolicies: ["Quebec sovereignty", "French language protection", "Provincial autonomy", "Cultural preservation"],
        trustScore: "70.00"
      },
      {
        name: "Don Davies",
        party: "New Democratic Party",
        position: "Interim Leader",
        jurisdiction: "Federal",
        bio: "Interim leader of the NDP, continuing the party's tradition of progressive policies and social justice advocacy.",
        keyPolicies: ["Universal healthcare", "Social justice", "Climate action", "Workers' rights"],
        trustScore: "72.00"
      },
      {
        name: "Elizabeth May",
        party: "Green Party",
        position: "Party Leader",
        jurisdiction: "Federal",
        bio: "Long-time leader of the Green Party, environmental advocate, and former MP for Saanich—Gulf Islands.",
        keyPolicies: ["Climate emergency", "Environmental protection", "Social justice", "Electoral reform"],
        trustScore: "78.00"
      }
    ];

    // Check if candidates already exist
    const existingCandidates = await db.select().from(electoralCandidates);
    if (existingCandidates.length > 0) {
      return res.json({ message: 'Candidates already initialized' });
    }

    // Insert candidates
    for (const candidate of candidates) {
      await db.insert(electoralCandidates).values(candidate);
    }

    res.json({ success: true, message: 'Electoral candidates initialized successfully' });
  } catch (error) {
    // console.error removed for production
    res.status(500).json({ error: 'Failed to initialize candidates' });
  }
});

export default router;

export function registerVotingRoutes(app: express.Application) {
  app.use('/api/voting', router);
} 