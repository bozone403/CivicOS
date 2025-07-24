import { db } from "../db.js";
import { elections, candidates, electoralDistricts } from "../../shared/schema.js";
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
export function registerElectionsRoutes(app) {
    // Get all elections
    app.get('/api/elections', async (req, res) => {
        try {
            const allElections = await db.select().from(elections).orderBy(desc(elections.electionDate));
            res.json({
                elections: allElections,
                total: allElections.length,
                message: "Elections data retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch elections data' });
        }
    });
    // Get election by ID
    app.get('/api/elections/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const election = await db.select().from(elections).where(eq(elections.id, parseInt(id)));
            if (election.length === 0) {
                return res.status(404).json({ message: "Election not found" });
            }
            res.json(election[0]);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch election data' });
        }
    });
    // Get candidates for an election
    app.get('/api/elections/:id/candidates', async (req, res) => {
        try {
            const { id } = req.params;
            const candidateList = await db.select().from(candidates).where(eq(candidates.electionId, parseInt(id)));
            res.json({
                candidates: candidateList,
                total: candidateList.length,
                message: "Candidates retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch candidates data' });
        }
    });
    // Get electoral districts
    app.get('/api/elections/districts', async (req, res) => {
        try {
            const districts = await db.select().from(electoralDistricts);
            res.json({
                districts,
                total: districts.length,
                message: "Electoral districts retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch electoral districts' });
        }
    });
    // Get election statistics
    app.get('/api/elections/stats', async (req, res) => {
        try {
            const [totalElections, upcomingElections, pastElections] = await Promise.all([
                db.select({ count: count() }).from(elections),
                db.select({ count: count() }).from(elections).where(sql `${elections.electionDate} > NOW()`),
                db.select({ count: count() }).from(elections).where(sql `${elections.electionDate} <= NOW()`)
            ]);
            res.json({
                totalElections: totalElections[0]?.count || 0,
                upcomingElections: upcomingElections[0]?.count || 0,
                pastElections: pastElections[0]?.count || 0,
                message: "Election statistics retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch election statistics' });
        }
    });
}
