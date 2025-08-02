import { db } from '../db.js';
import { votingItems, votes, bills } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { jwtAuth } from './auth.js';
import { VotingSystem } from '../votingSystem.js';
import { z } from 'zod';
// Input validation schemas
const createVotingItemSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
    type: z.enum(['bill', 'petition', 'referendum', 'poll']),
    options: z.array(z.object({
        id: z.string(),
        text: z.string(),
        description: z.string().optional()
    })).min(2, 'At least 2 options required'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    jurisdiction: z.enum(['federal', 'provincial', 'municipal']),
    requiredQuorum: z.number().min(0).optional(),
    eligibleVoters: z.array(z.string()).default(['all'])
});
const castVoteSchema = z.object({
    optionId: z.string().min(1, 'Option ID is required')
});
export function registerVotingRoutes(app) {
    const votingSystem = new VotingSystem();
    // GET /api/voting/active - Get active voting items
    app.get('/api/voting/active', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }
            const activeItems = await votingSystem.getActiveVotingItems(userId);
            // Add user's vote status to each item
            const itemsWithVoteStatus = await Promise.all(activeItems.map(async (item) => {
                const hasVoted = await votingSystem.hasUserVoted(userId, item.id);
                return {
                    ...item,
                    userHasVoted: hasVoted
                };
            }));
            res.json({
                success: true,
                items: itemsWithVoteStatus,
                total: itemsWithVoteStatus.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch active voting items",
                error: error?.message || String(error)
            });
        }
    });
    // GET /api/voting/:id - Get specific voting item
    app.get('/api/voting/:id', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const itemId = parseInt(req.params.id);
            if (isNaN(itemId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid voting item ID"
                });
            }
            const [item] = await db
                .select()
                .from(votingItems)
                .where(eq(votingItems.id, itemId))
                .limit(1);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: "Voting item not found"
                });
            }
            const hasVoted = await votingSystem.hasUserVoted(userId, itemId);
            const userVote = hasVoted ? await db
                .select()
                .from(votes)
                .where(and(eq(votes.userId, userId), eq(votes.itemId, itemId)))
                .limit(1) : null;
            res.json({
                success: true,
                item: {
                    ...item,
                    options: typeof item.options === 'string' ? JSON.parse(item.options) : item.options,
                    eligibleVoters: typeof item.eligibleVoters === 'string' ? JSON.parse(item.eligibleVoters) : item.eligibleVoters,
                    userHasVoted: hasVoted,
                    userVote: userVote?.[0] || null
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch voting item",
                error: error?.message || String(error)
            });
        }
    });
    // POST /api/voting/:id/vote - Cast a vote
    app.post('/api/voting/:id/vote', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const itemId = parseInt(req.params.id);
            if (isNaN(itemId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid voting item ID"
                });
            }
            // Validate input
            const validationResult = castVoteSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid input data",
                    errors: validationResult.error.errors
                });
            }
            const { optionId } = validationResult.data;
            // Check if user already voted
            const hasVoted = await votingSystem.hasUserVoted(userId, itemId);
            if (hasVoted) {
                return res.status(400).json({
                    success: false,
                    message: "You have already voted on this item"
                });
            }
            // Cast the vote
            await votingSystem.castVote(userId, itemId, optionId);
            res.json({
                success: true,
                message: "Vote cast successfully"
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to cast vote",
                error: error?.message || String(error)
            });
        }
    });
    // GET /api/voting/:id/results - Get voting results
    app.get('/api/voting/:id/results', async (req, res) => {
        try {
            const itemId = parseInt(req.params.id);
            if (isNaN(itemId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid voting item ID"
                });
            }
            const results = await votingSystem.getVotingResults(itemId);
            res.json({
                success: true,
                results
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch voting results",
                error: error?.message || String(error)
            });
        }
    });
    // GET /api/voting/history - Get user's voting history
    app.get('/api/voting/history', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { page = 1, limit = 10 } = req.query;
            const pageNum = Number(page);
            const limitNum = Number(limit);
            const offset = (pageNum - 1) * limitNum;
            const history = await votingSystem.getUserVotingHistory(userId);
            res.json({
                success: true,
                history: history.slice(offset, offset + limitNum),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: history.length,
                    totalPages: Math.ceil(history.length / limitNum)
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch voting history",
                error: error?.message || String(error)
            });
        }
    });
    // POST /api/voting/create - Create new voting item (admin only)
    app.post('/api/voting/create', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            // TODO: Add admin permission check
            // const isAdmin = await PermissionService.isAdmin(userId);
            // if (!isAdmin) {
            //   return res.status(403).json({
            //     success: false,
            //     message: "Admin permission required"
            //   });
            // }
            // Validate input
            const validationResult = createVotingItemSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid input data",
                    errors: validationResult.error.errors
                });
            }
            const votingItem = validationResult.data;
            const itemId = await votingSystem.createVotingItem({
                ...votingItem,
                startDate: new Date(votingItem.startDate),
                endDate: new Date(votingItem.endDate),
                status: 'active' // Add the missing status field
            });
            res.status(201).json({
                success: true,
                message: "Voting item created successfully",
                itemId
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to create voting item",
                error: error?.message || String(error)
            });
        }
    });
    // Get voting item by bill ID
    app.get('/api/voting/bills/:billId', jwtAuth, async (req, res) => {
        try {
            const { billId } = req.params;
            const userId = req.user?.id;
            // Get bill information
            const bill = await db.select().from(bills).where(eq(bills.id, parseInt(billId))).limit(1);
            if (bill.length === 0) {
                return res.status(404).json({ message: "Bill not found" });
            }
            // Get user's vote if authenticated
            let userVote = null;
            if (userId) {
                const vote = await db
                    .select()
                    .from(votes)
                    .where(and(eq(votes.billId, parseInt(billId)), eq(votes.userId, userId)))
                    .limit(1);
                userVote = vote.length > 0 ? vote[0] : null;
            }
            res.json({
                success: true,
                bill: bill[0],
                userVote
            });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch bill voting data", error: error?.message || String(error) });
        }
    });
    // Get electoral candidates
    app.get('/api/voting/electoral/candidates', async (req, res) => {
        try {
            // For now, return empty array (electoral candidates can be implemented later)
            res.json({
                success: true,
                candidates: []
            });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch electoral candidates", error: error?.message || String(error) });
        }
    });
    // Get electoral results
    app.get('/api/voting/electoral/results', async (req, res) => {
        try {
            const { votingItemId } = req.query;
            if (!votingItemId) {
                return res.status(400).json({ message: "Invalid voting item ID" });
            }
            // For now, return empty results (electoral results can be implemented later)
            res.json({
                success: true,
                results: []
            });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch electoral results", error: error?.message || String(error) });
        }
    });
    // Get user's electoral votes
    app.get('/api/voting/electoral/user-votes', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            // For now, return empty array (electoral user votes can be implemented later)
            res.json({
                success: true,
                userVotes: []
            });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch user electoral votes", error: error?.message || String(error) });
        }
    });
}
