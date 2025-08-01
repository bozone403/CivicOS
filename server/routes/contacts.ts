import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { politicians } from "../../shared/schema.js";
import { eq, and, desc, asc } from "drizzle-orm";

export function registerContactsRoutes(app: Express) {
  // Get all government officials
  app.get('/api/contacts/officials', async (req: Request, res: Response) => {
    try {
      // Get officials from database
      const officials = await db
        .select({
          id: politicians.id,
          name: politicians.name,
          party: politicians.party,
          jurisdiction: politicians.jurisdiction,
          level: politicians.level,
          position: politicians.position,
          contactInfo: politicians.contactInfo,
          socialMedia: politicians.socialMedia,
          trustScore: politicians.trustScore,
          createdAt: politicians.createdAt,
          updatedAt: politicians.updatedAt
        })
        .from(politicians)
        .orderBy(asc(politicians.name));

      res.json({
        success: true,
        officials
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch government officials",
        error: (error as any)?.message || String(error)
      });
    }
  });
} 