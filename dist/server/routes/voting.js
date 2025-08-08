import { db } from '../db.js';
import { bills, votes, electoralCandidates, electoralVotes } from '../../shared/schema.js';
import { jwtAuth } from './auth.js';
import { eq, and, desc, count } from 'drizzle-orm';
import { z } from 'zod';
// Input validation schemas
const createVoteSchema = z.object({
    billId: z.number().positive(),
    vote: z.enum(['yes', 'no', 'abstain']),
    reason: z.string().optional()
});
export function registerVotingRoutes(app) {
    // Get all bills for voting
    app.get("/api/voting/bills", async (req, res) => {
        try {
            const { status = 'active' } = req.query;
            const items = await db.select()
                .from(bills)
                .where(eq(bills.status, status))
                .orderBy(desc(bills.createdAt));
            res.json({
                success: true,
                items: items || []
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch voting bills",
                error: error?.message || String(error)
            });
        }
    });
    // ===== ELECTORAL VOTING ENDPOINTS (to match client expectations) =====
    // Get electoral candidates with basic stats
    app.get("/api/voting/electoral/candidates", async (_req, res) => {
        try {
            const candidates = await db.select().from(electoralCandidates).orderBy(electoralCandidates.name);
            // Aggregate simple totals per candidate
            const withStats = await Promise.all(candidates.map(async (c) => {
                const [{ cnt }] = await db
                    .select({ cnt: count() })
                    .from(electoralVotes)
                    .where(eq(electoralVotes.candidateId, c.id));
                return { ...c, totalVotes: Number(cnt) || 0 };
            }));
            res.json({ success: true, candidates: withStats });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch electoral candidates' });
        }
    });
    // Get aggregate electoral results
    app.get("/api/voting/electoral/results", async (_req, res) => {
        try {
            const all = await db.select().from(electoralVotes);
            const total = all.length;
            res.json({ success: true, results: { total } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch electoral results' });
        }
    });
    // Get current user's electoral votes
    app.get("/api/voting/electoral/user-votes", jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const myVotes = await db.select().from(electoralVotes).where(eq(electoralVotes.userId, userId));
            res.json({ success: true, votes: myVotes });
        }
        catch (error) {
            res.json({ success: true, votes: [] });
        }
    });
    // Cast an electoral vote
    app.post("/api/voting/electoral/vote", jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { candidateId, voteType = 'support', reasoning } = req.body || {};
            if (!candidateId)
                return res.status(400).json({ success: false, message: 'candidateId is required' });
            // ensure candidate exists
            const candidate = await db.select().from(electoralCandidates).where(eq(electoralCandidates.id, Number(candidateId))).limit(1);
            if (candidate.length === 0)
                return res.status(404).json({ success: false, message: 'Candidate not found' });
            const [rec] = await db.insert(electoralVotes).values({
                candidateId: Number(candidateId),
                userId,
                vote: String(voteType),
                voteType: String(voteType),
                reasoning: reasoning || null,
            }).returning();
            res.status(201).json({ success: true, vote: rec });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Failed to cast electoral vote' });
        }
    });
    // Get single bill for voting
    app.get("/api/voting/bills/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const billId = Number(id);
            if (isNaN(billId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid bill ID"
                });
            }
            const item = await db.select()
                .from(bills)
                .where(eq(bills.id, billId))
                .limit(1);
            if (item.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Bill not found"
                });
            }
            res.json({
                success: true,
                item: item[0]
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch bill",
                error: error?.message || String(error)
            });
        }
    });
    // Cast vote on a bill
    app.post("/api/voting/vote", jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }
            const validationResult = createVoteSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid input data",
                    errors: validationResult.error.errors
                });
            }
            const { billId, vote, reason } = validationResult.data;
            // Ensure bill exists
            const billRec = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
            if (billRec.length === 0) {
                return res.status(404).json({ success: false, message: 'Bill not found' });
            }
            // Prevent duplicate vote per user per bill
            const existing = await db
                .select({ id: votes.id })
                .from(votes)
                .where(and(eq(votes.userId, userId), eq(votes.billId, billId)))
                .limit(1);
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: 'User already voted on this bill' });
            }
            const rec = await db
                .insert(votes)
                .values({
                userId,
                billId,
                vote,
                reason: reason || null,
                timestamp: new Date(),
                createdAt: new Date(),
            })
                .returning();
            res.status(201).json({ success: true, message: 'Vote cast successfully', vote: rec[0] });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to cast vote",
                error: error?.message || String(error)
            });
        }
    });
    // Backward-compat: some clients call /api/voting/bills/vote
    app.post("/api/voting/bills/vote", jwtAuth, async (req, res) => {
        try {
            req.url = "/api/voting/vote";
            return app._router.handle(req, res);
        }
        catch (error) {
            res.status(500).json({ success: false, message: "Failed to cast vote" });
        }
    });
    // Get vote statistics for a bill
    app.get("/api/voting/stats/:billId", async (req, res) => {
        try {
            const { billId } = req.params;
            const id = Number(billId);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid bill ID"
                });
            }
            const all = await db.select().from(votes).where(eq(votes.billId, id));
            const total = all.length;
            const yes = all.filter(v => v.vote === 'yes').length;
            const no = all.filter(v => v.vote === 'no').length;
            const abstain = all.filter(v => v.vote === 'abstain').length;
            const stats = { total, yes, no, abstain };
            res.json({
                success: true,
                stats
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch vote statistics",
                error: error?.message || String(error)
            });
        }
    });
    // Get user's votes
    app.get("/api/voting/user-votes", jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }
            const myVotes = await db.select().from(votes).where(eq(votes.userId, userId));
            res.json({ success: true, votes: myVotes });
        }
        catch (error) {
            // Graceful fallback rather than 500 to avoid breaking UI
            res.json({ success: true, votes: [] });
        }
    });
    // Get voting history
    app.get("/api/voting/history", async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const pageNum = Number(page);
            const limitNum = Number(limit);
            const offset = (pageNum - 1) * limitNum;
            // For now, return bills as voting history (votes table needs to be created)
            const billItems = await db.select()
                .from(bills)
                .orderBy(desc(bills.createdAt))
                .limit(limitNum)
                .offset(offset);
            res.json({
                success: true,
                items: billItems,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: billItems.length,
                    totalPages: Math.ceil(billItems.length / limitNum)
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
}
