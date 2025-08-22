import { db } from '../db.js';
import { bills, votes, electoralCandidates, electoralVotes, billRollcalls, billRollcallRecords } from '../../shared/schema.js';
import { jwtAuth } from './auth.js';
import { eq, and, desc, count } from 'drizzle-orm';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import * as schema from '../../shared/schema.js';
// Input validation schemas
const createVoteSchema = z.object({
    billId: z.number().positive(),
    vote: z.enum(['yes', 'no', 'abstain']),
    reason: z.string().optional()
});
export function registerVotingRoutes(app) {
    // ===== GENERAL VOTING ENDPOINTS (for VotingButtons component) =====
    // Get vote data for a specific target (used by VotingButtons)
    app.get("/api/vote/:targetType/:targetId", async (req, res) => {
        try {
            const { targetType, targetId } = req.params;
            const userId = req.user?.id;
            if (!targetId || isNaN(Number(targetId))) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid target ID"
                });
            }
            // Get vote counts and user's vote
            let upvotes = 0;
            let downvotes = 0;
            let userVote = null;
            if (targetType === 'bill') {
                // For bills, use the existing votes table
                const voteCounts = await db.execute(sql `
          SELECT 
            COUNT(CASE WHEN vote = 'yes' THEN 1 END) as upvotes,
            COUNT(CASE WHEN vote = 'no' THEN 1 END) as downvotes
          FROM votes 
          WHERE bill_id = ${Number(targetId)}
        `);
                if (voteCounts.rows.length > 0) {
                    upvotes = Number(voteCounts.rows[0].upvotes) || 0;
                    downvotes = Number(voteCounts.rows[0].downvotes) || 0;
                }
                // Get user's vote if authenticated
                if (userId) {
                    const userVoteResult = await db.execute(sql `
            SELECT vote FROM votes 
            WHERE user_id = ${userId} AND bill_id = ${Number(targetId)}
            LIMIT 1
          `);
                    if (userVoteResult.rows.length > 0) {
                        userVote = userVoteResult.rows[0].vote === 'yes' ? 'upvote' : 'downvote';
                    }
                }
            }
            else if (targetType === 'post') {
                // For social posts, use social likes
                const likeCounts = await db.execute(sql `
          SELECT 
            COUNT(CASE WHEN reaction = 'like' THEN 1 END) as upvotes,
            COUNT(CASE WHEN reaction = 'dislike' THEN 1 END) as downvotes
          FROM social_likes 
          WHERE post_id = ${Number(targetId)}
        `);
                if (likeCounts.rows.length > 0) {
                    upvotes = Number(likeCounts.rows[0].upvotes) || 0;
                    downvotes = Number(likeCounts.rows[0].downvotes) || 0;
                }
                // Get user's reaction if authenticated
                if (userId) {
                    const userReaction = await db.execute(sql `
            SELECT reaction FROM social_likes 
            WHERE user_id = ${userId} AND post_id = ${Number(targetId)}
            LIMIT 1
          `);
                    if (userReaction.rows.length > 0) {
                        userVote = userReaction.rows[0].reaction === 'like' ? 'upvote' : 'downvote';
                    }
                }
            }
            else if (targetType === 'comment') {
                // For comments, use comment likes
                const likeCounts = await db.execute(sql `
          SELECT 
            COUNT(CASE WHEN reaction = 'like' THEN 1 END) as upvotes,
            COUNT(CASE WHEN reaction = 'dislike' THEN 1 END) as downvotes
          FROM comment_likes 
          WHERE comment_id = ${Number(targetId)}
        `);
                if (likeCounts.rows.length > 0) {
                    upvotes = Number(likeCounts.rows[0].upvotes) || 0;
                    downvotes = Number(likeCounts.rows[0].downvotes) || 0;
                }
                // Get user's reaction if authenticated
                if (userId) {
                    const userReaction = await db.execute(sql `
            SELECT reaction FROM comment_likes 
            WHERE user_id = ${userId} AND comment_id = ${Number(targetId)}
            LIMIT 1
          `);
                    if (userReaction.rows.length > 0) {
                        userVote = userReaction.rows[0].reaction === 'like' ? 'upvote' : 'downvote';
                    }
                }
            }
            else if (targetType === 'politician') {
                // For politicians, use trust tracking (positive/negative)
                const trustData = await db.execute(sql `
          SELECT 
            COUNT(CASE WHEN trust_change > 0 THEN 1 END) as upvotes,
            COUNT(CASE WHEN trust_change < 0 THEN 1 END) as downvotes
          FROM politician_truth_tracking 
          WHERE politician_id = ${Number(targetId)}
        `);
                if (trustData.rows.length > 0) {
                    upvotes = Number(trustData.rows[0].upvotes) || 0;
                    downvotes = Number(trustData.rows[0].downvotes) || 0;
                }
            }
            const totalScore = upvotes - downvotes;
            res.json({
                success: true,
                upvotes,
                downvotes,
                totalScore,
                userVote,
                targetType,
                targetId: Number(targetId)
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch vote data",
                error: error?.message || String(error)
            });
        }
    });
    // Cast a general vote (used by VotingButtons)
    app.post("/api/vote", jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { targetType, targetId, voteType } = req.body;
            if (!targetId || !targetType || !voteType) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: targetId, targetType, voteType"
                });
            }
            if (!['upvote', 'downvote'].includes(voteType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid vote type. Must be 'upvote' or 'downvote'"
                });
            }
            let success = false;
            let message = '';
            if (targetType === 'bill') {
                // Convert upvote/downvote to yes/no for bills
                const billVote = voteType === 'upvote' ? 'yes' : 'no';
                // Check if user already voted
                const existingVote = await db.execute(sql `
          SELECT id FROM votes 
          WHERE user_id = ${userId} AND bill_id = ${Number(targetId)}
        `);
                if (existingVote.rows.length > 0) {
                    // Update existing vote
                    await db.execute(sql `
            UPDATE votes SET vote = ${billVote}, updated_at = NOW()
            WHERE user_id = ${userId} AND bill_id = ${Number(targetId)}
          `);
                }
                else {
                    // Create new vote
                    await db.insert(votes).values({
                        userId,
                        billId: Number(targetId),
                        vote: billVote,
                        timestamp: new Date(),
                        createdAt: new Date(),
                    });
                }
                success = true;
                message = 'Bill vote recorded successfully';
            }
            else if (targetType === 'post') {
                // Handle social post reactions
                const reaction = voteType === 'upvote' ? 'like' : 'dislike';
                // Check if user already reacted
                const existingReaction = await db.execute(sql `
          SELECT id FROM social_likes 
          WHERE user_id = ${userId} AND post_id = ${Number(targetId)}
        `);
                if (existingReaction.rows.length > 0) {
                    // Update existing reaction
                    await db.execute(sql `
            UPDATE social_likes SET reaction = ${reaction}, updated_at = NOW()
            WHERE user_id = ${userId} AND post_id = ${Number(targetId)}
          `);
                }
                else {
                    // Create new reaction
                    await db.insert(schema.socialLikes).values({
                        userId,
                        postId: Number(targetId),
                        reaction,
                        createdAt: new Date(),
                    });
                }
                success = true;
                message = 'Post reaction recorded successfully';
            }
            else if (targetType === 'comment') {
                // Handle comment reactions
                const reaction = voteType === 'upvote' ? 'like' : 'dislike';
                // Check if user already reacted
                const existingReaction = await db.execute(sql `
          SELECT id FROM comment_likes 
          WHERE user_id = ${userId} AND comment_id = ${Number(targetId)}
        `);
                if (existingReaction.rows.length > 0) {
                    // Update existing reaction
                    await db.execute(sql `
            UPDATE comment_likes SET reaction = ${reaction}, updated_at = NOW()
            WHERE user_id = ${userId} AND comment_id = ${Number(targetId)}
          `);
                }
                else {
                    // Create new reaction
                    await db.insert(schema.commentLikes).values({
                        userId,
                        commentId: Number(targetId),
                        reaction,
                        createdAt: new Date(),
                    });
                }
                success = true;
                message = 'Comment reaction recorded successfully';
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: `Unsupported target type: ${targetType}`
                });
            }
            res.json({
                success,
                message,
                targetType,
                targetId: Number(targetId),
                voteType
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to process vote",
                error: error?.message || String(error)
            });
        }
    });
    // ===== EXISTING BILL VOTING ENDPOINTS =====
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
            const withStats = await Promise.all(candidates.map(async (c) => {
                try {
                    const [{ cnt }] = await db
                        .select({ cnt: count() })
                        .from(electoralVotes)
                        .where(eq(electoralVotes.candidateId, c.id));
                    return { ...c, totalVotes: Number(cnt) || 0 };
                }
                catch {
                    return { ...c, totalVotes: 0 };
                }
            }));
            res.json({ success: true, candidates: withStats });
        }
        catch (error) {
            res.json({ success: true, candidates: [] });
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
            res.json({ success: true, results: { total: 0 } });
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
    // Get roll call for a bill (grouped)
    app.get('/api/voting/bills/:id/rollcall', async (req, res) => {
        try {
            const billId = Number(req.params.id);
            if (isNaN(billId))
                return res.status(400).json({ success: false, message: 'Invalid bill ID' });
            const [billRow] = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
            if (!billRow)
                return res.status(404).json({ success: false, message: 'Bill not found' });
            // Simplified: find latest rollcall by billNumber if present
            const number = billRow.billNumber || billRow.title;
            const rcs = await db.select().from(billRollcalls).where(eq(billRollcalls.billNumber, String(number))).limit(1);
            if (rcs.length === 0)
                return res.json({ success: true, rollcall: null, totals: { yes: 0, no: 0, abstain: 0, paired: 0 } });
            const rc = rcs[0];
            const recs = await db.select().from(billRollcallRecords).where(eq(billRollcallRecords.rollcallId, rc.id));
            const totals = { yes: 0, no: 0, abstain: 0, paired: 0 };
            for (const rec of recs) {
                const d = String(rec.decision || '').toLowerCase();
                if (d.includes('yea') || d === 'yes')
                    totals.yes++;
                else if (d.includes('nay') || d === 'no')
                    totals.no++;
                else if (d.includes('abstain'))
                    totals.abstain++;
                else if (d.includes('pair'))
                    totals.paired++;
            }
            res.json({ success: true, rollcall: rc, totals, records: recs });
        }
        catch {
            res.status(500).json({ success: false, message: 'Failed to fetch roll call' });
        }
    });
}
