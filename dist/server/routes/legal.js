import { db } from "../db.js";
import { legalActs, legalCases, criminalCodeSections, legalSections, charterRights } from "../../shared/schema.js";
import { eq, and, desc, sql, count, like, or } from "drizzle-orm";
export function registerLegalRoutes(app) {
    // Root legal endpoint
    app.get('/api/legal', async (req, res) => {
        try {
            const [acts, cases, sections] = await Promise.all([
                db.select().from(legalActs).orderBy(desc(legalActs.updatedAt)).limit(10),
                db.select().from(legalCases).orderBy(desc(legalCases.createdAt)).limit(5),
                db.select().from(criminalCodeSections).orderBy(criminalCodeSections.sectionNumber).limit(10)
            ]);
            res.json({
                acts: acts,
                cases: cases,
                sections: sections,
                message: "Legal data retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch legal data' });
        }
    });
    // Get all legal acts
    app.get('/api/legal/acts', async (req, res) => {
        try {
            const { jurisdiction, category, search } = req.query;
            let query = db.select().from(legalActs);
            const conditions = [];
            if (jurisdiction) {
                conditions.push(eq(legalActs.jurisdiction, jurisdiction));
            }
            if (category) {
                conditions.push(eq(legalActs.category, category));
            }
            if (search) {
                conditions.push(or(like(legalActs.title, `%${search}%`), like(legalActs.summary, `%${search}%`)));
            }
            if (conditions.length > 0) {
                query = query.where(and(...conditions));
            }
            const acts = await query.orderBy(desc(legalActs.updatedAt));
            res.json(acts);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch legal acts' });
        }
    });
    // Get legal act by ID
    app.get('/api/legal/acts/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [act] = await db
                .select()
                .from(legalActs)
                .where(eq(legalActs.id, parseInt(id)));
            if (!act) {
                return res.status(404).json({ message: 'Legal act not found' });
            }
            // Get related sections
            const sections = await db
                .select()
                .from(legalSections)
                .where(eq(legalSections.actId, parseInt(id)));
            res.json({
                ...act,
                sections
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch legal act' });
        }
    });
    // Get criminal code sections
    app.get('/api/legal/criminal-code', async (req, res) => {
        try {
            const { search, category } = req.query;
            let query = db.select().from(criminalCodeSections);
            const conditions = [];
            if (search) {
                conditions.push(or(like(criminalCodeSections.title, `%${search}%`), like(criminalCodeSections.content, `%${search}%`), like(criminalCodeSections.sectionNumber, `%${search}%`)));
            }
            if (category) {
                conditions.push(eq(criminalCodeSections.category, category));
            }
            if (conditions.length > 0) {
                query = query.where(and(...conditions));
            }
            const sections = await query.orderBy(criminalCodeSections.sectionNumber);
            res.json(sections);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch criminal code' });
        }
    });
    // Get Charter rights
    app.get('/api/legal/charter-rights', async (req, res) => {
        try {
            const rights = await db
                .select()
                .from(charterRights)
                .orderBy(charterRights.sectionNumber);
            res.json(rights);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch Charter rights' });
        }
    });
    // Search legal content
    app.get('/api/legal/search', async (req, res) => {
        try {
            const { q, type } = req.query;
            if (!q) {
                return res.status(400).json({ message: 'Search query required' });
            }
            let results = [];
            if (!type || type === 'acts') {
                const acts = await db
                    .select()
                    .from(legalActs)
                    .where(or(like(legalActs.title, `%${q}%`), like(legalActs.summary, `%${q}%`)))
                    .limit(10);
                results.push(...acts.map(act => ({ ...act, type: 'act' })));
            }
            if (!type || type === 'criminal') {
                const criminal = await db
                    .select()
                    .from(criminalCodeSections)
                    .where(or(like(criminalCodeSections.title, `%${q}%`), like(criminalCodeSections.content, `%${q}%`)))
                    .limit(10);
                results.push(...criminal.map(section => ({ ...section, type: 'criminal' })));
            }
            if (!type || type === 'charter') {
                const charter = await db
                    .select()
                    .from(charterRights)
                    .where(or(like(charterRights.title, `%${q}%`), like(charterRights.description, `%${q}%`)))
                    .limit(10);
                results.push(...charter.map(right => ({ ...right, type: 'charter' })));
            }
            res.json(results);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to search legal content' });
        }
    });
    // Get legal statistics
    app.get('/api/legal/stats', async (req, res) => {
        try {
            const [actsCount] = await db
                .select({ count: count() })
                .from(legalActs);
            const [criminalCount] = await db
                .select({ count: count() })
                .from(criminalCodeSections);
            const [charterCount] = await db
                .select({ count: count() })
                .from(charterRights);
            const jurisdictionStats = await db.execute(sql `
        SELECT jurisdiction, COUNT(*) as count
        FROM legal_acts 
        GROUP BY jurisdiction
      `);
            res.json({
                totalActs: actsCount?.count || 0,
                totalCriminalSections: criminalCount?.count || 0,
                totalCharterRights: charterCount?.count || 0,
                jurisdictionBreakdown: jurisdictionStats.rows
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch legal statistics' });
        }
    });
}
