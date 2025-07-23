import { storage } from "../storage.js";
import { db } from "../db.js";
import { userActivity } from "../../shared/schema.js";
// JWT Auth middleware
function jwtAuth(req, res, next) {
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
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
export function registerVotingRoutes(app) {
    // Get all bills for voting
    app.get('/api/voting/bills', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            // Get active bills from database
            const activeBills = await storage.getActiveBills();
            // Get user's votes for these bills
            const userVotes = await storage.getUserVotes(userId);
            // Combine bills with user's voting status
            const billsWithVotes = activeBills.map(bill => {
                const userVote = userVotes.find(vote => vote.itemId === bill.id && vote.itemType === 'bill');
                return {
                    ...bill,
                    userVote: userVote ? userVote.voteValue : null,
                    hasVoted: !!userVote
                };
            });
            res.json(billsWithVotes);
        }
        catch (error) {
            console.error('Error fetching voting bills:', error);
            res.status(500).json({ error: 'Failed to fetch voting bills' });
        }
    });
    // Submit a vote
    app.post('/api/voting/vote', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { itemId, itemType, vote, verificationId } = req.body;
            if (!itemId || !itemType || !vote || !verificationId) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            // Check if user already voted
            const existingVote = await storage.getVoteByUserAndItem(userId, itemId, itemType);
            if (existingVote) {
                return res.status(409).json({ message: "Already voted on this item" });
            }
            // Create vote with blockchain hash (mock for now)
            const blockHash = `hash_${Date.now()}_${Math.random()}`;
            const newVote = await storage.createVote({
                userId,
                itemId,
                itemType,
                voteValue: vote,
                verificationId,
                blockHash
            });
            // Update user activity
            await db.insert(userActivity).values({
                userId,
                activityType: 'vote',
                entityId: itemId,
                entityType: itemType,
                details: { vote, itemId, itemType },
                createdAt: new Date()
            });
            res.json({
                message: "Vote submitted successfully",
                vote: newVote
            });
        }
        catch (error) {
            console.error('Error submitting vote:', error);
            res.status(500).json({ error: 'Failed to submit vote' });
        }
    });
    // Get vote statistics for a bill
    app.get('/api/voting/stats/:billId', jwtAuth, async (req, res) => {
        try {
            const { billId } = req.params;
            const stats = await storage.getBillVoteStats(parseInt(billId));
            res.json(stats);
        }
        catch (error) {
            console.error('Error fetching vote stats:', error);
            res.status(500).json({ error: 'Failed to fetch vote statistics' });
        }
    });
    // Get user's voting history
    app.get('/api/voting/history', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const userVotes = await storage.getUserVotes(userId);
            // Get bill details for each vote
            const votesWithDetails = await Promise.all(userVotes.map(async (vote) => {
                if (vote.itemType === 'bill') {
                    const bill = await storage.getBill(vote.itemId);
                    return {
                        ...vote,
                        itemDetails: bill
                    };
                }
                return vote;
            }));
            res.json(votesWithDetails);
        }
        catch (error) {
            console.error('Error fetching voting history:', error);
            res.status(500).json({ error: 'Failed to fetch voting history' });
        }
    });
}
