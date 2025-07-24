import { db } from "../db.js";
import { campaignFinance } from "../../shared/schema.js";
import { eq, desc, sql, count } from "drizzle-orm";
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
export function registerFinanceRoutes(app) {
    // Get all campaign finance data
    app.get('/api/finance', async (req, res) => {
        try {
            const financeData = await db.select().from(campaignFinance).orderBy(desc(campaignFinance.createdAt));
            res.json({
                financeData,
                total: financeData.length,
                message: "Campaign finance data retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch campaign finance data' });
        }
    });
    // Get finance data for specific politician
    app.get('/api/finance/politician/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const financeData = await db.select()
                .from(campaignFinance)
                .where(eq(campaignFinance.politicianId, parseInt(id)))
                .orderBy(desc(campaignFinance.createdAt));
            res.json({
                financeData,
                total: financeData.length,
                message: "Politician finance data retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch politician finance data' });
        }
    });
    // Get finance statistics
    app.get('/api/finance/stats', async (req, res) => {
        try {
            const [totalRaised, totalSpent, totalPoliticians] = await Promise.all([
                db.select({ sum: sql `SUM(${campaignFinance.totalRaised})` }).from(campaignFinance),
                db.select({ sum: sql `SUM(${campaignFinance.expenditures})` }).from(campaignFinance),
                db.select({ count: count() }).from(campaignFinance)
            ]);
            res.json({
                totalRaised: totalRaised[0]?.sum || 0,
                totalSpent: totalSpent[0]?.sum || 0,
                totalPoliticians: totalPoliticians[0]?.count || 0,
                message: "Finance statistics retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch finance statistics' });
        }
    });
    // Get top donors
    app.get('/api/finance/top-donors', async (req, res) => {
        try {
            const topDonors = await db.select()
                .from(campaignFinance)
                .where(sql `${campaignFinance.largestDonor} IS NOT NULL`)
                .orderBy(desc(campaignFinance.individualDonations))
                .limit(10);
            res.json({
                topDonors,
                total: topDonors.length,
                message: "Top donors retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch top donors' });
        }
    });
    // Get suspicious transactions
    app.get('/api/finance/suspicious', async (req, res) => {
        try {
            const suspicious = await db.select()
                .from(campaignFinance)
                .where(sql `${campaignFinance.suspiciousTransactions} > 0`)
                .orderBy(desc(campaignFinance.suspiciousTransactions));
            res.json({
                suspicious,
                total: suspicious.length,
                message: "Suspicious transactions retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch suspicious transactions' });
        }
    });
}
