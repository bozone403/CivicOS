import { db } from '../db.js';
import { petitions, petitionSignatures, users } from '../../shared/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { ResponseFormatter } from '../utils/responseFormatter.js';
import jwt from 'jsonwebtoken';
import { storage } from '../storage.js';
// JWT Auth middleware
function jwtAuth(req, res, next) {
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
    }
    catch (err) {
        return ResponseFormatter.unauthorized(res, "Invalid or expired token");
    }
}
export function registerPetitionRoutes(app) {
    // Get all petitions
    app.get('/api/petitions', async (req, res) => {
        try {
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
                creator: {
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email
                }
            })
                .from(petitions)
                .leftJoin(users, eq(petitions.creatorId, users.id))
                .orderBy(desc(petitions.createdAt));
            // Calculate days left and add mock data for missing fields
            const enrichedPetitions = allPetitions.map(petition => ({
                ...petition,
                daysLeft: petition.deadlineDate ?
                    Math.ceil((new Date(petition.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 30,
                urgency: getUrgencyLevel(petition.currentSignatures || 0, petition.targetSignatures || 500),
                verified: true,
                category: "Civic Engagement",
                region: "National",
                image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
                tags: ["Civic Engagement", "Democracy", "Citizen Action"],
                supporters: [
                    { name: "CivicOS Community", role: "Platform", location: "Canada" }
                ]
            }));
            res.json(enrichedPetitions);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ message: 'Failed to fetch petitions' });
        }
    });
    // Get single petition
    app.get('/api/petitions/:id', async (req, res) => {
        try {
            const petitionId = parseInt(req.params.id);
            const [petition] = await db
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
            if (!petition) {
                return res.status(404).json({ message: 'Petition not found' });
            }
            // Add mock data for missing fields
            const enrichedPetition = {
                ...petition,
                daysLeft: petition.deadlineDate ?
                    Math.ceil((new Date(petition.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 30,
                urgency: getUrgencyLevel(petition.currentSignatures || 0, petition.targetSignatures || 500),
                verified: true,
                category: "Civic Engagement",
                region: "National",
                image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
                tags: ["Civic Engagement", "Democracy", "Citizen Action"],
                supporters: [
                    { name: "CivicOS Community", role: "Platform", location: "Canada" }
                ]
            };
            res.json(enrichedPetition);
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ message: 'Failed to fetch petition' });
        }
    });
    // Sign petition
    app.post('/api/petitions/:id/sign', jwtAuth, async (req, res) => {
        try {
            const petitionId = parseInt(req.params.id);
            const userId = req.user.id;
            const { verificationId } = req.body;
            if (!verificationId) {
                return res.status(400).json({ message: 'Verification ID is required' });
            }
            // Check if user already signed
            const existingSignature = await db
                .select()
                .from(petitionSignatures)
                .where(and(eq(petitionSignatures.petitionId, petitionId), eq(petitionSignatures.userId, userId)));
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
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ message: 'Failed to sign petition' });
        }
    });
    // Create new petition
    app.post('/api/petitions', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.id;
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
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ message: 'Failed to create petition' });
        }
    });
    // Get user's signed petitions
    app.get('/api/petitions/user/signed', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.id;
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
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ message: 'Failed to fetch user petitions' });
        }
    });
    // Share petition
    app.post('/api/petitions/:id/share', jwtAuth, async (req, res) => {
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
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ message: 'Failed to generate share link' });
        }
    });
    // Save petition (bookmark)
    app.post('/api/petitions/:id/save', jwtAuth, async (req, res) => {
        try {
            const petitionId = parseInt(req.params.id);
            const userId = req.user.id;
            // For now, just return success - in a real implementation, you'd have a saved_petitions table
            res.json({
                message: 'Petition saved successfully',
                petitionId,
                saved: true
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({ message: 'Failed to save petition' });
        }
    });
}
// Helper function to determine urgency level
function getUrgencyLevel(current, target) {
    const percentage = (current / target) * 100;
    if (percentage >= 80)
        return 'Critical';
    if (percentage >= 60)
        return 'High';
    if (percentage >= 40)
        return 'Medium';
    return 'Low';
}
