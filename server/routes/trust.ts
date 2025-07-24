import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { users, politicians, factChecks } from "../../shared/schema.js";
import { eq, and, desc, sql, count } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { ResponseFormatter } from "../utils/responseFormatter.js";

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

export function registerTrustRoutes(app: Express) {
  // Get trust metrics for politicians
  app.get('/api/trust/politicians', async (req: Request, res: Response) => {
    try {
      const politiciansWithTrust = await db.select().from(politicians).orderBy(desc(politicians.createdAt));
      
      res.json({
        politicians: politiciansWithTrust,
        total: politiciansWithTrust.length,
        message: "Politician trust metrics retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch politician trust metrics' });
    }
  });

  // Get fact checks
  app.get('/api/trust/fact-checks', async (req: Request, res: Response) => {
    try {
      const factChecksData = await db.select().from(factChecks).orderBy(desc(factChecks.checkedAt));
      
      res.json({
        factChecks: factChecksData,
        total: factChecksData.length,
        message: "Fact checks retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch fact checks' });
    }
  });

  // Get trust statistics
  app.get('/api/trust/stats', async (req: Request, res: Response) => {
    try {
      const [totalPoliticians, averageTrustScore, totalFactChecks] = await Promise.all([
        db.select({ count: count() }).from(politicians),
        db.select({ avg: sql`AVG(${users.trustScore})` }).from(users),
        db.select({ count: count() }).from(factChecks)
      ]);
      
      res.json({
        totalPoliticians: totalPoliticians[0]?.count || 0,
        averageTrustScore: averageTrustScore[0]?.avg || 0,
        totalFactChecks: totalFactChecks[0]?.count || 0,
        message: "Trust statistics retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trust statistics' });
    }
  });

  // Get user trust score
  app.get('/api/trust/user-score', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const user = await db.select().from(users).where(eq(users.id, userId));
      
      if (user.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        trustScore: user[0].trustScore,
        message: "User trust score retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user trust score' });
    }
  });
} 