import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { users, politicians, electoralDistricts } from "../../shared/schema.js";
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

export function registerMapsRoutes(app: Express) {
  // Root maps endpoint
  app.get('/api/maps', async (req: Request, res: Response) => {
    try {
      const [districts, politiciansData, stats] = await Promise.all([
        db.select().from(electoralDistricts).orderBy(electoralDistricts.districtName),
        db.select().from(politicians).orderBy(desc(politicians.createdAt)),
        db.select({ count: count() }).from(electoralDistricts)
      ]);
      
      res.json({
        districts: districts.slice(0, 10),
        politicians: politiciansData.slice(0, 20),
        totalDistricts: stats[0]?.count || 0,
        message: "Maps data retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch maps data' });
    }
  });

  // Get electoral districts for mapping
  app.get('/api/maps/districts', async (req: Request, res: Response) => {
    try {
      const districts = await db.select().from(electoralDistricts).orderBy(electoralDistricts.districtName);
      
      res.json({
        districts,
        total: districts.length,
        message: "Electoral districts retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch electoral districts' });
    }
  });

  // Get user engagement by location
  app.get('/api/maps/engagement', jwtAuth, async (req: Request, res: Response) => {
    try {
      const usersWithLocation = await db.select()
        .from(users)
        .where(sql`${users.latitude} IS NOT NULL AND ${users.longitude} IS NOT NULL`)
        .orderBy(desc(users.createdAt));
      
      res.json({
        users: usersWithLocation,
        total: usersWithLocation.length,
        message: "User engagement data retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user engagement data' });
    }
  });

  // Get politicians by district
  app.get('/api/maps/politicians/:districtId', async (req: Request, res: Response) => {
    try {
      const { districtId } = req.params;
      const politiciansInDistrict = await db.select()
        .from(politicians)
        .where(eq(politicians.constituency, districtId))
        .orderBy(desc(politicians.createdAt));
      
      res.json({
        politicians: politiciansInDistrict,
        total: politiciansInDistrict.length,
        message: "Politicians in district retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch politicians in district' });
    }
  });

  // Get engagement statistics
  app.get('/api/maps/stats', async (req: Request, res: Response) => {
    try {
      const [totalDistricts, totalUsers, totalPoliticians] = await Promise.all([
        db.select({ count: count() }).from(electoralDistricts),
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(politicians)
      ]);
      
      res.json({
        totalDistricts: totalDistricts[0]?.count || 0,
        totalUsers: totalUsers[0]?.count || 0,
        totalPoliticians: totalPoliticians[0]?.count || 0,
        message: "Map statistics retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch map statistics' });
    }
  });
} 