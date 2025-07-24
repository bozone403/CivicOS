import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { elections, candidates, electoralDistricts } from "../../shared/schema.js";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { ResponseFormatter } from "../utils/responseFormatter.js";
import jwt from "jsonwebtoken";

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

export function registerElectionsRoutes(app: Express) {
  // Get all elections
  app.get('/api/elections', async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const allElections = await db.select().from(elections).orderBy(desc(elections.electionDate));
      
      const processingTime = Date.now() - startTime;
      return ResponseFormatter.success(
        res,
        { elections: allElections },
        "Elections data retrieved successfully",
        200,
        allElections.length,
        undefined,
        processingTime
      );
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch elections data: ${(error as Error).message}`);
    }
  });

  // Get election by ID
  app.get('/api/elections/:id', async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      const election = await db.select().from(elections).where(eq(elections.id, parseInt(id)));
      
      if (election.length === 0) {
        return ResponseFormatter.notFound(res, "Election not found");
      }
      
      const processingTime = Date.now() - startTime;
      return ResponseFormatter.success(
        res,
        election[0],
        "Election data retrieved successfully",
        200,
        undefined,
        undefined,
        processingTime
      );
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch election data: ${(error as Error).message}`);
    }
  });

  // Get candidates for an election
  app.get('/api/elections/:id/candidates', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const candidateList = await db.select().from(candidates).where(eq(candidates.electionId, parseInt(id)));
      
      res.json({
        candidates: candidateList,
        total: candidateList.length,
        message: "Candidates retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch candidates data' });
    }
  });

  // Get electoral districts
  app.get('/api/elections/districts', async (req: Request, res: Response) => {
    try {
      const districts = await db.select().from(electoralDistricts);
      
      res.json({
        districts,
        total: districts.length,
        message: "Electoral districts retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch electoral districts' });
    }
  });

  // Get election statistics
  app.get('/api/elections/stats', async (req: Request, res: Response) => {
    try {
      const [totalElections, upcomingElections, pastElections] = await Promise.all([
        db.select({ count: count() }).from(elections),
        db.select({ count: count() }).from(elections).where(sql`${elections.electionDate} > NOW()`),
        db.select({ count: count() }).from(elections).where(sql`${elections.electionDate} <= NOW()`)
      ]);
      
      res.json({
        totalElections: totalElections[0]?.count || 0,
        upcomingElections: upcomingElections[0]?.count || 0,
        pastElections: pastElections[0]?.count || 0,
        message: "Election statistics retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch election statistics' });
    }
  });
} 