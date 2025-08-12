import { db } from "../db.js";
import { politicians, politicianStatements, politicianPositions, campaignFinance, politicianTruthTracking, billRollcalls, billRollcallRecords } from "../../shared/schema.js";
import { computeTrustScore } from "../utils/trustScore.js";
import { eq, and, desc, sql, count, like, or } from "drizzle-orm";
import { ResponseFormatter } from "../utils/responseFormatter.js";
import jwt from "jsonwebtoken";
import { ParliamentAPIService } from "../parliamentAPI.js";
import { syncIncumbentPoliticiansFromParliament } from '../utils/politicianSync.js';
// JWT Auth middleware
function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return ResponseFormatter.unauthorized(res, "Missing or invalid token");
    }
    try {
        const token = authHeader.split(" ")[1];
        const secret = process.env.SESSION_SECRET;
        if (!secret) {
            return ResponseFormatter.unauthorized(res, "Server configuration error");
        }
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        return ResponseFormatter.unauthorized(res, "Invalid or expired token");
    }
}
export function registerPoliticiansRoutes(app) {
    const parliamentAPI = new ParliamentAPIService();
    // Get all politicians (strict DB-first; on-demand refresh if empty; no synthetic fallback)
    app.get('/api/politicians', async (req, res) => {
        const startTime = Date.now();
        try {
            const { level, jurisdiction, party, search, location } = req.query;
            // Strict DB-first
            const conditions = [];
            if (level)
                conditions.push(eq(politicians.level, level));
            if (jurisdiction)
                conditions.push(eq(politicians.jurisdiction, jurisdiction));
            if (party)
                conditions.push(eq(politicians.party, party));
            if (search) {
                conditions.push(or(like(politicians.name, `%${search}%`), like(politicians.position, `%${search}%`), like(politicians.constituency, `%${search}%`)));
            }
            if (location) {
                const q = String(location);
                conditions.push(or(like(politicians.jurisdiction, `%${q}%`), like(politicians.constituency, `%${q}%`)));
            }
            let politiciansData = conditions.length
                ? await db.select().from(politicians).where(and(...conditions)).orderBy(desc(politicians.updatedAt))
                : await db.select().from(politicians).orderBy(desc(politicians.updatedAt));
            // If empty, trigger on-demand sync and re-read
            if (!politiciansData || politiciansData.length === 0) {
                try {
                    await syncIncumbentPoliticiansFromParliament();
                }
                catch { }
                politiciansData = await db.select().from(politicians).orderBy(desc(politicians.updatedAt));
            }
            const processingTime = Date.now() - startTime;
            return ResponseFormatter.success(res, politiciansData, "Politicians data retrieved successfully", 200, politiciansData.length, undefined, processingTime);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch politicians: ${error.message}`);
        }
    });
    // Get politician by ID
    app.get('/api/politicians/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [politician] = await db
                .select()
                .from(politicians)
                .where(eq(politicians.id, parseInt(id)));
            if (!politician) {
                return res.status(404).json({ message: 'Politician not found' });
            }
            // Get additional data
            const [statements] = await db
                .select({ count: count() })
                .from(politicianStatements)
                .where(eq(politicianStatements.politicianId, parseInt(id)));
            const [positions] = await db
                .select({ count: count() })
                .from(politicianPositions)
                .where(eq(politicianPositions.politicianId, parseInt(id)));
            const [finance] = await db
                .select()
                .from(campaignFinance)
                .where(eq(campaignFinance.politicianId, parseInt(id)));
            const [truthTracking] = await db
                .select()
                .from(politicianTruthTracking)
                .where(eq(politicianTruthTracking.politicianId, parseInt(id)));
            // Compute trust score live if missing
            const computedTrust = await computeTrustScore(parseInt(id)).catch(() => null);
            if (computedTrust !== null) {
                await db.update(politicians).set({ trustScore: String(computedTrust), updatedAt: new Date() }).where(eq(politicians.id, parseInt(id)));
            }
            res.json({
                ...politician,
                trustScore: computedTrust ?? politician.trustScore,
                stats: {
                    statements: statements?.count || 0,
                    positions: positions?.count || 0
                },
                campaignFinance: finance || null,
                truthTracking: truthTracking || null
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch politician' });
        }
    });
    // Get politician statements
    app.get('/api/politicians/:id/statements', async (req, res) => {
        try {
            const { id } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const statements = await db
                .select()
                .from(politicianStatements)
                .where(eq(politicianStatements.politicianId, parseInt(id)))
                .orderBy(desc(politicianStatements.dateCreated))
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            res.json(statements);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch statements' });
        }
    });
    // Get politician positions
    app.get('/api/politicians/:id/positions', async (req, res) => {
        try {
            const { id } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const positions = await db
                .select()
                .from(politicianPositions)
                .where(eq(politicianPositions.politicianId, parseInt(id)))
                .orderBy(desc(politicianPositions.dateStated))
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            res.json(positions);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch positions' });
        }
    });
    // Get politician roll-call votes (by mapped parliament member id if available)
    app.get('/api/politicians/:id/votes', async (req, res) => {
        try {
            const { id } = req.params;
            const pid = parseInt(id);
            const [pol] = await db.select().from(politicians).where(eq(politicians.id, pid));
            if (!pol)
                return res.status(404).json({ message: 'Politician not found' });
            const pmId = pol.parliamentMemberId;
            if (!pmId)
                return res.json({ votes: [] });
            // Join rollcall records by member id
            const recs = await db
                .select()
                .from(billRollcallRecords)
                .where(eq(billRollcallRecords.memberId, pmId));
            if (!recs || recs.length === 0)
                return res.json({ votes: [] });
            // Load related rollcalls for context
            const rcIds = Array.from(new Set(recs.map(r => r.rollcallId))).filter(Boolean);
            const rcs = rcIds.length
                ? await db.select().from(billRollcalls).where(billRollcalls.id.in(rcIds))
                : [];
            const byId = new Map();
            for (const rc of rcs)
                byId.set(rc.id, rc);
            const out = recs.map((r) => ({
                rollcallId: r.rollcallId,
                decision: r.decision,
                party: r.party,
                billNumber: byId.get(r.rollcallId)?.billNumber,
                voteNumber: byId.get(r.rollcallId)?.voteNumber,
                result: byId.get(r.rollcallId)?.result,
                dateTime: byId.get(r.rollcallId)?.dateTime,
            }));
            res.json({ votes: out });
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch politician votes' });
        }
    });
    // Get campaign finance data
    app.get('/api/politicians/:id/finance', async (req, res) => {
        try {
            const { id } = req.params;
            const finance = await db
                .select()
                .from(campaignFinance)
                .where(eq(campaignFinance.politicianId, parseInt(id)))
                .orderBy(desc(campaignFinance.reportingPeriod));
            res.json(finance);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch campaign finance' });
        }
    });
    // Get politician truth tracking
    app.get('/api/politicians/:id/truth-tracking', async (req, res) => {
        try {
            const { id } = req.params;
            const [truthTracking] = await db
                .select()
                .from(politicianTruthTracking)
                .where(eq(politicianTruthTracking.politicianId, parseInt(id)));
            res.json(truthTracking || {});
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch truth tracking' });
        }
    });
    // Search politicians
    app.get('/api/politicians/search', async (req, res) => {
        try {
            const { q, level, jurisdiction, party } = req.query;
            if (!q) {
                return res.status(400).json({ message: 'Search query required' });
            }
            const conditions = [
                or(like(politicians.name, `%${q}%`), like(politicians.position, `%${q}%`), like(politicians.constituency, `%${q}%`), like(politicians.party, `%${q}%`))
            ];
            if (level) {
                conditions.push(eq(politicians.level, level));
            }
            if (jurisdiction) {
                conditions.push(eq(politicians.jurisdiction, jurisdiction));
            }
            if (party) {
                conditions.push(eq(politicians.party, party));
            }
            const results = await db
                .select()
                .from(politicians)
                .where(and(...conditions))
                .orderBy(desc(politicians.updatedAt))
                .limit(20);
            res.json(results);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to search politicians' });
        }
    });
    // Get politician statistics
    app.get('/api/politicians/stats', async (req, res) => {
        try {
            const stats = await db.execute(sql `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN level = 'Federal' THEN 1 END) as federal,
          COUNT(CASE WHEN level = 'Provincial' THEN 1 END) as provincial,
          COUNT(CASE WHEN level = 'Municipal' THEN 1 END) as municipal,
          COUNT(DISTINCT party) as parties,
          COUNT(DISTINCT jurisdiction) as jurisdictions,
          AVG(CAST(trust_score AS DECIMAL)) as avgTrustScore
        FROM politicians
      `);
            const partyStats = await db.execute(sql `
        SELECT 
          party,
          COUNT(*) as count,
          AVG(CAST(trust_score AS DECIMAL)) as avgTrustScore
        FROM politicians 
        WHERE party IS NOT NULL
        GROUP BY party 
        ORDER BY count DESC
        LIMIT 10
      `);
            const jurisdictionStats = await db.execute(sql `
        SELECT 
          jurisdiction,
          COUNT(*) as count
        FROM politicians 
        GROUP BY jurisdiction 
        ORDER BY count DESC
      `);
            res.json({
                overview: stats.rows[0],
                partyBreakdown: partyStats.rows,
                jurisdictionBreakdown: jurisdictionStats.rows
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    });
    // Add politician statement (protected)
    app.post('/api/politicians/:id/statements', jwtAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { statement, context, source, dateMade } = req.body;
            if (!statement) {
                return res.status(400).json({ message: 'Statement text required' });
            }
            const [newStatement] = await db.insert(politicianStatements).values({
                politicianId: parseInt(id),
                statement,
                context: context || 'general',
                source: source || 'user_submitted',
                date: new Date()
            }).returning();
            res.json(newStatement);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to add statement' });
        }
    });
    // Update politician (protected)
    app.put('/api/politicians/:id', jwtAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            const [updatedPolitician] = await db
                .update(politicians)
                .set({
                ...updates,
                updatedAt: new Date()
            })
                .where(eq(politicians.id, parseInt(id)))
                .returning();
            if (!updatedPolitician) {
                return res.status(404).json({ message: 'Politician not found' });
            }
            res.json(updatedPolitician);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to update politician' });
        }
    });
}
