import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { votingItems, votes, bills } from '../../shared/schema.js';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';
import { jwtAuth } from './auth.js';
import { VotingSystem } from '../votingSystem.js';
import { z } from 'zod';

// Input validation schemas
const createVotingItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  type: z.enum(['bill', 'petition', 'referendum', 'poll']),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    description: z.string().optional()
  })).min(2, 'At least 2 options required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  jurisdiction: z.enum(['federal', 'provincial', 'municipal']),
  requiredQuorum: z.number().min(0).optional(),
  eligibleVoters: z.array(z.string()).default(['all'])
});

const castVoteSchema = z.object({
  optionId: z.string().min(1, 'Option ID is required')
});

export function registerVotingRoutes(app: Express) {
  const votingSystem = new VotingSystem();

  // GET /api/voting/active - Get active voting items
  app.get('/api/voting/active', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const activeItems = await votingSystem.getActiveVotingItems(userId);
      
      // Add user's vote status to each item
      const itemsWithVoteStatus = await Promise.all(
        activeItems.map(async (item) => {
          const hasVoted = await votingSystem.hasUserVoted(userId, item.id);
          return {
            ...item,
            userHasVoted: hasVoted
          };
        })
      );

      res.json({
        success: true,
        items: itemsWithVoteStatus,
        total: itemsWithVoteStatus.length
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch active voting items",
        error: (error as any)?.message || String(error)
      });
    }
  });

  // GET /api/voting/:id - Get specific voting item
  app.get('/api/voting/:id', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const itemId = parseInt(req.params.id);

      if (isNaN(itemId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid voting item ID"
        });
      }

      const [item] = await db
        .select()
        .from(votingItems)
        .where(eq(votingItems.id, itemId))
        .limit(1);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Voting item not found"
        });
      }

      const hasVoted = await votingSystem.hasUserVoted(userId, itemId);
      const userVote = hasVoted ? await db
        .select()
        .from(votes)
        .where(and(
          eq(votes.userId, userId),
          eq(votes.itemId, itemId)
        ))
        .limit(1) : null;

      res.json({
        success: true,
        item: {
          ...item,
          options: typeof item.options === 'string' ? JSON.parse(item.options) : item.options,
          eligibleVoters: typeof item.eligibleVoters === 'string' ? JSON.parse(item.eligibleVoters) : item.eligibleVoters,
          userHasVoted: hasVoted,
          userVote: userVote?.[0] || null
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch voting item",
        error: (error as any)?.message || String(error)
      });
    }
  });

  // POST /api/voting/:id/vote - Cast a vote
  app.post('/api/voting/:id/vote', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const itemId = parseInt(req.params.id);

      if (isNaN(itemId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid voting item ID"
        });
      }

      // Validate input
      const validationResult = castVoteSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: validationResult.error.errors
        });
      }

      const { optionId } = validationResult.data;

      // Check if user already voted
      const hasVoted = await votingSystem.hasUserVoted(userId, itemId);
      if (hasVoted) {
        return res.status(400).json({
          success: false,
          message: "You have already voted on this item"
        });
      }

      // Cast the vote
      await votingSystem.castVote(userId, itemId, optionId);

      res.json({
        success: true,
        message: "Vote cast successfully"
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to cast vote",
        error: (error as any)?.message || String(error)
      });
    }
  });

  // GET /api/voting/:id/results - Get voting results
  app.get('/api/voting/:id/results', async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);

      if (isNaN(itemId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid voting item ID"
        });
      }

      const results = await votingSystem.getVotingResults(itemId);

      res.json({
        success: true,
        results
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch voting results",
        error: (error as any)?.message || String(error)
      });
    }
  });

  // GET /api/voting/history - Get user's voting history
  app.get('/api/voting/history', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const { page = 1, limit = 10 } = req.query;
      
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;

      const history = await votingSystem.getUserVotingHistory(userId);

      res.json({
        success: true,
        history: history.slice(offset, offset + limitNum),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: history.length,
          totalPages: Math.ceil(history.length / limitNum)
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch voting history",
        error: (error as any)?.message || String(error)
      });
    }
  });

  // POST /api/voting/create - Create new voting item (admin only)
  app.post('/api/voting/create', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      
      // TODO: Add admin permission check
      // const isAdmin = await PermissionService.isAdmin(userId);
      // if (!isAdmin) {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Admin permission required"
      //   });
      // }

      // Validate input
      const validationResult = createVotingItemSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: validationResult.error.errors
        });
      }

      const votingItem = validationResult.data;
      const itemId = await votingSystem.createVotingItem({
        ...votingItem,
        startDate: new Date(votingItem.startDate),
        endDate: new Date(votingItem.endDate),
        status: 'active' // Add the missing status field
      });

      res.status(201).json({
        success: true,
        message: "Voting item created successfully",
        itemId
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create voting item",
        error: (error as any)?.message || String(error)
      });
    }
  });

  // GET /api/voting/bills/:billId - Create voting for a specific bill
  app.get('/api/voting/bills/:billId', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const billId = parseInt(req.params.billId);

      if (isNaN(billId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid bill ID"
        });
      }

      // Get bill details
      const [bill] = await db
        .select()
        .from(bills)
        .where(eq(bills.id, billId))
        .limit(1);

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: "Bill not found"
        });
      }

      // Create voting item for the bill
      const votingItemId = await votingSystem.createBillVote(billId, userId);

      res.json({
        success: true,
        message: "Bill voting created successfully",
        votingItemId,
        bill: {
          id: bill.id,
          title: bill.title,
          description: bill.description
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create bill voting",
        error: (error as any)?.message || String(error)
      });
    }
  });
} 