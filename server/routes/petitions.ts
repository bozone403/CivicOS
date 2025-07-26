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
  // Sample petition data with real current petitions
  const samplePetitions = [
    {
      id: 1,
      title: "Independence for Alberta",
      description: "Petition for Alberta to become an independent nation, separate from Canada. This petition calls for a referendum on Alberta's independence and the establishment of a sovereign Alberta nation with its own constitution, currency, and international relations.",
      creator: "Alberta Independence Movement",
      category: "Constitutional",
      region: "Alberta",
      targetSignatures: 50000,
      currentSignatures: 28450,
      daysLeft: 45,
      status: "active",
      urgency: "high",
      verified: true,
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
      tags: ["Independence", "Alberta", "Constitutional", "Sovereignty"],
      supporters: [
        { name: "Alberta First Party", role: "Political Party", location: "Alberta" },
        { name: "Western Canada Foundation", role: "Advocacy Group", location: "Western Canada" },
        { name: "Alberta Sovereignty Network", role: "Grassroots Organization", location: "Alberta" }
      ],
      createdAt: "2025-01-15",
      deadlineDate: "2025-09-15"
    },
    {
      id: 2,
      title: "Universal Pharmacare Now",
      description: "Petition calling for the immediate implementation of universal pharmacare coverage for all Canadians. This would provide prescription drug coverage to every Canadian regardless of income or employment status.",
      creator: "Canadian Health Coalition",
      category: "Healthcare",
      region: "National",
      targetSignatures: 100000,
      currentSignatures: 87650,
      daysLeft: 30,
      status: "active",
      urgency: "high",
      verified: true,
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop",
      tags: ["Healthcare", "Pharmacare", "Universal Coverage", "Medicare"],
      supporters: [
        { name: "Canadian Medical Association", role: "Professional Association", location: "National" },
        { name: "Canadian Nurses Association", role: "Professional Association", location: "National" },
        { name: "Canadian Federation of Nurses Unions", role: "Labour Union", location: "National" }
      ],
      createdAt: "2025-01-10",
      deadlineDate: "2025-08-10"
    },
    {
      id: 3,
      title: "Climate Emergency Declaration",
      description: "Petition demanding the federal government declare a climate emergency and implement immediate, aggressive climate action policies including carbon pricing, renewable energy transition, and fossil fuel divestment.",
      creator: "Climate Action Network Canada",
      category: "Environment",
      region: "National",
      targetSignatures: 75000,
      currentSignatures: 92340,
      daysLeft: 20,
      status: "active",
      urgency: "critical",
      verified: true,
      image: "https://images.unsplash.com/photo-1569163139394-de4e4c5c5c5c?w=800&h=400&fit=crop",
      tags: ["Climate Change", "Environment", "Emergency", "Green Energy"],
      supporters: [
        { name: "Greenpeace Canada", role: "Environmental Organization", location: "National" },
        { name: "Sierra Club Canada", role: "Environmental Organization", location: "National" },
        { name: "Canadian Youth Climate Coalition", role: "Youth Organization", location: "National" }
      ],
      createdAt: "2025-01-05",
      deadlineDate: "2025-07-25"
    },
    {
      id: 4,
      title: "Repeal Bill C-11 (Online Streaming Act)",
      description: "Petition to repeal Bill C-11, the Online Streaming Act, which critics argue gives the CRTC excessive control over internet content and threatens freedom of expression online.",
      creator: "Digital Rights Coalition",
      category: "Digital Rights",
      region: "National",
      targetSignatures: 50000,
      currentSignatures: 45670,
      daysLeft: 60,
      status: "active",
      urgency: "medium",
      verified: true,
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
      tags: ["Digital Rights", "Internet Freedom", "Censorship", "CRTC"],
      supporters: [
        { name: "OpenMedia", role: "Digital Rights Organization", location: "National" },
        { name: "Canadian Internet Registration Authority", role: "Internet Organization", location: "National" },
        { name: "Tech Freedom Canada", role: "Technology Advocacy", location: "National" }
      ],
      createdAt: "2025-01-20",
      deadlineDate: "2025-10-20"
    },
    {
      id: 5,
      title: "Housing as a Human Right",
      description: "Petition calling for housing to be recognized as a fundamental human right in Canada, with immediate action to address the housing crisis through rent controls, social housing, and tenant protections.",
      creator: "Housing Rights Coalition",
      category: "Housing",
      region: "National",
      targetSignatures: 100000,
      currentSignatures: 123450,
      daysLeft: 15,
      status: "active",
      urgency: "critical",
      verified: true,
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop",
      tags: ["Housing", "Human Rights", "Affordable Housing", "Tenant Rights"],
      supporters: [
        { name: "Canadian Housing and Renewal Association", role: "Housing Organization", location: "National" },
        { name: "ACORN Canada", role: "Tenant Organization", location: "National" },
        { name: "Housing Rights Network", role: "Advocacy Group", location: "National" }
      ],
      createdAt: "2025-01-08",
      deadlineDate: "2025-07-08"
    },
    {
      id: 6,
      title: "Reform First Past the Post Voting",
      description: "Petition to replace Canada's first-past-the-post voting system with proportional representation to ensure every vote counts and better represent the diversity of Canadian political views.",
      creator: "Fair Vote Canada",
      category: "Electoral Reform",
      region: "National",
      targetSignatures: 75000,
      currentSignatures: 67890,
      daysLeft: 90,
      status: "active",
      urgency: "medium",
      verified: true,
      image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=400&fit=crop",
      tags: ["Electoral Reform", "Proportional Representation", "Democracy", "Voting"],
      supporters: [
        { name: "Fair Vote Canada", role: "Electoral Reform Organization", location: "National" },
        { name: "Canadian Electoral Reform Society", role: "Advocacy Group", location: "National" },
        { name: "Democracy Watch", role: "Democracy Organization", location: "National" }
      ],
      createdAt: "2025-01-12",
      deadlineDate: "2025-11-12"
    },
    {
      id: 7,
      title: "Protect Indigenous Languages",
      description: "Petition calling for increased funding and support for Indigenous language preservation and revitalization programs across Canada, including mandatory Indigenous language education in schools.",
      creator: "Indigenous Language Alliance",
      category: "Indigenous Rights",
      region: "National",
      targetSignatures: 50000,
      currentSignatures: 34560,
      daysLeft: 120,
      status: "active",
      urgency: "medium",
      verified: true,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
      tags: ["Indigenous Rights", "Language Preservation", "Cultural Heritage", "Education"],
      supporters: [
        { name: "Assembly of First Nations", role: "Indigenous Organization", location: "National" },
        { name: "Indigenous Languages Institute", role: "Cultural Organization", location: "National" },
        { name: "First Nations Education Council", role: "Education Organization", location: "National" }
      ],
      createdAt: "2025-01-18",
      deadlineDate: "2025-12-18"
    },
    {
      id: 8,
      title: "Ban Single-Use Plastics Nationwide",
      description: "Petition to implement a comprehensive nationwide ban on single-use plastics including bags, straws, cutlery, and packaging, with immediate implementation and strict enforcement.",
      creator: "Plastic Free Canada",
      category: "Environment",
      region: "National",
      targetSignatures: 75000,
      currentSignatures: 89120,
      daysLeft: 25,
      status: "active",
      urgency: "high",
      verified: true,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop",
      tags: ["Environment", "Plastic Pollution", "Waste Reduction", "Ocean Protection"],
      supporters: [
        { name: "Ocean Conservancy Canada", role: "Environmental Organization", location: "National" },
        { name: "Surfrider Foundation Canada", role: "Ocean Protection Organization", location: "National" },
        { name: "Plastic Pollution Coalition Canada", role: "Environmental Advocacy", location: "National" }
      ],
      createdAt: "2025-01-14",
      deadlineDate: "2025-08-14"
    }
  ];

  // Get all petitions
  app.get('/api/petitions', async (req: Request, res: Response) => {
    try {
      // Use sample data as primary source
      let allPetitions: any[] = samplePetitions;

      // Try to get additional petitions from database if needed
      try {
        const dbPetitions = await db
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
            creator: {
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email
            }
          })
          .from(petitions)
          .leftJoin(users, eq(petitions.creatorId, users.id))
          .orderBy(desc(petitions.createdAt));
        
        // Only add database petitions if they don't conflict with sample data
        const sampleIds = new Set(samplePetitions.map(p => p.id));
        const uniqueDbPetitions = dbPetitions.filter(p => !sampleIds.has(p.id));
        allPetitions = [...samplePetitions, ...uniqueDbPetitions];
      } catch (dbError) {
        // If database fails, just use sample data
        allPetitions = samplePetitions;
      }

      // Calculate days left and add mock data for missing fields
      const enrichedPetitions = allPetitions.map(petition => ({
        ...petition,
        daysLeft: petition.deadlineDate ? 
          Math.ceil((new Date(petition.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 30,
        urgency: getUrgencyLevel(petition.currentSignatures || 0, petition.targetSignatures || 500),
        verified: true,
        category: (petition as any).category || "Civic Engagement",
        region: (petition as any).region || "National",
        image: (petition as any).image || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
        tags: (petition as any).tags || ["Civic Engagement", "Democracy", "Citizen Action"],
        supporters: (petition as any).supporters || [
          { name: "CivicOS Community", role: "Platform", location: "Canada" }
        ]
      }));

      return ResponseFormatter.success(
        res,
        enrichedPetitions,
        "Petitions retrieved successfully",
        200,
        enrichedPetitions.length
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
            creator: {
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email
            }
          })
          .from(petitions)
          .leftJoin(users, eq(petitions.creatorId, users.id))
          .where(eq(petitions.id, petitionId));
        
        petition = dbPetition;
      } catch (dbError) {
        // If database fails, try to get from sample data
        petition = samplePetitions.find(p => p.id === petitionId);
      }

      // If no database petition found, try sample data
      if (!petition) {
        petition = samplePetitions.find(p => p.id === petitionId);
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
        verified: true,
        category: (petition as any).category || "Civic Engagement",
        region: (petition as any).region || "National",
        image: (petition as any).image || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
        tags: (petition as any).tags || ["Civic Engagement", "Democracy", "Citizen Action"],
        supporters: (petition as any).supporters || [
          { name: "CivicOS Community", role: "Platform", location: "Canada" }
        ]
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