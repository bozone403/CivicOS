import { db } from "../db.js";
import { politicians } from "../../shared/schema.js";
import { eq, desc, count } from "drizzle-orm";
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
export function registerProcurementRoutes(app) {
    // Get procurement data (placeholder - using politicians for now)
    app.get('/api/procurement', async (req, res) => {
        try {
            // For now, return politicians as procurement data
            const procurementData = await db.select().from(politicians).orderBy(desc(politicians.createdAt));
            res.json({
                procurementData,
                total: procurementData.length,
                message: "Procurement data retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch procurement data' });
        }
    });
    // Get procurement by jurisdiction
    app.get('/api/procurement/:jurisdiction', async (req, res) => {
        try {
            const { jurisdiction } = req.params;
            const procurementData = await db.select()
                .from(politicians)
                .where(eq(politicians.jurisdiction, jurisdiction))
                .orderBy(desc(politicians.createdAt));
            res.json({
                procurementData,
                total: procurementData.length,
                message: `Procurement data for ${jurisdiction} retrieved successfully`
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch procurement data for jurisdiction' });
        }
    });
    // Get procurement statistics
    app.get('/api/procurement/stats', async (req, res) => {
        try {
            const [totalContracts, totalValue, activeContracts] = await Promise.all([
                db.select({ count: count() }).from(politicians),
                db.select({ count: count() }).from(politicians),
                db.select({ count: count() }).from(politicians)
            ]);
            res.json({
                totalContracts: totalContracts[0]?.count || 0,
                totalValue: totalValue[0]?.count || 0,
                activeContracts: activeContracts[0]?.count || 0,
                message: "Procurement statistics retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch procurement statistics' });
        }
    });
}
