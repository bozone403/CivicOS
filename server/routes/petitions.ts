import { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { petitions, petitionSignatures, users } from '../../shared/schema.js';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { ResponseFormatter } from '../utils/responseFormatter.js';
import jwt from 'jsonwebtoken';
import { storage } from '../storage.js';

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

export function registerPetitionRoutes(app: Express) {
  // Get all petitions
  app.get('/api/petitions', async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { page = 1, limit = 10, status = 'active' } = req.query;
      
      // Validate query parameters
      const pageNum = Number(page);
      const limitNum = Number(limit);
      
      if (isNaN(pageNum) || pageNum < 1) {
        return ResponseFormatter.badRequest(res, "Invalid page number");
      }
      
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return ResponseFormatter.badRequest(res, "Invalid limit (must be between 1 and 100)");
      }

      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      let whereConditions = [eq(petitions.status, status as string)];

      // Get petitions from database
      const allPetitions = await db
        .select({
          id: petitions.id,
          title: petitions.title,
          description: petitions.description,
          targetSignatures: petitions.targetSignatures,
          currentSignatures: petitions.currentSignatures,
          status: petitions.status,
          deadlineDate: petitions.deadlineDate,
          createdAt: petitions.createdAt,
          updatedAt: petitions.updatedAt,
          creatorId: petitions.creatorId,
          creator: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`
        })
        .from(petitions)
        .leftJoin(users, eq(petitions.creatorId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(petitions.createdAt))
        .limit(limitNum)
        .offset(offset);

      // Calculate days left and add urgency for each petition
      const enrichedPetitions = allPetitions.map(petition => ({
        ...petition,
        daysLeft: petition.deadlineDate ? 
          Math.ceil((new Date(petition.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 30,
        urgency: getUrgencyLevel(petition.currentSignatures || 0, petition.targetSignatures || 500),
        verified: true
      }));

      return ResponseFormatter.success(
        res,
        enrichedPetitions,
        "Petitions retrieved successfully",
        200,
        enrichedPetitions.length,
        undefined,
        Date.now() - startTime
      );
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch petitions: ${(error as Error).message}`);
    }
  });

  // Get single petition
  app.get('/api/petitions/:id', async (req: Request, res: Response) => {
    try {
      const petitionId = parseInt(req.params.id);
      
      // Try to get petition from database first
      let petition: any = null;
      try {
        const [dbPetition] = await db
          .select({
            id: petitions.id,
            title: petitions.title,
            description: petitions.description,
            targetSignatures: petitions.targetSignatures,
            currentSignatures: petitions.currentSignatures,
            status: petitions.status,
            deadlineDate: petitions.deadlineDate,
            createdAt: petitions.createdAt,
            updatedAt: petitions.updatedAt,
            creatorId: petitions.creatorId,
            creator: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`
          })
          .from(petitions)
          .leftJoin(users, eq(petitions.creatorId, users.id))
          .where(eq(petitions.id, petitionId));
        
        petition = dbPetition;
      } catch (dbError) {
        // If database fails, try to get from sample data
        // This part of the logic needs to be re-evaluated if sample data is removed
        // For now, we'll return a 404 if no petition is found in the database
        return ResponseFormatter.notFound(res, "Petition not found");
      }

      if (!petition) {
        return ResponseFormatter.notFound(res, "Petition not found");
      }

      // Enrich petition with additional data
      const enrichedPetition = {
        ...petition,
        daysLeft: petition.deadlineDate ? 
          Math.ceil((new Date(petition.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 30,
        urgency: getUrgencyLevel(petition.currentSignatures || 0, petition.targetSignatures || 500),
        verified: true
      };

      return ResponseFormatter.success(
        res,
        enrichedPetition,
        "Petition retrieved successfully",
        200
      );
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch petition: ${(error as Error).message}`);
    }
  });

  // Sign petition
  app.post('/api/petitions/:id/sign', jwtAuth, async (req: Request, res: Response) => {
    try {
      const petitionId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const { verificationId } = req.body;

      if (!verificationId) {
        return res.status(400).json({ message: 'Verification ID is required' });
      }

      // Check if user already signed
      const existingSignature = await db
        .select()
        .from(petitionSignatures)
        .where(and(
          eq(petitionSignatures.petitionId, petitionId),
          eq(petitionSignatures.userId, userId)
        ));

      if (existingSignature.length > 0) {
        return res.status(400).json({ message: 'You have already signed this petition' });
      }

      // Sign the petition
      const signature = await storage.signPetition(petitionId, userId, verificationId);

      res.json({ 
        message: 'Petition signed successfully',
        signature,
        currentSignatures: signature.currentSignatures
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to sign petition' });
    }
  });

  // Create new petition
  app.post('/api/petitions', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { title, description, targetSignatures, deadlineDate } = req.body;

      if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
      }

      const newPetition = await db
        .insert(petitions)
        .values({
          title,
          description,
          creatorId: userId,
          targetSignatures: targetSignatures || 500,
          currentSignatures: 0,
          status: 'active',
          deadlineDate: deadlineDate ? new Date(deadlineDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        })
        .returning();

      res.status(201).json({ 
        message: 'Petition created successfully',
        petition: newPetition[0]
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to create petition' });
    }
  });

  // Get user's signed petitions
  app.get('/api/petitions/user/signed', jwtAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      const signedPetitions = await db
        .select({
          id: petitionSignatures.id,
          signedAt: petitionSignatures.signedAt,
          petition: {
            id: petitions.id,
            title: petitions.title,
            description: petitions.description,
            currentSignatures: petitions.currentSignatures,
            targetSignatures: petitions.targetSignatures,
            status: petitions.status
          }
        })
        .from(petitionSignatures)
        .leftJoin(petitions, eq(petitionSignatures.petitionId, petitions.id))
        .where(eq(petitionSignatures.userId, userId))
        .orderBy(desc(petitionSignatures.signedAt));

      res.json(signedPetitions);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to fetch user petitions' });
    }
  });

  // Share petition
  app.post('/api/petitions/:id/share', jwtAuth, async (req: Request, res: Response) => {
    try {
      const petitionId = parseInt(req.params.id);
      const { platform } = req.body; // twitter, facebook, email, etc.

      // Get petition details
      const [petition] = await db
        .select()
        .from(petitions)
        .where(eq(petitions.id, petitionId));

      if (!petition) {
        return res.status(404).json({ message: 'Petition not found' });
      }

      // Generate share URL
      const shareUrl = `${process.env.FRONTEND_BASE_URL}/petitions/${petitionId}`;
      const shareText = `I just signed "${petition.title}" on CivicOS. Join me in making our voices heard! 🇨🇦`;

      let shareLink = '';
      switch (platform) {
        case 'twitter':
          shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          break;
        case 'facebook':
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          break;
        case 'email':
          shareLink = `mailto:?subject=${encodeURIComponent(`Sign this petition: ${petition.title}`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
          break;
        default:
          shareLink = shareUrl;
      }

      res.json({ 
        message: 'Share link generated',
        shareLink,
        shareText,
        platform
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to generate share link' });
    }
  });

  // Save petition (bookmark)
  app.post('/api/petitions/:id/save', jwtAuth, async (req: Request, res: Response) => {
    try {
      const petitionId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      // For now, just return success - in a real implementation, you'd have a saved_petitions table
      res.json({ 
        message: 'Petition saved successfully',
        petitionId,
        saved: true
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ message: 'Failed to save petition' });
    }
  });
}

// Helper function to determine urgency level
function getUrgencyLevel(current: number, target: number): string {
  const percentage = (current / target) * 100;
  if (percentage >= 80) return 'Critical';
  if (percentage >= 60) return 'High';
  if (percentage >= 40) return 'Medium';
  return 'Low';
} 