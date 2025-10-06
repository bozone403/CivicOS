import { Express, Request, Response } from "express";
import { storage } from "../storage.js";
import { db } from "../db.js";
import { politicians, politicianStatements, politicianPositions, campaignFinance, politicianTruthTracking, billRollcalls, billRollcallRecords, parliamentMembers } from "../../shared/schema.js";
import { computeTrustScore } from "../utils/trustScore.js";
import { eq, and, desc, sql, count, like, or, inArray } from "drizzle-orm";
import { ResponseFormatter } from "../utils/responseFormatter.js";
import jwt from "jsonwebtoken";
import { ParliamentAPIService } from "../parliamentAPI.js";
import * as cheerio from "cheerio";
import { syncIncumbentPoliticiansFromParliament } from '../utils/politicianSync.js';
import { politicianIngestionService } from '../utils/politicianIngestion.js';
import { requirePermission } from '../utils/permissionService.js';

// JWT Auth middleware
function jwtAuth(req: any, res: any, next: any) {
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
  } catch (err) {
    return ResponseFormatter.unauthorized(res, "Invalid or expired token");
  }
}

export function registerPoliticiansRoutes(app: Express) {
  const parliamentAPI = new ParliamentAPIService();

  // Get all politicians (strict DB-first; on-demand refresh if empty; no synthetic fallback)
  app.get('/api/politicians', async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { level, jurisdiction, party, search, location, limit = '50', page = '1' } = req.query as any;

      // Parse pagination
      const limitNum = Math.min(parseInt(limit) || 50, 100);
      const pageNum = Math.max(parseInt(page) || 1, 1);
      const offset = (pageNum - 1) * limitNum;

      // Strict DB-first
      const conditions: any[] = [];
      if (level) conditions.push(eq(politicians.level, level as string));
      if (jurisdiction) conditions.push(eq(politicians.jurisdiction, jurisdiction as string));
      if (party) conditions.push(eq(politicians.party, party as string));
      if (search) {
        conditions.push(
          or(
            like(politicians.name, `%${search}%`),
            like(politicians.position, `%${search}%`),
            like(politicians.constituency, `%${search}%`)
          )
        );
      }
      if (location) {
        const q = String(location);
        conditions.push(
          or(
            like(politicians.jurisdiction, `%${q}%`),
            like(politicians.constituency, `%${q}%`)
          )
        );
      }

      // Get total count for pagination
      const totalCountQuery = conditions.length > 0 
        ? db.select({ count: count() }).from(politicians).where(and(...conditions))
        : db.select({ count: count() }).from(politicians);
      
      const [totalCountResult] = await totalCountQuery;
      const totalCount = totalCountResult?.count || 0;

      // Get politicians with pagination
      let politiciansData = conditions.length > 0
        ? await db.select().from(politicians).where(and(...conditions)).orderBy(desc(politicians.updatedAt)).limit(limitNum).offset(offset)
        : await db.select().from(politicians).orderBy(desc(politicians.updatedAt)).limit(limitNum).offset(offset);

      // If empty, try to trigger on-demand sync but don't fail if it doesn't work
      if (!politiciansData || politiciansData.length === 0) {
        try {
          // Check if parliamentMembers table has data before attempting sync
          const parliamentMembersCount = await db.select({ count: count() }).from(parliamentMembers);
          if (parliamentMembersCount[0]?.count > 0) {
            await syncIncumbentPoliticiansFromParliament();
            // Re-read after sync attempt
            politiciansData = conditions.length > 0
              ? await db.select().from(politicians).where(and(...conditions)).orderBy(desc(politicians.updatedAt)).limit(limitNum).offset(offset)
              : await db.select().from(politicians).orderBy(desc(politicians.updatedAt)).limit(limitNum).offset(offset);
          }
        } catch (syncError) {
          // Log sync error but don't fail the request
          // console.error removed for production
        }
      }
      
      // Format response data
      const formattedPoliticians = politiciansData.map(politician => ({
        id: politician.id,
        name: politician.name,
        position: politician.position,
        party: politician.party,
        jurisdiction: politician.jurisdiction,
        constituency: politician.constituency,
        level: politician.level,
        email: (politician.contactInfo as any)?.email || null,
        phone: (politician.contactInfo as any)?.phone || null,
        website: (politician.contactInfo as any)?.website || null,
        image: politician.image,
        bio: politician.bio || politician.biography,
        trustScore: politician.trustScore,
        isIncumbent: politician.isIncumbent,
        createdAt: politician.createdAt,
        updatedAt: politician.updatedAt
      }));

      const processingTime = Date.now() - startTime;
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limitNum);
      
      return ResponseFormatter.success(
        res,
        formattedPoliticians,
        "Politicians data retrieved successfully",
        200,
        formattedPoliticians.length,
        {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages
        },
        processingTime
      );
    } catch (error) {
      // console.error removed for production
      return ResponseFormatter.databaseError(res, `Failed to fetch politicians: ${(error as Error).message}`);
    }
  });

  // Admin: trigger politician ingestion
  app.post('/api/politicians/ingest', jwtAuth, requirePermission('admin.data.manage'), async (_req: Request, res: Response) => {
    try {
      const result = await politicianIngestionService.ingestAllPoliticians();
      return ResponseFormatter.success(res, { inserted: result }, `Politician ingestion completed. Inserted: ${result}`);
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to ingest politicians: ${(error as Error).message}`);
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

      // Compute trust score live if missing
      const computedTrust = await computeTrustScore(parseInt(id)).catch(() => null);
      if (computedTrust !== null) {
        await db.update(politicians).set({ trustScore: String(computedTrust) as any, updatedAt: new Date() }).where(eq(politicians.id, parseInt(id)));
      }

      res.json({
        ...politician,
        trustScore: computedTrust ?? (politician as any).trustScore,
        stats: {
          statements: statements?.count || 0,
          positions: positions?.count || 0
        },
        campaignFinance: finance || null,
        truthTracking: truthTracking || null
      });
    } catch (error) {
      // console.error removed for production
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
      // console.error removed for production
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
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch positions' });
    }
  });

  // Get politician roll-call votes (by mapped parliament member id if available)
  app.get('/api/politicians/:id/votes', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pid = parseInt(id);
      const [pol] = await db.select().from(politicians).where(eq(politicians.id, pid));
      if (!pol) return res.status(404).json({ message: 'Politician not found' });
      const pmId = (pol as any).parliamentMemberId as string | null;
      if (!pmId) return res.json({ votes: [] });
      // Join rollcall records by member id
      const recs = await db
        .select()
        .from(billRollcallRecords)
        .where(eq(billRollcallRecords.memberId, pmId));
      if (!recs || recs.length === 0) return res.json({ votes: [] });
      // Load related rollcalls for context
      const rcIds = Array.from(new Set(recs.map(r => (r as any).rollcallId))).filter(Boolean);
      const rcs = rcIds.length
        ? await db.select().from(billRollcalls).where((billRollcalls.id as any).in(rcIds as any))
        : [];
      const byId = new Map<number, any>();
      for (const rc of rcs) byId.set((rc as any).id, rc);
      const out = recs.map((r: any) => ({
        rollcallId: r.rollcallId,
        decision: r.decision,
        party: r.party,
        billNumber: byId.get(r.rollcallId)?.billNumber,
        voteNumber: byId.get(r.rollcallId)?.voteNumber,
        result: byId.get(r.rollcallId)?.result,
        dateTime: byId.get(r.rollcallId)?.dateTime,
      }));
      res.json({ votes: out });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch politician votes' });
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
      // console.error removed for production
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
      // console.error removed for production
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
      // console.error removed for production
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
      // console.error removed for production
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
        source: source || 'user_submitted',
        date: new Date()
      }).returning();

      res.json(newStatement);
    } catch (error) {
      // console.error removed for production
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
      // console.error removed for production
      res.status(500).json({ error: 'Failed to update politician' });
    }
  });
} 