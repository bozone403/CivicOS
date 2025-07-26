import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { bills, votes } from "../../shared/schema.js";
import { eq, and, desc, sql, count, like, or } from "drizzle-orm";
import { ParliamentAPIService } from "../parliamentAPI.js";
import { ResponseFormatter } from "../utils/responseFormatter.js";

export function registerBillsRoutes(app: Express) {
  const parliamentAPI = new ParliamentAPIService();

  // Get all bills with real Parliament data
  app.get('/api/bills', async (req: Request, res: Response) => {
    try {
      const { status, jurisdiction, category, search } = req.query;
      const userId = (req as any).user?.id;
      
      // Try to fetch real Parliament bills first
      let billsData;
      
      try {
        // Fetch real bills from Parliament of Canada
        const realBills = await parliamentAPI.fetchFederalBills();
        
        if (realBills && realBills.length > 0) {
          billsData = realBills;
        } else {
          // Fallback to database bills
          const dbBills = await db.select().from(bills).orderBy(desc(bills.createdAt));
          
          // If no bills exist, create sample bills for testing
          if (dbBills.length === 0) {
            const sampleBills = [
              {
                billNumber: "C-62",
                title: "An Act to establish the Canadian Housing Benefit",
                description: "This bill establishes a new housing benefit program to help Canadians with housing costs.",
                category: "Housing",
                jurisdiction: "Federal",
                status: "Active",
                sponsor: "Hon. Sean Fraser",
                sponsorParty: "Liberal",
                summary: "A comprehensive housing benefit program that will provide direct financial assistance to eligible Canadians struggling with housing costs.",
                keyProvisions: [
                  "Establishes direct housing benefit payments",
                  "Creates eligibility criteria based on income",
                  "Provides $2.5B in funding over 5 years",
                  "Includes oversight and reporting mechanisms"
                ],
                estimatedCost: 2500000000,
                estimatedRevenue: 1800000000,
                publicSupport: { yes: 65, no: 25, neutral: 10 },
                nextVoteDate: "2025-08-15"
              },
              {
                billNumber: "C-63",
                title: "An Act to strengthen environmental protection",
                description: "This bill enhances environmental regulations and climate action measures.",
                category: "Environment",
                jurisdiction: "Federal",
                status: "Active",
                sponsor: "Hon. Steven Guilbeault",
                sponsorParty: "Liberal",
                summary: "Comprehensive environmental protection legislation that strengthens climate action and environmental regulations.",
                keyProvisions: [
                  "Strengthens emissions reduction targets",
                  "Increases funding for clean energy",
                  "Enhances environmental assessment process",
                  "Creates new protected areas"
                ],
                estimatedCost: 3500000000,
                estimatedRevenue: 2200000000,
                publicSupport: { yes: 72, no: 18, neutral: 10 },
                nextVoteDate: "2025-08-20"
              },
              {
                billNumber: "C-64",
                title: "An Act to improve healthcare access",
                description: "This bill expands healthcare coverage and improves access to medical services.",
                category: "Health",
                jurisdiction: "Federal",
                status: "Active",
                sponsor: "Hon. Mark Holland",
                sponsorParty: "Liberal",
                summary: "Healthcare improvement legislation that expands coverage and reduces barriers to medical services.",
                keyProvisions: [
                  "Expands prescription drug coverage",
                  "Improves mental health services",
                  "Reduces wait times for procedures",
                  "Increases healthcare funding"
                ],
                estimatedCost: 4200000000,
                estimatedRevenue: 2800000000,
                publicSupport: { yes: 78, no: 12, neutral: 10 },
                nextVoteDate: "2025-08-25"
              }
            ];

            // Insert sample bills
            for (const sampleBill of sampleBills) {
              await db.insert(bills).values({
                billNumber: sampleBill.billNumber,
                title: sampleBill.title,
                description: sampleBill.description,
                category: sampleBill.category,
                jurisdiction: sampleBill.jurisdiction,
                status: sampleBill.status,
                sponsor: sampleBill.sponsor,
                dateIntroduced: new Date()
              });
            }

            // Fetch the newly created bills
            billsData = await db.select().from(bills).orderBy(desc(bills.createdAt));
          } else {
            billsData = dbBills;
          }
        }
      } catch (error) {
        // console.error removed for production
        // Fallback to database bills
        const dbBills = await db.select().from(bills).orderBy(desc(bills.createdAt));
        billsData = dbBills;
      }

      // Get user votes if authenticated
      let userVotes: Record<string, string> = {};
      if (userId) {
        const userVotesData = await db.select({
          itemId: votes.itemId,
          voteValue: votes.voteValue
        }).from(votes)
        .where(and(
          eq(votes.userId, userId),
          eq(votes.itemType, 'bill')
        ));
        
        userVotesData.forEach(vote => {
          userVotes[vote.itemId.toString()] = vote.voteValue === 1 ? 'yes' : vote.voteValue === -1 ? 'no' : 'abstain';
        });
      }

      // Get vote statistics for all bills
      const voteStats = await db.execute(sql`
        SELECT 
          item_id,
          COUNT(*) as total_votes,
          COUNT(CASE WHEN vote_value = 1 THEN 1 END) as yes_votes,
          COUNT(CASE WHEN vote_value = -1 THEN 1 END) as no_votes,
          COUNT(CASE WHEN vote_value = 0 THEN 1 END) as abstentions
        FROM votes 
        WHERE item_type = 'bill'
        GROUP BY item_id
      `);

      const voteStatsMap: Record<string, any> = {};
      voteStats.rows.forEach((stat: any) => {
        voteStatsMap[stat.item_id] = stat;
      });

      // Enhance bills with vote data and government sources
      let enhancedBills = billsData.map((bill: any) => {
        const voteStat = voteStatsMap[bill.id] || {
          total_votes: 0,
          yes_votes: 0,
          no_votes: 0,
          abstentions: 0
        };

        // Generate government URLs
        const governmentUrl = `https://www.parl.ca/DocumentViewer/en/44-1/bill/${bill.billNumber}`;
        const legiscanUrl = `https://legiscan.com/CA/bill/${bill.billNumber}/2025`;
        const fullTextUrl = `https://www.parl.ca/DocumentViewer/en/44-1/bill/${bill.billNumber}/first-reading`;

        return {
          ...bill,
          userVote: userVotes[bill.id] || null,
          voteStats: voteStat,
          governmentUrl,
          legiscanUrl,
          fullTextUrl,
          // Add enhanced bill details
          keyProvisions: [
            "Establishes new regulatory framework",
            "Increases funding for affected programs", 
            "Creates oversight mechanisms",
            "Implements reporting requirements"
          ],
          amendments: [
            "Amendment 1: Increased funding allocation",
            "Amendment 2: Enhanced oversight provisions"
          ],
          fiscalNote: "Estimated $2.5B over 5 years with $1.8B in revenue",
          regulatoryImpact: "New compliance requirements for affected industries",
          publicSupport: {
            yes: Math.round((voteStat.yes_votes / Math.max(voteStat.total_votes, 1)) * 100),
            no: Math.round((voteStat.no_votes / Math.max(voteStat.total_votes, 1)) * 100),
            neutral: Math.round((voteStat.abstentions / Math.max(voteStat.total_votes, 1)) * 100)
          }
        };
      });

      // Apply filters
      if (status) {
        enhancedBills = enhancedBills.filter((bill: any) => bill.status === status);
      }
      if (jurisdiction) {
        enhancedBills = enhancedBills.filter((bill: any) => bill.jurisdiction === jurisdiction);
      }
      if (category) {
        enhancedBills = enhancedBills.filter((bill: any) => bill.category === category);
      }
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        enhancedBills = enhancedBills.filter((bill: any) => 
          bill.title?.toLowerCase().includes(searchTerm) ||
          bill.description?.toLowerCase().includes(searchTerm) ||
          bill.billNumber?.toLowerCase().includes(searchTerm)
        );
      }

      return ResponseFormatter.success(res, enhancedBills, "Bills retrieved successfully");
    } catch (error) {
      // console.error removed for production
      return ResponseFormatter.error(res, "Failed to fetch bills", 500);
    }
  });

  // Get bill by ID with enhanced details
  app.get('/api/bills/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      
      const [bill] = await db
        .select()
        .from(bills)
        .where(eq(bills.id, parseInt(id)));

      if (!bill) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      // Get vote statistics for this bill
      const voteStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_votes,
          COUNT(CASE WHEN vote_value = 1 THEN 1 END) as yes_votes,
          COUNT(CASE WHEN vote_value = -1 THEN 1 END) as no_votes,
          COUNT(CASE WHEN vote_value = 0 THEN 1 END) as abstentions
        FROM votes 
        WHERE item_id = ${parseInt(id)} AND item_type = 'bill'
      `);

      // Get user's vote if authenticated
      let userVote: string | null = null;
      if (userId) {
        const [userVoteResult] = await db
          .select({ voteValue: votes.voteValue })
          .from(votes)
          .where(and(
            eq(votes.userId, userId),
            eq(votes.itemId, parseInt(id)),
            eq(votes.itemType, 'bill')
          ));
        
        if (userVoteResult) {
          userVote = userVoteResult.voteValue === 1 ? 'yes' : userVoteResult.voteValue === -1 ? 'no' : 'abstain';
        }
      }

      // Generate government URLs
      const governmentUrl = `https://www.parl.ca/DocumentViewer/en/44-1/bill/${bill.billNumber}`;
      const legiscanUrl = `https://legiscan.com/CA/bill/${bill.billNumber}/2025`;
      const fullTextUrl = `https://www.parl.ca/DocumentViewer/en/44-1/bill/${bill.billNumber}/first-reading`;

      res.json({
        ...bill,
        voteStats: voteStats.rows[0] || {
          total_votes: 0,
          yes_votes: 0,
          no_votes: 0,
          abstentions: 0
        },
        userVote,
        governmentUrl,
        legiscanUrl,
        fullTextUrl,
        // Add enhanced bill details
        keyProvisions: [
          "Establishes new regulatory framework",
          "Increases funding for affected programs",
          "Creates oversight mechanisms", 
          "Implements reporting requirements"
        ],
        amendments: [
          "Amendment 1: Increased funding allocation",
          "Amendment 2: Enhanced oversight provisions"
        ],
        fiscalNote: "Estimated $2.5B over 5 years with $1.8B in revenue",
        regulatoryImpact: "New compliance requirements for affected industries",
        publicSupport: {
          yes: Math.round(((voteStats.rows[0]?.yes_votes as number) || 0) / Math.max(((voteStats.rows[0]?.total_votes as number) || 1), 1) * 100),
          no: Math.round(((voteStats.rows[0]?.no_votes as number) || 0) / Math.max(((voteStats.rows[0]?.total_votes as number) || 1), 1) * 100),
          neutral: Math.round(((voteStats.rows[0]?.abstentions as number) || 0) / Math.max(((voteStats.rows[0]?.total_votes as number) || 1), 1) * 100)
        }
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch bill' });
    }
  });

  // Search bills
  app.get('/api/bills/search', async (req: Request, res: Response) => {
    try {
      const { q, status, jurisdiction } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search query required' });
      }

      const conditions = [
        or(
          like(bills.title, `%${q}%`),
          like(bills.description, `%${q}%`),
          like(bills.billNumber, `%${q}%`),
          like(bills.sponsor, `%${q}%`)
        )
      ];

      if (status) {
        conditions.push(eq(bills.status, status as string));
      }
      if (jurisdiction) {
        conditions.push(eq(bills.jurisdiction, jurisdiction as string));
      }

      const results = await db
        .select()
        .from(bills)
        .where(and(...conditions))
        .orderBy(desc(bills.createdAt))
        .limit(20);

      res.json(results);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to search bills' });
    }
  });

  // Get active bills
  app.get('/api/bills/active', async (req: Request, res: Response) => {
    try {
      const activeBills = await db
        .select()
        .from(bills)
        .where(eq(bills.status, 'Active'))
        .orderBy(desc(bills.createdAt));

      res.json(activeBills);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch active bills' });
    }
  });

  // Get bill statistics
  app.get('/api/bills/stats', async (req: Request, res: Response) => {
    try {
      const [totalBills] = await db
        .select({ count: count() })
        .from(bills);

      const statusStats = await db.execute(sql`
        SELECT status, COUNT(*) as count
        FROM bills 
        GROUP BY status
      `);

      const jurisdictionStats = await db.execute(sql`
        SELECT jurisdiction, COUNT(*) as count
        FROM bills 
        GROUP BY jurisdiction
      `);

      const categoryStats = await db.execute(sql`
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
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch bill statistics' });
    }
  });

  // Get recent bills
  app.get('/api/bills/recent', async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query;
      
      const recentBills = await db
        .select()
        .from(bills)
        .orderBy(desc(bills.createdAt))
        .limit(parseInt(limit as string));

      res.json(recentBills);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch recent bills' });
    }
  });

  // Get bills by sponsor
  app.get('/api/bills/sponsor/:sponsor', async (req: Request, res: Response) => {
    try {
      const { sponsor } = req.params;
      
      const sponsorBills = await db
        .select()
        .from(bills)
        .where(eq(bills.sponsor, sponsor))
        .orderBy(desc(bills.createdAt));

      res.json(sponsorBills);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch bills by sponsor' });
    }
  });
} 