import { Express, Request, Response } from "express";
import { storage } from "../storage.js";
import { db } from "../db.js";
import { politicians, politicianStatements, politicianPositions, campaignFinance, politicianTruthTracking } from "../../shared/schema.js";
import { eq, and, desc, sql, count, like, or, inArray } from "drizzle-orm";

// JWT Auth middleware
function jwtAuth(req: any, res: any, next: any) {
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
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function registerPoliticiansRoutes(app: Express) {
  // Get all politicians
  app.get('/api/politicians', async (req: Request, res: Response) => {
    try {
      const { level, jurisdiction, party, search } = req.query;
      
      let query = db.select().from(politicians);
              const conditions: any[] = [];

      if (level) {
        conditions.push(eq(politicians.level, level as string));
      }
      if (jurisdiction) {
        conditions.push(eq(politicians.jurisdiction, jurisdiction as string));
      }
      if (party) {
        conditions.push(eq(politicians.party, party as string));
      }
      if (search) {
        conditions.push(
          or(
            like(politicians.name, `%${search}%`),
            like(politicians.position, `%${search}%`),
            like(politicians.constituency, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        (query as any) = query.where(and(...conditions));
      }

      const politiciansData = await query.orderBy(desc(politicians.updatedAt));
      
      res.json(politiciansData);
    } catch (error) {
      console.error('Error fetching politicians:', error);
      res.status(500).json({ error: 'Failed to fetch politicians' });
    }
  });

  // Get politician by ID
  app.get('/api/politicians/:id', async (req: Request, res: Response) => {
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

      res.json({
        ...politician,
        stats: {
          statements: statements?.count || 0,
          positions: positions?.count || 0
        },
        campaignFinance: finance || null,
        truthTracking: truthTracking || null
      });
    } catch (error) {
      console.error('Error fetching politician:', error);
      res.status(500).json({ error: 'Failed to fetch politician' });
    }
  });

  // Get politician statements
  app.get('/api/politicians/:id/statements', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const statements = await db
        .select()
        .from(politicianStatements)
        .where(eq(politicianStatements.politicianId, parseInt(id)))
        .orderBy(desc(politicianStatements.dateCreated))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json(statements);
    } catch (error) {
      console.error('Error fetching politician statements:', error);
      res.status(500).json({ error: 'Failed to fetch statements' });
    }
  });

  // Get politician positions
  app.get('/api/politicians/:id/positions', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const positions = await db
        .select()
        .from(politicianPositions)
        .where(eq(politicianPositions.politicianId, parseInt(id)))
        .orderBy(desc(politicianPositions.dateStated))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json(positions);
    } catch (error) {
      console.error('Error fetching politician positions:', error);
      res.status(500).json({ error: 'Failed to fetch positions' });
    }
  });

  // Get campaign finance data
  app.get('/api/politicians/:id/finance', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const finance = await db
        .select()
        .from(campaignFinance)
        .where(eq(campaignFinance.politicianId, parseInt(id)))
        .orderBy(desc(campaignFinance.reportingPeriod));

      res.json(finance);
    } catch (error) {
      console.error('Error fetching campaign finance:', error);
      res.status(500).json({ error: 'Failed to fetch campaign finance' });
    }
  });

  // Get politician truth tracking
  app.get('/api/politicians/:id/truth-tracking', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [truthTracking] = await db
        .select()
        .from(politicianTruthTracking)
        .where(eq(politicianTruthTracking.politicianId, parseInt(id)));

      res.json(truthTracking || {});
    } catch (error) {
      console.error('Error fetching truth tracking:', error);
      res.status(500).json({ error: 'Failed to fetch truth tracking' });
    }
  });

  // Search politicians
  app.get('/api/politicians/search', async (req: Request, res: Response) => {
    try {
      const { q, level, jurisdiction, party } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search query required' });
      }

      const conditions = [
        or(
          like(politicians.name, `%${q}%`),
          like(politicians.position, `%${q}%`),
          like(politicians.constituency, `%${q}%`),
          like(politicians.party, `%${q}%`)
        )
      ];

      if (level) {
        conditions.push(eq(politicians.level, level as string));
      }
      if (jurisdiction) {
        conditions.push(eq(politicians.jurisdiction, jurisdiction as string));
      }
      if (party) {
        conditions.push(eq(politicians.party, party as string));
      }

      const results = await db
        .select()
        .from(politicians)
        .where(and(...conditions))
        .orderBy(desc(politicians.updatedAt))
        .limit(20);

      res.json(results);
    } catch (error) {
      console.error('Error searching politicians:', error);
      res.status(500).json({ error: 'Failed to search politicians' });
    }
  });

  // Get politician statistics
  app.get('/api/politicians/stats', async (req: Request, res: Response) => {
    try {
      const stats = await db.execute(sql`
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

      const partyStats = await db.execute(sql`
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

      const jurisdictionStats = await db.execute(sql`
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
    } catch (error) {
      console.error('Error fetching politician stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Add politician statement (protected)
  app.post('/api/politicians/:id/statements', jwtAuth, async (req: Request, res: Response) => {
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
        source: source || 'user_submitted'
      }).returning();

      res.json(newStatement);
    } catch (error) {
      console.error('Error adding politician statement:', error);
      res.status(500).json({ error: 'Failed to add statement' });
    }
  });

  // Update politician (protected)
  app.put('/api/politicians/:id', jwtAuth, async (req: Request, res: Response) => {
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
    } catch (error) {
      console.error('Error updating politician:', error);
      res.status(500).json({ error: 'Failed to update politician' });
    }
  });
} 