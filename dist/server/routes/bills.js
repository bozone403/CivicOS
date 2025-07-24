import { db } from "../db.js";
import { bills } from "../../shared/schema.js";
import { eq, and, desc, sql, count, like, or } from "drizzle-orm";
export function registerBillsRoutes(app) {
    // Get all bills
    app.get('/api/bills', async (req, res) => {
        try {
            const { status, jurisdiction, category, search } = req.query;
            let query = db.select().from(bills);
            const conditions = [];
            if (status) {
                conditions.push(eq(bills.status, status));
            }
            if (jurisdiction) {
                conditions.push(eq(bills.jurisdiction, jurisdiction));
            }
            if (category) {
                conditions.push(eq(bills.category, category));
            }
            if (search) {
                conditions.push(or(like(bills.title, `%${search}%`), like(bills.description, `%${search}%`), like(bills.billNumber, `%${search}%`)));
            }
            if (conditions.length > 0) {
                query = query.where(and(...conditions));
            }
            const billsData = await query.orderBy(desc(bills.createdAt));
            res.json(billsData);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch bills' });
        }
    });
    // Get bill by ID
    app.get('/api/bills/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [bill] = await db
                .select()
                .from(bills)
                .where(eq(bills.id, parseInt(id)));
            if (!bill) {
                return res.status(404).json({ message: 'Bill not found' });
            }
            // Get vote statistics for this bill
            const voteStats = await db.execute(sql `
        SELECT 
          COUNT(*) as total_votes,
          COUNT(CASE WHEN vote_value = 1 THEN 1 END) as yes_votes,
          COUNT(CASE WHEN vote_value = -1 THEN 1 END) as no_votes,
          COUNT(CASE WHEN vote_value = 0 THEN 1 END) as abstentions
        FROM votes 
        WHERE item_id = ${parseInt(id)} AND item_type = 'bill'
      `);
            res.json({
                ...bill,
                voteStats: voteStats.rows[0] || {
                    total_votes: 0,
                    yes_votes: 0,
                    no_votes: 0,
                    abstentions: 0
                }
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch bill' });
        }
    });
    // Search bills
    app.get('/api/bills/search', async (req, res) => {
        try {
            const { q, status, jurisdiction } = req.query;
            if (!q) {
                return res.status(400).json({ message: 'Search query required' });
            }
            const conditions = [
                or(like(bills.title, `%${q}%`), like(bills.description, `%${q}%`), like(bills.billNumber, `%${q}%`), like(bills.sponsor, `%${q}%`))
            ];
            if (status) {
                conditions.push(eq(bills.status, status));
            }
            if (jurisdiction) {
                conditions.push(eq(bills.jurisdiction, jurisdiction));
            }
            const results = await db
                .select()
                .from(bills)
                .where(and(...conditions))
                .orderBy(desc(bills.createdAt))
                .limit(20);
            res.json(results);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to search bills' });
        }
    });
    // Get active bills
    app.get('/api/bills/active', async (req, res) => {
        try {
            const activeBills = await db
                .select()
                .from(bills)
                .where(eq(bills.status, 'Active'))
                .orderBy(desc(bills.createdAt));
            res.json(activeBills);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch active bills' });
        }
    });
    // Get bill statistics
    app.get('/api/bills/stats', async (req, res) => {
        try {
            const [totalBills] = await db
                .select({ count: count() })
                .from(bills);
            const statusStats = await db.execute(sql `
        SELECT status, COUNT(*) as count
        FROM bills 
        GROUP BY status
      `);
            const jurisdictionStats = await db.execute(sql `
        SELECT jurisdiction, COUNT(*) as count
        FROM bills 
        GROUP BY jurisdiction
      `);
            const categoryStats = await db.execute(sql `
        SELECT category, COUNT(*) as count
        FROM bills 
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
      `);
            res.json({
                totalBills: totalBills?.count || 0,
                statusBreakdown: statusStats.rows,
                jurisdictionBreakdown: jurisdictionStats.rows,
                categoryBreakdown: categoryStats.rows
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch bill statistics' });
        }
    });
    // Get recent bills
    app.get('/api/bills/recent', async (req, res) => {
        try {
            const { limit = 10 } = req.query;
            const recentBills = await db
                .select()
                .from(bills)
                .orderBy(desc(bills.createdAt))
                .limit(parseInt(limit));
            res.json(recentBills);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch recent bills' });
        }
    });
    // Get bills by sponsor
    app.get('/api/bills/sponsor/:sponsor', async (req, res) => {
        try {
            const { sponsor } = req.params;
            const sponsorBills = await db
                .select()
                .from(bills)
                .where(eq(bills.sponsor, sponsor))
                .orderBy(desc(bills.createdAt));
            res.json(sponsorBills);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ error: 'Failed to fetch bills by sponsor' });
        }
    });
}
