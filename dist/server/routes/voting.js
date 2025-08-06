import { db } from '../db.js';
import { bills } from '../../shared/schema.js';
import { jwtAuth } from './auth.js';
import { eq, desc } from 'drizzle-orm';
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
            // For now, just return success (votes table needs to be created)
            res.status(201).json({
                success: true,
                message: "Vote cast successfully",
                data: {
                    userId,
                    billId,
                    vote,
                    reason,
                    timestamp: new Date()
                }
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
            // For now, return mock statistics (votes table needs to be created)
            const stats = {
                total: 0,
                yes: 0,
                no: 0,
                abstain: 0
            };
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
            // For now, return empty array (votes table needs to be created)
            res.json({
                success: true,
                votes: []
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch user votes",
                error: error?.message || String(error)
            });
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
