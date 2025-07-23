import { Express, Request, Response } from "express";
import { storage } from "../storage.js";
import { db } from "../db.js";
import { petitions, petitionSignatures, userActivity } from "../../shared/schema.js";
import { eq, and, desc, sql, count } from "drizzle-orm";

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

export function registerPetitionsRoutes(app: Express) {
  // Get all petitions
  app.get('/api/petitions', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { search, category, status, page = '1', limit = '20' } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Get petitions from database
      let allPetitions = await db.select().from(petitions).orderBy(desc(petitions.createdAt));
      
      // Apply filters in memory to avoid TypeScript issues
      if (search) {
        allPetitions = allPetitions.filter(petition => 
          petition.title.toLowerCase().includes((search as string).toLowerCase())
        );
      }
      if (status && status !== 'all') {
        allPetitions = allPetitions.filter(petition => petition.status === status);
      }

      // Get user's signatures
      const userSignatures = await db.select()
        .from(petitionSignatures)
        .where(eq(petitionSignatures.userId, userId));

      // Combine petitions with user's signature status
      const petitionsWithSignatures = allPetitions.map(petition => {
        const userSignature = userSignatures.find(sig => sig.petitionId === petition.id);
        return {
          ...petition,
          hasSigned: !!userSignature,
          userSignature: userSignature || null
        };
      });

      // Pagination
      const total = petitionsWithSignatures.length;
      const paginatedPetitions = petitionsWithSignatures.slice(offset, offset + parseInt(limit as string));

      res.json({
        petitions: paginatedPetitions,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Error fetching petitions:', error);
      res.status(500).json({ error: 'Failed to fetch petitions' });
    }
  });

  // Create a new petition
  app.post('/api/petitions', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { title, description, category, targetSignatures, deadline } = req.body;
      
      if (!title || !description || !category || !targetSignatures) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newPetition = await storage.createPetition({
        title,
        description,
        category,
        targetSignatures: parseInt(targetSignatures),
        currentSignatures: 0,
        status: 'active',
        createdBy: userId,
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update user activity
      await db.insert(userActivity).values({
        userId,
        activityType: 'petition_created',
        entityId: newPetition.id,
        entityType: 'petition',
        details: { petitionId: newPetition.id, title: newPetition.title },
        createdAt: new Date()
      });

      res.status(201).json({
        message: "Petition created successfully",
        petition: newPetition
      });
    } catch (error) {
      console.error('Error creating petition:', error);
      res.status(500).json({ error: 'Failed to create petition' });
    }
  });

  // Sign a petition
  app.post('/api/petitions/:petitionId/sign', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { petitionId } = req.params;
      const { verificationId } = req.body;

      if (!verificationId) {
        return res.status(400).json({ message: "Verification ID required" });
      }

      // Check if already signed
      const existingSignature = await storage.getPetitionSignature(parseInt(petitionId), userId);
      if (existingSignature) {
        return res.status(409).json({ message: "Already signed this petition" });
      }

      // Sign the petition
      const signature = await storage.signPetition(parseInt(petitionId), userId, verificationId);

      // Update user activity
      await db.insert(userActivity).values({
        userId,
        activityType: 'petition_signed',
        entityId: parseInt(petitionId),
        entityType: 'petition',
        details: { petitionId: parseInt(petitionId) },
        createdAt: new Date()
      });

      res.json({
        message: "Petition signed successfully",
        signature
      });
    } catch (error) {
      console.error('Error signing petition:', error);
      res.status(500).json({ error: 'Failed to sign petition' });
    }
  });

  // Get petition details
  app.get('/api/petitions/:petitionId', jwtAuth, async (req: Request, res: Response) => {
    try {
      const { petitionId } = req.params;
      const userId = (req as any).user?.id;

      // Get petition from database
      const petition = await db.select()
        .from(petitions)
        .where(eq(petitions.id, parseInt(petitionId)))
        .limit(1);

      if (!petition[0]) {
        return res.status(404).json({ message: "Petition not found" });
      }

      // Get signatures for this petition
      const signatures = await db.select()
        .from(petitionSignatures)
        .where(eq(petitionSignatures.petitionId, parseInt(petitionId)))
        .orderBy(desc(petitionSignatures.signedAt));

      // Check if user signed
      const userSignature = signatures.find(sig => sig.userId === userId);

      res.json({
        petition: petition[0],
        signatures: signatures.length,
        hasSigned: !!userSignature,
        userSignature: userSignature || null
      });
    } catch (error) {
      console.error('Error fetching petition details:', error);
      res.status(500).json({ error: 'Failed to fetch petition details' });
    }
  });
} 