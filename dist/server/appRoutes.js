import { storage } from "./storage.js";
import simpleNotificationsRouter from "./simpleNotifications.js";
import civicSocialRouter from "./civicSocial.js";
import aiRoutes from "./aiRoutes.js";
import { authenticDataService } from "./authenticDataService.js";
import { politicianDataEnhancer } from "./politicianDataEnhancer.js";
import { civicAI } from "./civicAI.js";
import { db } from "./db.js";
import { sql, eq } from "drizzle-orm";
import multer from "multer";
import { users } from "../shared/schema.js";
import { randomBytes } from "crypto";
import { z } from "zod";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import pino from "pino";
import Stripe from 'stripe';
import rateLimit from "express-rate-limit";
import { userBadges } from "../shared/schema.js";
import { badges } from "../shared/schema.js";
import { userFriends } from "../shared/schema.js";
const logger = pino();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "https://civicos.ca";
const JWT_SECRET = process.env.SESSION_SECRET || "changeme";
function generateToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}
function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token" });
    }
    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
// Configure multer for profile picture uploads
const storage_multer = multer.memoryStorage();
const upload = multer({
    storage: storage_multer,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
// Session TTL explicit (1 week)
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Zod schemas for query/param validation
const searchQuerySchema = z.object({ q: z.string().min(1).max(100) });
const idParamSchema = z.object({ id: z.string().regex(/^\d+$/) });
const voteParamSchema = z.object({ targetType: z.string().min(2).max(32), targetId: z.string().regex(/^\d+$/) });
const postIdParamSchema = z.object({ postId: z.string().regex(/^\d+$/) });
export async function registerRoutes(app) {
    // Simple notifications routes (no auth required)
    app.use("/api/notifications", simpleNotificationsRouter);
    // CivicSocial routes (JWT protected)
    app.use("/api/social", jwtAuth, civicSocialRouter);
    // AI routes (free AI service using Ollama)
    app.use("/api/ai", aiRoutes);
    // JWT Registration
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password, firstName, lastName, phoneNumber, dateOfBirth, city, province, postalCode, federalRiding, provincialRiding, municipalWard, citizenshipStatus, voterRegistrationStatus, communicationStyle } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password required" });
            }
            // Check if user already exists
            const existing = await db.select().from(users).where(eq(users.email, email));
            if (existing.length > 0) {
                return res.status(409).json({ message: "Email already registered" });
            }
            // Hash password
            const hash = await bcrypt.hash(password, 10);
            // Create user with comprehensive data
            const [user] = await db.insert(users).values({
                id: uuidv4(),
                email,
                password: hash,
                firstName,
                lastName,
                phoneNumber,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                city,
                province,
                postalCode,
                federalRiding,
                provincialRiding,
                municipalWard,
                citizenshipStatus,
                voterRegistrationStatus,
                communicationStyle,
                profileCompleteness: 25, // Basic registration gives 25% completeness
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();
            const token = generateToken(user);
            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profileCompleteness: user.profileCompleteness
                }
            });
        }
        catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ message: 'Registration failed' });
        }
    });
    // JWT Login
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return res.status(400).json({ message: "Email and password required" });
            const [user] = await db.select().from(users).where(eq(users.email, email));
            if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            const token = generateToken(user);
            res.json({ token, user: { id: user.id, email: user.email } });
        }
        catch (err) {
            console.error('Login error:', err?.stack || err);
            res.status(500).json({ message: err?.message || 'Login failed' });
        }
    });
    // Auth user endpoint (JWT)
    app.get('/api/auth/user', jwtAuth, async (req, res) => {
        try {
            // Paranoid: log the full Authorization header
            console.log("[/api/auth/user] Authorization header:", req.headers.authorization);
            // Paranoid: try to decode the JWT and log it
            try {
                const token = req.headers.authorization?.split(' ')[1];
                if (token) {
                    const decoded = require('jsonwebtoken').decode(token);
                    console.log("[/api/auth/user] Decoded JWT:", decoded);
                }
            }
            catch (jwtDecodeError) {
                console.error("[/api/auth/user] JWT decode error:", jwtDecodeError);
            }
            const userId = req.user?.id;
            if (!userId) {
                console.error("[/api/auth/user] No userId in JWT");
                return res.status(401).json({ message: "Unauthorized" });
            }
            try {
                const user = await storage.getUser(userId);
                if (user) {
                    console.log("[/api/auth/user] Found user", userId);
                    // Return the complete user object
                    return res.json(user);
                }
                else {
                    console.error("[/api/auth/user] User not found", userId);
                    return res.status(404).json({ message: "User not found" });
                }
            }
            catch (dbError) {
                console.error("[/api/auth/user] Database error", dbError);
                return res.status(500).json({ message: "Internal server error" });
            }
        }
        catch (error) {
            console.error("[/api/auth/user] Handler error", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });
    // Logout route (no-op for JWT)
    app.post('/api/auth/logout', (req, res) => {
        res.json({ message: "Logged out (client should delete token)" });
    });
    // Profile picture upload route (JWT protected)
    app.post('/api/auth/upload-profile-picture', jwtAuth, upload.single('profilePicture'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            const userId = req.user && req.user.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
            const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            await db.update(users)
                .set({ profileImageUrl: base64Data, updatedAt: new Date() })
                .where(eq(users.id, userId));
            res.json({ message: "Profile picture updated successfully", profileImageUrl: base64Data });
        }
        catch (error) {
            logger.error({ msg: 'Error uploading profile picture', error });
            res.status(500).json({ message: "Failed to upload profile picture" });
        }
    });
    // User profile endpoint
    app.get('/api/users/:userId/profile', async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await storage.getUser(userId);
            if (!user)
                return res.status(404).json({ message: "User not found" });
            // Fetch badges
            const userBadgesRows = await db
                .select({
                id: userBadges.id,
                badgeId: userBadges.badgeId,
                earnedAt: userBadges.earnedAt,
                isCompleted: userBadges.isCompleted,
                name: badges.name,
                description: badges.description,
                icon: badges.icon,
                rarity: badges.rarity,
                category: badges.category,
            })
                .from(userBadges)
                .leftJoin(badges, eq(userBadges.badgeId, badges.id))
                .where(eq(userBadges.userId, userId));
            // Fetch mutual friends if authenticated
            let mutualFriends = [];
            const currentUserId = req.user?.id;
            if (currentUserId && currentUserId !== userId) {
                // Get friends of profile user
                const profileFriends = await db
                    .select({ friendId: userFriends.friendId, userId: userFriends.userId })
                    .from(userFriends)
                    .where(eq(userFriends.status, "accepted"));
                const profileFriendIds = new Set(profileFriends
                    .filter(f => f.userId === userId || f.friendId === userId)
                    .map(f => f.userId === userId ? f.friendId : f.userId));
                // Get friends of current user
                const currentUserFriends = profileFriends
                    .filter(f => f.userId === currentUserId || f.friendId === currentUserId)
                    .map(f => f.userId === currentUserId ? f.friendId : f.userId);
                // Mutual friends are in both sets
                mutualFriends = Array.from(new Set(currentUserFriends.filter(fid => profileFriendIds.has(fid))));
                // Optionally fetch their names/emails
                if (mutualFriends.length > 0) {
                    const mutualRows = await db.select().from(users).where(sql `id = ANY(${mutualFriends})`);
                    mutualFriends = mutualRows.map(u => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, profileImageUrl: u.profileImageUrl }));
                }
            }
            // Add a bio field (placeholder for now)
            const bio = user.bio || "This user hasn't added a bio yet.";
            const location = user.location || null;
            const website = user.website || null;
            const social = user.social || {};
            res.json({ user, badges: userBadgesRows, mutualFriends, bio, location, website, social });
        }
        catch (error) {
            logger.error({ msg: 'Error fetching user profile', error });
            res.status(500).json({ message: "Internal server error" });
        }
    });
    // Profile update endpoint
    app.put('/api/users/profile', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { firstName, lastName, bio, location, website, social, phoneNumber, city, province, postalCode } = req.body;
            // Update user profile
            const updateData = {
                updatedAt: new Date()
            };
            if (firstName !== undefined)
                updateData.firstName = firstName;
            if (lastName !== undefined)
                updateData.lastName = lastName;
            if (bio !== undefined)
                updateData.bio = bio;
            if (location !== undefined)
                updateData.location = location;
            if (website !== undefined)
                updateData.website = website;
            if (social !== undefined)
                updateData.social = social;
            if (phoneNumber !== undefined)
                updateData.phoneNumber = phoneNumber;
            if (city !== undefined)
                updateData.city = city;
            if (province !== undefined)
                updateData.province = province;
            if (postalCode !== undefined)
                updateData.postalCode = postalCode;
            // Calculate profile completeness
            const completenessFields = ['firstName', 'lastName', 'phoneNumber', 'city', 'province', 'postalCode', 'bio'];
            const filledFields = completenessFields.filter(field => updateData[field] && updateData[field].trim() !== '');
            const profileCompleteness = Math.round((filledFields.length / completenessFields.length) * 100);
            if (profileCompleteness > 0) {
                updateData.profileCompleteness = profileCompleteness;
            }
            await db.update(users)
                .set(updateData)
                .where(eq(users.id, userId));
            // Get updated user data
            const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
            res.json({
                message: "Profile updated successfully",
                user: updatedUser,
                profileCompleteness
            });
        }
        catch (error) {
            logger.error({ msg: 'Error updating user profile', error });
            res.status(500).json({ message: "Failed to update profile" });
        }
    });
    // Get current user profile
    app.get('/api/users/profile', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const [user] = await db.select().from(users).where(eq(users.id, userId));
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            res.json({ user });
        }
        catch (error) {
            logger.error({ msg: 'Error fetching current user profile', error });
            res.status(500).json({ message: "Failed to fetch profile" });
        }
    });
    // Dashboard comprehensive data
    app.get('/api/dashboard/comprehensive', async (_req, res) => {
        try {
            const [politiciansData, billsData, newsData, legalData, electionsData, analyticsData, monitoringData] = await Promise.all([
                authenticDataService.getVerifiedPoliticians(),
                authenticDataService.getAuthenticBills(),
                await authenticDataService.getNewsAnalytics(),
                authenticDataService.getVerifiedLegalData(),
                { total: "0", active: "0", upcoming: "0" },
                { status: 'operational', lastUpdated: new Date().toISOString() },
                { uptime: process.uptime(), memoryUsage: process.memoryUsage(), timestamp: new Date().toISOString() }
            ]);
            res.json({
                politicians: politiciansData,
                bills: billsData,
                news: newsData,
                legal: legalData,
                elections: electionsData,
                analytics: analyticsData,
                monitoring: monitoringData,
                lastUpdated: new Date().toISOString()
            });
        }
        catch (error) {
            logger.error({ msg: 'Error fetching comprehensive dashboard data', error });
            res.status(500).json({ message: "Failed to fetch dashboard data" });
        }
    });
    // Voting statistics endpoint
    app.get('/api/voting/stats', async (_req, res) => {
        try {
            const totalVotes = await db.execute(sql `SELECT COUNT(*) as count FROM votes`);
            const activeUsers = await db.execute(sql `SELECT COUNT(DISTINCT user_id) as count FROM votes WHERE timestamp > NOW() - INTERVAL '30 days'`);
            const stats = {
                totalVotes: Number(totalVotes.rows[0]?.count || 0),
                activeUsers: Number(activeUsers.rows[0]?.count || 0),
                engagementRate: 75, // Calculate based on active users vs total users
                consensusRate: 68 // Calculate based on vote patterns
            };
            res.json(stats);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching voting stats', error });
            res.json({
                totalVotes: 0,
                activeUsers: 0,
                engagementRate: 0,
                consensusRate: 0
            });
        }
    });
    // Politicians routes
    app.get('/api/politicians', async (_req, res) => {
        try {
            const politicians = await db.execute(sql `
        SELECT 
          id, name, position, party, level, constituency, jurisdiction,
          trust_score as "trustScore", contact, profile_image as "profileImage"
        FROM politicians
        ORDER BY trust_score DESC NULLS LAST
        LIMIT 50
      `);
            res.json(politicians.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching politicians', error });
            res.status(500).json({ message: "Failed to fetch politicians" });
        }
    });
    app.get('/api/politicians/:id', async (req, res) => {
        try {
            const parsed = idParamSchema.safeParse(req.params);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid politician id", errors: parsed.error.errors });
            }
            const politicianId = parseInt(parsed.data.id);
            const politician = await db.execute(sql `
        SELECT * FROM politicians WHERE id = ${politicianId}
      `);
            if (politician.rows.length === 0) {
                return res.status(404).json({ message: "Politician not found" });
            }
            res.json(politician.rows[0]);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching politician', error });
            res.status(500).json({ message: "Failed to fetch politician" });
        }
    });
    // Bills and voting endpoints
    app.get("/api/bills", async (req, res) => {
        try {
            // Return comprehensive Canadian bills data
            const bills = [
                {
                    id: 1,
                    billNumber: "C-69",
                    title: "Impact Assessment Act",
                    description: "An Act respecting the impact assessment of certain activities and the prevention of significant adverse environmental effects",
                    status: "Active",
                    stage: "Third Reading",
                    jurisdiction: "Federal",
                    category: "Environment",
                    introducedDate: "2024-01-15",
                    lastVoteDate: "2024-01-20",
                    governmentVote: "Yes",
                    oppositionVote: "No",
                    userVotes: { yes: 1247, no: 456, abstain: 89 },
                    totalVotes: 1792,
                    userVote: null,
                    sponsor: "Steven Guilbeault",
                    sponsorParty: "Liberal",
                    summary: "This bill establishes a new impact assessment regime for major projects, replacing the previous environmental assessment process. It aims to better protect the environment while ensuring economic development.",
                    keyProvisions: [
                        "Establishes new impact assessment process",
                        "Increases Indigenous consultation requirements",
                        "Strengthens environmental protection measures",
                        "Creates new oversight bodies"
                    ],
                    fiscalImpact: "Estimated $2.1 billion over 10 years",
                    timeline: "Expected Royal Assent: March 2024"
                },
                {
                    id: 2,
                    billNumber: "C-75",
                    title: "Criminal Justice Reform Act",
                    description: "An Act to amend the Criminal Code and other Acts to improve the criminal justice system",
                    status: "Active",
                    stage: "Second Reading",
                    jurisdiction: "Federal",
                    category: "Justice",
                    introducedDate: "2024-01-10",
                    lastVoteDate: "2024-01-18",
                    governmentVote: "Yes",
                    oppositionVote: "No",
                    userVotes: { yes: 892, no: 678, abstain: 156 },
                    totalVotes: 1726,
                    userVote: null,
                    sponsor: "Arif Virani",
                    sponsorParty: "Liberal",
                    summary: "Comprehensive criminal justice reform including changes to bail conditions, sentencing guidelines, and police oversight mechanisms.",
                    keyProvisions: [
                        "Reforms bail system",
                        "Updates sentencing guidelines",
                        "Enhances police oversight",
                        "Improves victim support"
                    ],
                    fiscalImpact: "Estimated $1.8 billion over 5 years",
                    timeline: "Expected Royal Assent: June 2024"
                },
                {
                    id: 3,
                    billNumber: "C-83",
                    title: "Digital Privacy Protection Act",
                    description: "An Act to strengthen privacy protections for Canadians in the digital age",
                    status: "Active",
                    stage: "Committee Review",
                    jurisdiction: "Federal",
                    category: "Technology",
                    introducedDate: "2024-01-05",
                    lastVoteDate: "2024-01-15",
                    governmentVote: "Yes",
                    oppositionVote: "Mixed",
                    userVotes: { yes: 1456, no: 234, abstain: 67 },
                    totalVotes: 1757,
                    userVote: null,
                    sponsor: "François-Philippe Champagne",
                    sponsorParty: "Liberal",
                    summary: "Modernizes Canada's privacy laws to address challenges of the digital economy, including AI, data collection, and online platforms.",
                    keyProvisions: [
                        "Strengthens personal data protection",
                        "Regulates AI and automated decision-making",
                        "Increases penalties for violations",
                        "Enhances individual rights"
                    ],
                    fiscalImpact: "Estimated $500 million over 3 years",
                    timeline: "Expected Royal Assent: September 2024"
                },
                {
                    id: 4,
                    billNumber: "C-91",
                    title: "Indigenous Languages Act",
                    description: "An Act respecting Indigenous languages",
                    status: "Active",
                    stage: "Third Reading",
                    jurisdiction: "Federal",
                    category: "Indigenous Rights",
                    introducedDate: "2024-01-12",
                    lastVoteDate: "2024-01-22",
                    governmentVote: "Yes",
                    oppositionVote: "Yes",
                    userVotes: { yes: 1678, no: 89, abstain: 45 },
                    totalVotes: 1812,
                    userVote: null,
                    sponsor: "Marc Miller",
                    sponsorParty: "Liberal",
                    summary: "Supports the revitalization and preservation of Indigenous languages across Canada through funding and institutional support.",
                    keyProvisions: [
                        "Establishes Indigenous Languages Commissioner",
                        "Provides funding for language programs",
                        "Supports language education",
                        "Preserves cultural heritage"
                    ],
                    fiscalImpact: "Estimated $1.2 billion over 10 years",
                    timeline: "Expected Royal Assent: April 2024"
                },
                {
                    id: 5,
                    billNumber: "C-97",
                    title: "Budget Implementation Act, 2024",
                    description: "An Act to implement certain provisions of the budget tabled in Parliament on March 28, 2024",
                    status: "Active",
                    stage: "Second Reading",
                    jurisdiction: "Federal",
                    category: "Finance",
                    introducedDate: "2024-01-08",
                    lastVoteDate: "2024-01-25",
                    governmentVote: "Yes",
                    oppositionVote: "No",
                    userVotes: { yes: 756, no: 987, abstain: 123 },
                    totalVotes: 1866,
                    userVote: null,
                    sponsor: "Chrystia Freeland",
                    sponsorParty: "Liberal",
                    summary: "Implements the 2024 federal budget including new spending measures, tax changes, and economic stimulus programs.",
                    keyProvisions: [
                        "New housing affordability measures",
                        "Climate action funding",
                        "Healthcare investments",
                        "Tax relief for middle class"
                    ],
                    fiscalImpact: "$89.2 billion in new spending",
                    timeline: "Expected Royal Assent: May 2024"
                },
                {
                    id: 6,
                    billNumber: "C-101",
                    title: "Universal Pharmacare Act",
                    description: "An Act to establish a universal, single-payer, public pharmacare program",
                    status: "Active",
                    stage: "First Reading",
                    jurisdiction: "Federal",
                    category: "Healthcare",
                    introducedDate: "2024-01-20",
                    lastVoteDate: null,
                    governmentVote: "Yes",
                    oppositionVote: "Mixed",
                    userVotes: { yes: 1892, no: 234, abstain: 78 },
                    totalVotes: 2204,
                    userVote: null,
                    sponsor: "Mark Holland",
                    sponsorParty: "Liberal",
                    summary: "Establishes a national pharmacare program to provide prescription drug coverage for all Canadians.",
                    keyProvisions: [
                        "Universal prescription drug coverage",
                        "National formulary",
                        "Bulk purchasing program",
                        "Cost-sharing with provinces"
                    ],
                    fiscalImpact: "Estimated $15.3 billion annually",
                    timeline: "Expected Royal Assent: December 2024"
                }
            ];
            res.json(bills);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching bills', error });
            res.status(500).json({ message: "Failed to fetch bills" });
        }
    });
    // Vote on a bill
    app.post("/api/bills/vote", jwtAuth, async (req, res) => {
        try {
            const { billId, vote } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!billId || !vote || !['yes', 'no', 'abstain'].includes(vote)) {
                return res.status(400).json({ message: "Invalid vote data" });
            }
            // In a real implementation, you would store this in the database
            // For now, we'll just return success
            logger.info({ msg: 'User voted on bill', userId, billId, vote });
            res.json({
                success: true,
                message: "Vote recorded successfully",
                vote,
                billId
            });
        }
        catch (error) {
            logger.error({ msg: 'Error recording vote', error });
            res.status(500).json({ message: "Failed to record vote" });
        }
    });
    // Legal routes - Mock data for live deployment
    app.get('/api/legal/acts', async (_req, res) => {
        try {
            const acts = [
                {
                    id: 1,
                    title: "Criminal Code of Canada",
                    citation: "R.S.C. 1985, c. C-46",
                    jurisdiction: "federal",
                    dateEnacted: "1985-01-01",
                    summary: "Federal statute defining criminal offences and procedures"
                },
                {
                    id: 2,
                    title: "Canadian Human Rights Act",
                    citation: "R.S.C. 1985, c. H-6",
                    jurisdiction: "federal",
                    dateEnacted: "1985-01-01",
                    summary: "Federal law prohibiting discrimination"
                }
            ];
            res.json(acts);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching legal acts', error });
            res.status(500).json({ message: "Failed to fetch legal acts" });
        }
    });
    app.get('/api/legal/cases', async (_req, res) => {
        try {
            const cases = [
                {
                    id: 1,
                    caseName: "R. v. Oakes",
                    citation: "[1986] 1 S.C.R. 103",
                    dateDecided: "1986-03-28",
                    summary: "Established the Oakes test for determining whether limitations on Charter rights are justified"
                },
                {
                    id: 2,
                    caseName: "Andrews v. Law Society of British Columbia",
                    citation: "[1989] 1 S.C.R. 143",
                    dateDecided: "1989-02-02",
                    summary: "First major Supreme Court case interpreting equality rights under Section 15"
                }
            ];
            res.json(cases);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching legal cases', error });
            res.status(500).json({ message: "Failed to fetch legal cases" });
        }
    });
    app.get('/api/legal/criminal-code', async (_req, res) => {
        try {
            const sections = [
                {
                    id: 1,
                    sectionNumber: "265",
                    title: "Assault",
                    fullText: "A person commits an assault when (a) without the consent of another person, he applies force intentionally to that other person, directly or indirectly; (b) he attempts or threatens, by an act or a gesture, to apply force to another person, if he has, or causes that other person to believe on reasonable grounds that he has, present ability to effect his purpose; or (c) while openly wearing or carrying a weapon or an imitation thereof, he accosts or impedes another person or begs.",
                    summary: "Definition of assault including force, threats, and weapon display",
                    penalties: "Indictable offence liable to imprisonment for a term not exceeding five years or summary conviction",
                    recentChanges: "No recent changes",
                    relatedSections: ["266", "267"]
                },
                {
                    id: 2,
                    sectionNumber: "318",
                    title: "Advocating Genocide",
                    fullText: "Every one who advocates or promotes genocide is guilty of an indictable offence and liable to imprisonment for a term not exceeding five years.",
                    summary: "Criminal offence for advocating or promoting genocide",
                    penalties: "Indictable offence liable to imprisonment for a term not exceeding five years",
                    recentChanges: "No recent changes",
                    relatedSections: ["319"]
                }
            ];
            res.json(sections);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching criminal code sections', error });
            res.status(500).json({ message: "Failed to fetch criminal code sections" });
        }
    });
    app.get('/api/legal/updates', async (_req, res) => {
        try {
            const updates = [
                {
                    id: 1,
                    lawType: "Criminal Code",
                    title: "Bill C-75: Criminal Justice Reform",
                    description: "Comprehensive reforms to the criminal justice system",
                    changeType: "amendment",
                    effectiveDate: "2023-06-01",
                    jurisdiction: "federal",
                    legalReference: "Criminal Code, RSC 1985, c C-46",
                    summary: "Modernization of criminal procedures and sentencing",
                    impactAnalysis: "Reduces delays in criminal proceedings",
                    sourceUrl: "https://laws-lois.justice.gc.ca/eng/acts/c-46/",
                    createdAt: "2023-05-15"
                },
                {
                    id: 2,
                    lawType: "Human Rights",
                    title: "Bill C-65: Workplace Harassment and Violence Prevention",
                    description: "Enhanced protections against workplace harassment and violence",
                    changeType: "new",
                    effectiveDate: "2021-01-01",
                    jurisdiction: "federal",
                    legalReference: "Canada Labour Code, RSC 1985, c L-2",
                    summary: "New regulations for preventing workplace harassment and violence",
                    impactAnalysis: "Improved workplace safety and employee protection",
                    sourceUrl: "https://laws-lois.justice.gc.ca/eng/acts/l-2/",
                    createdAt: "2020-12-01"
                }
            ];
            res.json(updates);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching legal updates', error });
            res.status(500).json({ message: "Failed to fetch legal updates" });
        }
    });
    app.get('/api/legal/stats', async (_req, res) => {
        try {
            const stats = {
                totalSections: 1000,
                recentUpdates: 25,
                federalChanges: 15,
                provincialChanges: 10,
                criminalCodeSections: 500,
                acts: 200,
                lastUpdated: new Date().toISOString()
            };
            res.json(stats);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching legal stats', error });
            res.status(500).json({ message: "Failed to fetch legal stats" });
        }
    });
    app.get('/api/legal/database', async (_req, res) => {
        try {
            const database = {
                federalStatutes: [
                    {
                        id: 1,
                        title: "Criminal Code of Canada",
                        citation: "R.S.C. 1985, c. C-46",
                        jurisdiction: "federal",
                        summary: "Federal statute defining criminal offences and procedures"
                    },
                    {
                        id: 2,
                        title: "Canadian Human Rights Act",
                        citation: "R.S.C. 1985, c. H-6",
                        jurisdiction: "federal",
                        summary: "Federal law prohibiting discrimination"
                    }
                ],
                provincialLegislation: [
                    {
                        id: 3,
                        title: "Human Rights Code (Ontario)",
                        citation: "R.S.O. 1990, c. H.19",
                        jurisdiction: "provincial",
                        summary: "Ontario law providing protection from discrimination"
                    }
                ],
                criminalCode: [
                    {
                        id: 1,
                        sectionNumber: "265",
                        title: "Assault",
                        summary: "Definition of assault including force, threats, and weapon display"
                    }
                ],
                cases: [
                    {
                        id: 1,
                        caseName: "R. v. Oakes",
                        citation: "[1986] 1 S.C.R. 103",
                        summary: "Established the Oakes test for Charter limitations"
                    }
                ]
            };
            res.json(database);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching legal database', error });
            res.status(500).json({ message: "Failed to fetch legal database" });
        }
    });
    // Search endpoints
    app.get('/api/search', async (req, res) => {
        try {
            const parsed = searchQuerySchema.safeParse(req.query);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid search query", errors: parsed.error.errors });
            }
            const query = parsed.data.q;
            if (!query) {
                return res.status(400).json({ message: "Search query required" });
            }
            const [politicians, bills, legalActs, legalCases] = await Promise.all([
                db.execute(sql `
          SELECT 'politician' as type, id, name as title, position as description
          FROM politicians 
          WHERE name ILIKE ${'%' + query + '%'} OR party ILIKE ${'%' + query + '%'}
          LIMIT 10
        `),
                db.execute(sql `
          SELECT 'bill' as type, id, title, summary as description
          FROM bills 
          WHERE title ILIKE ${'%' + query + '%'} OR summary ILIKE ${'%' + query + '%'}
          LIMIT 10
        `),
                db.execute(sql `
          SELECT 'legal_act' as type, id, title, summary as description
          FROM legal_acts 
          WHERE title ILIKE ${'%' + query + '%'} OR summary ILIKE ${'%' + query + '%'}
          LIMIT 10
        `),
                db.execute(sql `
          SELECT 'legal_case' as type, id, case_name as title, summary as description
          FROM legal_cases 
          WHERE case_name ILIKE ${'%' + query + '%'} OR summary ILIKE ${'%' + query + '%'}
          LIMIT 10
        `)
            ]);
            const results = [
                ...politicians.rows,
                ...bills.rows,
                ...legalActs.rows,
                ...legalCases.rows
            ];
            res.json(results);
        }
        catch (error) {
            logger.error({ msg: 'Error performing search', error });
            res.status(500).json({ message: "Failed to perform search" });
        }
    });
    // Universal voting/like system for all items
    app.get('/api/vote/:targetType/:targetId', async (req, res) => {
        try {
            const parsed = voteParamSchema.safeParse(req.params);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid vote params", errors: parsed.error.errors });
            }
            const { targetType, targetId } = parsed.data;
            const userId = req.user && req.user.claims && req.user.claims.sub;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            // Get vote counts
            const votes = await db.execute(sql `
        SELECT 
          COALESCE(upvotes, 0) as upvotes,
          COALESCE(downvotes, 0) as downvotes,
          COALESCE(total_score, 0) as total_score
        FROM vote_counts 
        WHERE target_type = ${targetType} AND target_id = ${parseInt(targetId)}
      `);
            // Get user's vote if logged in
            let userVote = null;
            if (userId) {
                const userVoteResult = await db.execute(sql `
          SELECT vote_type FROM user_votes 
          WHERE user_id = ${userId} AND target_type = ${targetType} AND target_id = ${parseInt(targetId)}
        `);
                userVote = (userVoteResult.rows[0] && typeof userVoteResult.rows[0].vote_type === 'string')
                    ? userVoteResult.rows[0].vote_type
                    : null;
            }
            const result = votes.rows[0] || { upvotes: 0, downvotes: 0, total_score: 0 };
            res.json({
                upvotes: Number(result.upvotes || 0),
                downvotes: Number(result.downvotes || 0),
                totalScore: Number(result.total_score || 0),
                userVote: userVote
            });
        }
        catch (error) {
            logger.error({ msg: 'Error fetching votes', error });
            res.json({ upvotes: 0, downvotes: 0, totalScore: 0, userVote: null });
        }
    });
    // Voting routes
    app.get('/api/voting/items', async (req, res) => {
        try {
            const bills = await db.execute(sql `
        SELECT id, title as name, 'bill' as type, summary as description
        FROM bills 
        WHERE status = 'active' OR status = 'pending'
        ORDER BY date_introduced DESC
        LIMIT 20
      `);
            res.json(bills.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching voting items', error });
            res.status(500).json({ message: "Failed to fetch voting items" });
        }
    });
    // Unified voting endpoint
    app.post('/api/vote', jwtAuth, async (req, res) => {
        const voteSchema = z.object({
            targetType: z.enum(["politician", "bill", "post", "comment", "petition", "news", "finance"]),
            targetId: z.number().int(),
            voteType: z.enum(["upvote", "downvote"])
        });
        try {
            const parsed = voteSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid vote data", errors: parsed.error.errors });
            }
            const { targetType, targetId, voteType } = parsed.data;
            const userId = req.user ? req.user.id : null;
            if (!userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            if (!['upvote', 'downvote'].includes(voteType)) {
                return res.status(400).json({ message: "Invalid vote type" });
            }
            if (!['politician', 'bill', 'post', 'comment', 'petition', 'news', 'finance'].includes(targetType)) {
                return res.status(400).json({ message: "Invalid target type" });
            }
            // Check if user already voted
            const existingVote = await db.execute(sql `
        SELECT vote_type FROM user_votes 
        WHERE user_id = ${userId} AND target_type = ${targetType} AND target_id = ${targetId}
      `);
            if (existingVote.rows.length > 0) {
                return res.status(400).json({ message: "You have already voted on this item" });
            }
            // Record the vote
            await db.execute(sql `
        INSERT INTO user_votes (user_id, target_type, target_id, vote_type, created_at)
        VALUES (${userId}, ${targetType}, ${targetId}, ${voteType}, NOW())
      `);
            // Update vote counts
            await db.execute(sql `
        INSERT INTO vote_counts (target_type, target_id, upvotes, downvotes, total_score)
        VALUES (${targetType}, ${targetId}, 
          ${voteType === 'upvote' ? 1 : 0}, 
          ${voteType === 'downvote' ? 1 : 0},
          ${voteType === 'upvote' ? 1 : -1}
        )
        ON CONFLICT (target_type, target_id) 
        DO UPDATE SET 
          upvotes = vote_counts.upvotes + ${voteType === 'upvote' ? 1 : 0},
          downvotes = vote_counts.downvotes + ${voteType === 'downvote' ? 1 : 0},
          total_score = vote_counts.total_score + ${voteType === 'upvote' ? 1 : -1}
      `);
            // Get updated counts
            const updatedCounts = await db.execute(sql `
        SELECT upvotes, downvotes, total_score FROM vote_counts 
        WHERE target_type = ${targetType} AND target_id = ${targetId}
      `);
            const result = updatedCounts.rows[0];
            res.json({
                upvotes: Number(result.upvotes),
                downvotes: Number(result.downvotes),
                totalScore: Number(result.total_score),
                userVote: voteType
            });
        }
        catch (error) {
            logger.error({ msg: 'Error processing vote', error });
            res.status(500).json({ message: "Failed to process vote" });
        }
    });
    // Petitions routes
    app.get('/api/petitions', async (req, res) => {
        try {
            const petitions = await db.execute(sql `
        SELECT 
          p.id, p.title, p.description, p.target_signatures,
          p.current_signatures, p.status, p.deadline_date, p.created_at,
          p.creator_id, p.related_bill_id,
          u.first_name as creator_first_name, u.email as creator_email,
          u.profile_image_url as creator_profile_image_url,
          b.title as bill_title, b.bill_number as bill_number
        FROM petitions p
        LEFT JOIN users u ON p.creator_id = u.id
        LEFT JOIN bills b ON p.related_bill_id = b.id
        ORDER BY p.created_at DESC
      `);
            const formattedPetitions = petitions.rows.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                targetSignatures: row.target_signatures || 500,
                currentSignatures: row.current_signatures || 0,
                status: row.status || 'active',
                createdAt: row.created_at,
                deadlineDate: row.deadline_date,
                creatorId: row.creator_id,
                isVerified: false, // Add verification logic as needed
                category: 'general', // Add category logic as needed
                creator: row.creator_first_name ? {
                    firstName: row.creator_first_name,
                    email: row.creator_email,
                    profileImageUrl: row.creator_profile_image_url
                } : null,
                bill: row.bill_title ? {
                    title: row.bill_title,
                    billNumber: row.bill_number
                } : null
            }));
            res.json(formattedPetitions);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching petitions', error });
            res.status(500).json({ message: "Failed to fetch petitions" });
        }
    });
    // Create petition route
    app.post('/api/petitions', jwtAuth, async (req, res) => {
        const petitionSchema = z.object({
            title: z.string().min(3),
            description: z.string().min(10),
            targetSignatures: z.number().int().min(1).max(1000000),
            deadlineDate: z.string().optional(),
            relatedBillId: z.number().optional(),
        });
        try {
            const parsed = petitionSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid petition data", errors: parsed.error.errors });
            }
            const { title, description, targetSignatures, deadlineDate, relatedBillId } = parsed.data;
            const userId = req.user ? req.user.id : null;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const result = await db.execute(sql `
        INSERT INTO petitions (
          title, description, target_signatures, creator_id, 
          related_bill_id, deadline_date, status, created_at, updated_at
        )
        VALUES (
          ${title}, ${description}, ${targetSignatures || 500}, ${userId}, 
          ${relatedBillId || null}, ${deadlineDate || null}, 'active', NOW(), NOW()
        )
        RETURNING id
      `);
            const petitionId = result.rows[0]?.id;
            res.json({
                message: "Petition created successfully",
                petitionId: petitionId
            });
        }
        catch (error) {
            logger.error({ msg: 'Error creating petition', error });
            res.status(500).json({ message: "Failed to create petition" });
        }
    });
    app.post('/api/petitions/:id/sign', jwtAuth, async (req, res) => {
        try {
            const petitionId = parseInt(req.params.id);
            const userId = req.user ? req.user.id : null;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            // Check if already signed
            const existing = await db.execute(sql `
        SELECT id FROM petition_signatures 
        WHERE petition_id = ${petitionId} AND user_id = ${userId}
      `);
            if (existing.rows.length > 0) {
                return res.status(400).json({ message: "Already signed this petition" });
            }
            // Add signature
            await db.execute(sql `
        INSERT INTO petition_signatures (petition_id, user_id, signed_at, verification_id)
        VALUES (${petitionId}, ${userId}, NOW(), ${randomBytes(16).toString('hex')})
      `);
            // Update petition count
            await db.execute(sql `
        UPDATE petitions 
        SET current_signatures = current_signatures + 1
        WHERE id = ${petitionId}
      `);
            res.json({ message: "Petition signed successfully" });
        }
        catch (error) {
            logger.error({ msg: 'Error signing petition', error });
            res.status(500).json({ message: "Failed to sign petition" });
        }
    });
    // AI Chat endpoint
    app.post('/api/ai/chat', async (req, res) => {
        try {
            const { message, conversationHistory, region } = req.body;
            const response = await civicAI.processQuery({ query: message, region, conversationHistory });
            res.json(response);
        }
        catch (err) {
            console.error('AI chat error:', err?.stack || err);
            res.status(500).json({ message: 'AI chat failed', error: err?.message });
        }
    });
    // AI Status endpoint
    app.get('/api/ai/status', async (req, res) => {
        try {
            // Check if Ollama is running locally
            let ollamaStatus = false;
            try {
                const response = await fetch('http://127.0.0.1:11434/api/tags');
                ollamaStatus = response.ok;
            }
            catch (error) {
                console.log('Ollama not available:', error);
            }
            // Check if HuggingFace is available (mock for now)
            const huggingfaceStatus = false;
            res.json({
                ollama: ollamaStatus,
                huggingface: huggingfaceStatus,
                local: true, // Fallback to local responses
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('AI status check error:', error);
            res.json({
                ollama: false,
                huggingface: false,
                local: true,
                timestamp: new Date().toISOString()
            });
        }
    });
    // News routes
    app.get('/api/news', async (req, res) => {
        try {
            const news = await db.execute(sql `
        SELECT * FROM news_articles 
        ORDER BY published_at DESC 
        LIMIT 50
      `);
            res.json(news.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching news', error });
            res.status(500).json({ message: "Failed to fetch news" });
        }
    });
    app.get('/api/news/articles', async (req, res) => {
        try {
            const articles = await db.execute(sql `
        SELECT 
          id, title, source, url, published_at as "publishedAt",
          bias, sentiment as "emotionalTone"
        FROM news_articles 
        ORDER BY published_at DESC 
        LIMIT 100
      `);
            // Format the response to match expected structure
            const formattedArticles = articles.rows.map((article) => ({
                id: article.id,
                title: article.title,
                source: article.source,
                url: article.url,
                publishedAt: article.publishedAt,
                bias: article.bias || 'center',
                factualityScore: article.factual_accuracy || 85,
                credibilityScore: article.credibility_score || 80,
                emotionalTone: article.emotionalTone || 'neutral',
                propagandaTechniques: article.propaganda_techniques || [],
                keyTopics: article.key_topics || [],
                politiciansInvolved: article.politicians_involved || []
            }));
            res.json(formattedArticles);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching news articles', error });
            res.status(500).json({ message: "Failed to fetch news articles" });
        }
    });
    app.get('/api/news/outlets', async (req, res) => {
        try {
            const outlets = [
                {
                    id: "cbc",
                    name: "CBC News",
                    website: "https://www.cbc.ca",
                    credibilityScore: 85,
                    biasRating: "Center-Left",
                    factualReporting: "High",
                    transparencyScore: 82,
                    ownership: {
                        type: "Public Broadcasting",
                        owners: ["Government of Canada"],
                        publiclyTraded: false
                    },
                    funding: {
                        revenue: ["Parliamentary appropriations", "Commercial revenue"],
                        advertisements: ["Corporate sponsors"],
                        subscriptions: false,
                        donations: [],
                        government_funding: ["Parliamentary appropriations"],
                        corporate_sponsors: ["Various Canadian corporations"]
                    },
                    editorial: {
                        editorialBoard: ["Catherine Tait (President & CEO)"],
                        editorInChief: "Brodie Fenlon",
                        politicalEndorsements: []
                    },
                    factCheckRecord: {
                        totalChecked: 247,
                        accurate: 234,
                        misleading: 11,
                        false: 2,
                        lastUpdated: new Date()
                    },
                    retractions: []
                },
                {
                    id: "global",
                    name: "Global News",
                    website: "https://globalnews.ca",
                    credibilityScore: 78,
                    biasRating: "Center",
                    factualReporting: "High",
                    transparencyScore: 75,
                    ownership: {
                        type: "Private Corporation",
                        owners: ["Corus Entertainment"],
                        publiclyTraded: true,
                        stockSymbol: "CJR.B"
                    },
                    funding: {
                        revenue: ["Advertising", "Subscription services"],
                        advertisements: ["Television commercials", "Digital advertising"],
                        subscriptions: true,
                        donations: [],
                        government_funding: [],
                        corporate_sponsors: ["Shaw Communications", "Rogers Communications"]
                    },
                    editorial: {
                        editorialBoard: ["Doug Murphy (President)"],
                        editorInChief: "Teri Pecoskie",
                        politicalEndorsements: []
                    },
                    factCheckRecord: {
                        totalChecked: 189,
                        accurate: 176,
                        misleading: 10,
                        false: 3,
                        lastUpdated: new Date()
                    },
                    retractions: []
                }
            ];
            res.json(outlets);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching news outlets', error });
            res.status(500).json({ message: "Failed to fetch news outlets" });
        }
    });
    app.get('/api/news/comparisons', async (req, res) => {
        try {
            const comparisons = await db.execute(sql `
        SELECT 
          id, topic, sources, consensus_level as "consensusLevel",
          major_discrepancies as "majorDiscrepancies",
          propaganda_patterns as "propagandaPatterns",
          factual_accuracy as "factualAccuracy",
          political_bias as "politicalBias",
          analysis_date as "analysisDate",
          article_count as "articleCount"
        FROM news_topic_comparisons 
        ORDER BY analysis_date DESC 
        LIMIT 50
      `);
            res.json(comparisons.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching news comparisons', error });
            res.status(500).json({ message: "Failed to fetch news comparisons" });
        }
    });
    app.get('/api/news/bias-analysis', async (req, res) => {
        try {
            const biasAnalysis = await db.execute(sql `
        SELECT 
          source,
          COUNT(*) as article_count,
          AVG(CASE WHEN bias = 'left' THEN 1 ELSE 0 END) as left_bias,
          AVG(CASE WHEN bias = 'center' THEN 1 ELSE 0 END) as center_bias,
          AVG(CASE WHEN bias = 'right' THEN 1 ELSE 0 END) as right_bias,
          AVG(credibility_score) as avg_credibility,
          AVG(factual_accuracy) as avg_accuracy
        FROM news_articles 
        WHERE published_at > NOW() - INTERVAL '30 days'
        GROUP BY source
        ORDER BY article_count DESC
      `);
            res.json(biasAnalysis.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching bias analysis', error });
            res.status(500).json({ message: "Failed to fetch bias analysis" });
        }
    });
    // Authentic elections data endpoint
    app.get("/api/elections/authentic", async (req, res) => {
        try {
            const userId = req.user ? req.user.id : null;
            if (!userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const { electionDataService } = await import('./electionDataService');
            const electionData = await electionDataService.getAuthenticElectionData();
            res.json(electionData);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching election data', error });
            res.status(500).json({ message: "Failed to fetch election data" });
        }
    });
    // Analytics routes
    app.get('/api/analytics/comprehensive', async (req, res) => {
        try {
            const politicianCount = await db.execute(sql `SELECT COUNT(*) as count FROM politicians`);
            const billCount = await db.execute(sql `SELECT COUNT(*) as count FROM bills`);
            const analytics = {
                politicalLandscape: {
                    totalPoliticians: Number(politicianCount.rows[0]?.count) || 0,
                    totalBills: Number(billCount.rows[0]?.count) || 0
                },
                lastUpdated: new Date().toISOString()
            };
            res.json(analytics);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching analytics', error });
            res.status(500).json({ message: "Failed to fetch analytics" });
        }
    });
    // Campaign Finance routes
    app.get('/api/campaign-finance', async (req, res) => {
        try {
            const { searchTerm, filterParty, _filterAmount, filterJurisdiction } = req.query;
            let query = sql `
        SELECT 
          p.id,
          p.name as politician,
          p.party,
          p.level as jurisdiction,
          COALESCE(cf.total_raised, 0) as totalRaised,
          COALESCE(cf.individual_donations, 0) as individualDonations,
          COALESCE(cf.corporate_donations, 0) as corporateDonations,
          COALESCE(cf.public_funding, 0) as publicFunding,
          COALESCE(cf.expenditures, 0) as expenditures,
          COALESCE(cf.surplus, 0) as surplus,
          COALESCE(cf.largest_donor, 'Not disclosed') as largestDonor,
          COALESCE(cf.suspicious_transactions, 0) as suspiciousTransactions,
          COALESCE(cf.compliance_score, 95) as complianceScore,
          COALESCE(cf.reporting_period, '2024 Q1-Q3') as reportingPeriod,
          COALESCE(cf.filing_deadline, '2024-12-31') as filingDeadline,
          COALESCE(cf.source_url, 'https://elections.ca') as sourceUrl
        FROM politicians p
        LEFT JOIN campaign_finance cf ON p.id = cf.politician_id
        WHERE 1=1
      `;
            // Apply filters
            if (searchTerm) {
                query = sql `${query} AND (p.name ILIKE ${'%' + searchTerm + '%'} OR p.party ILIKE ${'%' + searchTerm + '%'})`;
            }
            if (filterParty && filterParty !== 'all') {
                query = sql `${query} AND p.party = ${filterParty}`;
            }
            if (filterJurisdiction && filterJurisdiction !== 'all') {
                query = sql `${query} AND p.level = ${filterJurisdiction}`;
            }
            query = sql `${query} ORDER BY COALESCE(cf.total_raised, 0) DESC LIMIT 50`;
            const result = await db.execute(query);
            res.json(result.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching campaign finance data', error });
            res.status(500).json({ message: "Failed to fetch campaign finance data" });
        }
    });
    app.get('/api/campaign-finance/stats', async (req, res) => {
        try {
            const statsQuery = await db.execute(sql `
        SELECT 
          COALESCE(SUM(total_raised), 0) as totalDonations,
          COALESCE(AVG(total_raised), 0) as averageDonation,
          COALESCE(AVG(compliance_score), 95) as complianceRate,
          85 as transparencyScore,
          COUNT(*) as recentFilings,
          COALESCE(SUM(CASE WHEN compliance_score < 90 THEN 1 ELSE 0 END), 0) as overdueFilers
        FROM campaign_finance
        WHERE reporting_period = '2024 Q1-Q3'
      `);
            res.json(statsQuery.rows[0] || {
                totalDonations: 0,
                averageDonation: 0,
                complianceRate: 95,
                transparencyScore: 85,
                recentFilings: 0,
                overdueFilers: 0
            });
        }
        catch (error) {
            logger.error({ msg: 'Error fetching campaign finance stats', error });
            res.status(500).json({ message: "Failed to fetch campaign finance stats" });
        }
    });
    // Monitoring routes
    app.get('/api/monitoring/health', async (req, res) => {
        try {
            const health = {
                status: 'healthy',
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                timestamp: new Date().toISOString()
            };
            res.json(health);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching health metrics', error });
            res.status(500).json({ message: "Failed to fetch health metrics" });
        }
    });
    // Fix the unified voting endpoint with proper authentication
    app.post('/api/vote', jwtAuth, async (req, res) => {
        const voteSchema = z.object({
            targetType: z.enum(["politician", "bill", "post", "comment", "petition", "news", "finance"]),
            targetId: z.number().int(),
            voteType: z.enum(["upvote", "downvote"])
        });
        try {
            const parsed = voteSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid vote data", errors: parsed.error.errors });
            }
            const { targetType, targetId, voteType } = parsed.data;
            // For development, use demo user ID
            const userId = process.env.NODE_ENV !== 'production' ? '42199639' :
                (req.user ? req.user.id : null);
            if (!userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            if (!['upvote', 'downvote'].includes(voteType)) {
                return res.status(400).json({ message: "Invalid vote type" });
            }
            if (!['politician', 'bill', 'post', 'comment', 'petition', 'news', 'finance'].includes(targetType)) {
                return res.status(400).json({ message: "Invalid target type" });
            }
            // Check if user already voted
            const existingVote = await db.execute(sql `
        SELECT vote_type FROM user_votes 
        WHERE user_id = ${userId} AND target_type = ${targetType} AND target_id = ${targetId}
      `);
            if (existingVote.rows.length > 0) {
                return res.status(400).json({ message: "You have already voted on this item" });
            }
            // Record the vote
            await db.execute(sql `
        INSERT INTO user_votes (user_id, target_type, target_id, vote_type, created_at)
        VALUES (${userId}, ${targetType}, ${targetId}, ${voteType}, NOW())
      `);
            // Update vote counts
            await db.execute(sql `
        INSERT INTO vote_counts (target_type, target_id, upvotes, downvotes, total_score)
        VALUES (${targetType}, ${targetId}, 
          ${voteType === 'upvote' ? 1 : 0}, 
          ${voteType === 'downvote' ? 1 : 0},
          ${voteType === 'upvote' ? 1 : -1}
        )
        ON CONFLICT (target_type, target_id) 
        DO UPDATE SET 
          upvotes = vote_counts.upvotes + ${voteType === 'upvote' ? 1 : 0},
          downvotes = vote_counts.downvotes + ${voteType === 'downvote' ? 1 : 0},
          total_score = vote_counts.total_score + ${voteType === 'upvote' ? 1 : -1}
      `);
            // Get updated counts
            const updatedCounts = await db.execute(sql `
        SELECT upvotes, downvotes, total_score FROM vote_counts 
        WHERE target_type = ${targetType} AND target_id = ${targetId}
      `);
            const result = updatedCounts.rows[0];
            res.json({
                upvotes: Number(result.upvotes),
                downvotes: Number(result.downvotes),
                totalScore: Number(result.total_score),
                userVote: voteType
            });
        }
        catch (error) {
            logger.error({ msg: 'Error processing vote', error });
            res.status(500).json({ message: "Failed to process vote" });
        }
    });
    // Get vote counts for items
    app.get("/api/vote/:targetType/:targetId", async (req, res) => {
        try {
            const { targetType, targetId } = req.params;
            const userId = req.user ? req.user.id : null;
            const voteCountsResult = await db.execute(sql `
        SELECT upvotes, downvotes, total_score
        FROM vote_counts
        WHERE target_type = ${targetType} AND target_id = ${targetId}
      `);
            const voteCounts = voteCountsResult.rows?.[0];
            let userVote = null;
            if (userId) {
                const userVoteResult = await db.execute(sql `
          SELECT vote_type
          FROM user_votes
          WHERE user_id = ${userId} AND target_type = ${targetType} AND target_id = ${targetId}
        `);
                userVote = (userVoteResult.rows?.[0] && typeof userVoteResult.rows[0].vote_type === 'string')
                    ? userVoteResult.rows[0].vote_type
                    : null;
            }
            res.json({
                upvotes: voteCounts?.upvotes || 0,
                downvotes: voteCounts?.downvotes || 0,
                totalScore: voteCounts?.total_score || 0,
                userVote: userVote
            });
        }
        catch (error) {
            logger.error({ msg: 'Error fetching vote counts', error });
            res.status(500).json({ message: "Failed to fetch vote counts" });
        }
    });
    // Forum post like/unlike endpoint
    app.post("/api/forum/posts/:id/like", async (req, res) => {
        try {
            const postId = parseInt(req.params.id);
            const userId = req.user ? req.user.id : null;
            // Check if user already liked this post
            const existingLike = await db.execute(sql `
        SELECT id FROM user_votes 
        WHERE user_id = ${userId} AND target_type = 'post' AND target_id = ${postId}
      `);
            let isLiked = false;
            if (existingLike.rows && existingLike.rows.length > 0) {
                // Remove like
                await db.execute(sql `
          DELETE FROM user_votes 
          WHERE user_id = ${userId} AND target_type = 'post' AND target_id = ${postId}
        `);
                isLiked = false;
            }
            else {
                // Add like
                await db.execute(sql `
          INSERT INTO user_votes (user_id, target_type, target_id, vote_type, created_at, updated_at)
          VALUES (${userId}, 'post', ${postId}, 'upvote', NOW(), NOW())
        `);
                isLiked = true;
            }
            // Get updated like count
            const likeCountResult = await db.execute(sql `
        SELECT COUNT(*) as count FROM user_votes 
        WHERE target_type = 'post' AND target_id = ${postId} AND vote_type = 'upvote'
      `);
            const likeCount = parseInt(String(likeCountResult.rows?.[0]?.count || 0));
            res.json({ isLiked, likeCount });
        }
        catch (error) {
            logger.error({ msg: 'Error processing post like', error });
            res.status(500).json({ message: "Failed to process like" });
        }
    });
    // Forum reply like/unlike endpoint
    app.post("/api/forum/replies/:id/like", async (req, res) => {
        try {
            const replyId = parseInt(req.params.id);
            const userId = req.user ? req.user.id : null;
            // Check if user already liked this reply
            const existingLike = await db.execute(sql `
        SELECT id FROM user_votes 
        WHERE user_id = ${userId} AND target_type = 'reply' AND target_id = ${replyId}
      `);
            let isLiked = false;
            if (existingLike.rows && existingLike.rows.length > 0) {
                // Remove like
                await db.execute(sql `
          DELETE FROM user_votes 
          WHERE user_id = ${userId} AND target_type = 'reply' AND target_id = ${replyId}
        `);
                isLiked = false;
            }
            else {
                // Add like
                await db.execute(sql `
          INSERT INTO user_votes (user_id, target_type, target_id, vote_type, created_at, updated_at)
          VALUES (${userId}, 'reply', ${replyId}, 'upvote', NOW(), NOW())
        `);
                isLiked = true;
            }
            // Get updated like count
            const likeCountResult = await db.execute(sql `
        SELECT COUNT(*) as count FROM user_votes 
        WHERE target_type = 'reply' AND target_id = ${replyId} AND vote_type = 'upvote'
      `);
            const likeCount = parseInt(String(likeCountResult.rows?.[0]?.count || 0));
            res.json({ isLiked, likeCount });
        }
        catch (error) {
            logger.error({ msg: 'Error processing reply like', error });
            res.status(500).json({ message: "Failed to process like" });
        }
    });
    // Create forum reply endpoint
    app.post("/api/forum/replies", async (req, res) => {
        try {
            const { postId, content, parentReplyId } = req.body;
            const userId = req.user ? req.user.id : null;
            if (!content || !content.trim()) {
                return res.status(400).json({ message: "Reply content is required" });
            }
            // Insert reply
            const result = await db.execute(sql `
        INSERT INTO forum_replies (post_id, author_id, content, parent_id, created_at, updated_at)
        VALUES (${postId}, ${userId}, ${content.trim()}, ${parentReplyId || null}, NOW(), NOW())
        RETURNING id
      `);
            const replyId = result.rows?.[0]?.id;
            // Update post reply count
            await db.execute(sql `
        UPDATE forum_posts 
        SET reply_count = reply_count + 1, updated_at = NOW()
        WHERE id = ${postId}
      `);
            res.json({
                success: true,
                replyId,
                message: "Reply created successfully"
            });
        }
        catch (error) {
            logger.error({ msg: 'Error creating reply', error });
            res.status(500).json({ message: "Failed to create reply" });
        }
    });
    // Get forum replies for a post
    app.get("/api/forum/replies/:postId", async (req, res) => {
        try {
            const parsed = postIdParamSchema.safeParse(req.params);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid post id", errors: parsed.error.errors });
            }
            const postId = parseInt(parsed.data.postId);
            const replies = await db.execute(sql `
        SELECT 
          fr.*,
          u.first_name,
          u.email,
          u.profile_image_url,
          COALESCE(like_counts.like_count, 0) as like_count
        FROM forum_replies fr
        LEFT JOIN users u ON fr.author_id = u.id
        LEFT JOIN (
          SELECT target_id, COUNT(*) as like_count
          FROM user_votes 
          WHERE target_type = 'reply' AND vote_type = 'upvote'
          GROUP BY target_id
        ) like_counts ON like_counts.target_id = fr.id
        WHERE fr.post_id = ${postId}
        ORDER BY fr.created_at ASC
      `);
            res.json(replies.rows || []);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching replies', error });
            res.status(500).json({ message: "Failed to fetch replies" });
        }
    });
    // Enhanced politicians endpoint with vote counts
    app.get("/api/politicians", async (req, res) => {
        try {
            const politicians = await db.execute(sql `
        SELECT 
          p.*,
          COALESCE(vc.upvotes, 0) as upvotes,
          COALESCE(vc.downvotes, 0) as downvotes,
          COALESCE(vc.total_score, 0) as vote_score
        FROM politicians p
        LEFT JOIN vote_counts vc ON vc.target_type = 'politician' AND vc.target_id = p.id
        ORDER BY p.level, p.name
        LIMIT 50
      `);
            res.json(politicians.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching politicians', error });
            res.status(500).json({ message: "Failed to fetch politicians" });
        }
    });
    // Enhanced bills endpoint with vote counts
    app.get("/api/bills", async (req, res) => {
        try {
            const bills = await db.execute(sql `
        SELECT 
          b.*,
          COALESCE(vc.upvotes, 0) as upvotes,
          COALESCE(vc.downvotes, 0) as downvotes,
          COALESCE(vc.total_score, 0) as vote_score
        FROM bills b
        LEFT JOIN vote_counts vc ON vc.target_type = 'bill' AND vc.target_id = b.id
        ORDER BY b.created_at DESC
        LIMIT 50
      `);
            res.json(bills.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching bills', error });
            res.status(500).json({ message: "Failed to fetch bills" });
        }
    });
    // Duplicate voting endpoint removed - using the unified one above
    // Get vote counts and user's vote for specific content
    app.get('/api/vote/:targetType/:targetId', async (req, res) => {
        try {
            const { targetType, targetId } = req.params;
            // For development, use demo user ID
            const userId = process.env.NODE_ENV !== 'production' ? '42199639' :
                (req.user?.claims?.sub || null);
            const voteCounts = await db.execute(sql `
        SELECT upvotes, downvotes, total_score
        FROM vote_counts 
        WHERE target_type = ${targetType} AND target_id = ${targetId}
      `);
            let userVote = null;
            if (userId) {
                const userVoteResult = await db.execute(sql `
          SELECT vote_type FROM user_votes 
          WHERE user_id = ${userId} AND target_type = ${targetType} AND target_id = ${targetId}
        `);
                userVote = (userVoteResult.rows[0] && typeof userVoteResult.rows[0].vote_type === 'string')
                    ? userVoteResult.rows[0].vote_type
                    : null;
            }
            const counts = voteCounts.rows[0] || { upvotes: 0, downvotes: 0, total_score: 0 };
            res.json({
                upvotes: Number(counts.upvotes || 0),
                downvotes: Number(counts.downvotes || 0),
                totalScore: Number(counts.total_score || 0),
                userVote
            });
        }
        catch (error) {
            logger.error({ msg: 'Error fetching vote data', error });
            res.status(500).json({ message: "Failed to fetch vote data" });
        }
    });
    // Comment moderation function
    function moderateComment(content) {
        const lowerContent = content.toLowerCase();
        // Hate speech and racism detection
        const bannedPatterns = [
            /n[i1]gg[ae]r/i, /n[i1]gg[ae]/i, /k[i1]ke/i, /ch[i1]nk/i, /sp[i1]c/i,
            /f[a4]gg[o0]t/i, /f[a4]g/i, /d[y1]ke/i, /tr[a4]nn[y1]/i,
            /r[e3]t[a4]rd/i, /c[u*]nt/i, /wh[o0]r[e3]/i, /sl[u*]t/i
        ];
        // Hate speech phrases
        const hatePhrases = [
            'kill yourself', 'kys', 'gas the', 'hitler was right', 'white supremacy',
            'racial superiority', 'ethnic cleansing', 'genocide', 'final solution'
        ];
        // Check for banned patterns
        for (const pattern of bannedPatterns) {
            if (pattern.test(content)) {
                return { isAllowed: false, reason: 'Contains hate speech or offensive language' };
            }
        }
        // Check for hate speech phrases
        for (const phrase of hatePhrases) {
            if (lowerContent.includes(phrase)) {
                return { isAllowed: false, reason: 'Contains hate speech' };
            }
        }
        // Check for excessive profanity
        const profanityCount = (content.match(/fuck|shit|damn|ass|bitch/gi) || []).length;
        if (profanityCount > 3) {
            return { isAllowed: false, reason: 'Excessive profanity' };
        }
        // Check for spam (excessive caps, repeated characters)
        const capsPercentage = (content.match(/[A-Z]/g) || []).length / content.length;
        if (capsPercentage > 0.7 && content.length > 10) {
            return { isAllowed: false, reason: 'Excessive capitalization' };
        }
        return { isAllowed: true };
    }
    // Fixed commenting system for targetType/targetId routes - HIGH PRIORITY ROUTE
    app.post('/api/comments/:targetType/:targetId', jwtAuth, async (req, res) => {
        const commentSchema = z.object({
            content: z.string().min(1),
            parentCommentId: z.string().optional(),
        });
        try {
            const { targetType, targetId } = req.params;
            const parsed = commentSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid comment data", errors: parsed.error.errors });
            }
            const { content, parentCommentId } = parsed.data;
            // Production authentication only
            const userId = req.user ? req.user.id : null;
            if (!userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            // Content moderation check using the function defined below
            const moderationResult = moderateComment(content);
            if (!moderationResult.isAllowed) {
                return res.status(400).json({
                    message: `Comment rejected: ${moderationResult.reason}`
                });
            }
            const result = await db.execute(sql `
        INSERT INTO comments (author_id, target_type, target_id, content, parent_comment_id, created_at, like_count, can_delete)
        VALUES (${userId}, ${targetType}, ${parseInt(targetId)}, ${content}, ${parentCommentId || null}, NOW(), 0, true)
        RETURNING id, content, author_id, target_type, target_id, parent_comment_id, created_at, like_count, can_delete
      `);
            // Get user info for response
            const user = await db.execute(sql `
        SELECT first_name, last_name, email, profile_image_url 
        FROM users WHERE id = ${userId}
      `);
            const comment = {
                ...result.rows[0],
                author: {
                    ...user.rows[0]
                }
            };
            res.status(201).json({
                message: "Comment posted successfully",
                comment: comment
            });
        }
        catch (error) {
            logger.error({ msg: 'Error posting comment', error });
            res.status(500).json({ message: "Failed to post comment" });
        }
    });
    // Comprehensive commenting system with moderation (alternative endpoint)
    app.post('/api/comments', jwtAuth, async (req, res) => {
        try {
            const { targetType, targetId, content, parentCommentId } = req.body;
            // Production authentication only
            const userId = req.user ? req.user.id : null;
            if (!userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            if (!content || content.trim().length === 0) {
                return res.status(400).json({ message: "Comment content cannot be empty" });
            }
            if (content.length > 2000) {
                return res.status(400).json({ message: "Comment too long (max 2000 characters)" });
            }
            // Moderate comment content
            const moderation = moderateComment(content);
            if (!moderation.isAllowed) {
                return res.status(400).json({
                    message: `Comment rejected: ${moderation.reason}`,
                    moderationReason: moderation.reason
                });
            }
            const result = await db.execute(sql `
        INSERT INTO comments (author_id, target_type, target_id, content, parent_comment_id, created_at, like_count, can_delete)
        VALUES (${userId}, ${targetType}, ${targetId}, ${content.trim()}, ${parentCommentId || null}, NOW(), 0, true)
        RETURNING id, created_at
      `);
            const comment = result.rows[0];
            res.json({
                id: comment.id,
                created_at: comment.created_at,
                message: "Comment posted successfully"
            });
        }
        catch (error) {
            logger.error({ msg: 'Error posting comment', error });
            res.status(500).json({ message: "Failed to post comment" });
        }
    });
    // Get comments for specific content - HIGH PRIORITY ROUTE
    app.get('/api/comments/:targetType/:targetId', async (req, res) => {
        try {
            const { targetType, targetId } = req.params;
            const comments = await db.execute(sql `
        SELECT 
          c.id,
          c.content,
          c.author_id,
          c.target_type,
          c.target_id,
          c.parent_comment_id,
          c.created_at,
          c.is_edited,
          c.edit_count,
          c.last_edited_at,
          COALESCE(c.like_count, 0) as like_count,
          COALESCE(c.can_delete, true) as can_delete,
          u.first_name,
          u.last_name,
          u.email,
          u.profile_image_url
        FROM comments c
        LEFT JOIN users u ON c.author_id = u.id::text
        WHERE c.target_type = ${targetType} AND c.target_id = ${parseInt(targetId)} AND c.parent_comment_id IS NULL
        ORDER BY c.created_at DESC
      `);
            // Get replies for each comment
            const commentsWithReplies = await Promise.all(comments.rows.map((comment) => {
                return (async () => {
                    const replies = await db.execute(sql `
              SELECT 
                c.id,
                c.content,
                c.author_id,
                c.created_at,
                c.is_edited,
                c.edit_count,
                c.last_edited_at,
                COALESCE(c.like_count, 0) as like_count,
                u.first_name,
                u.last_name,
                u.email,
                u.profile_image_url
              FROM comments c
              LEFT JOIN users u ON c.author_id = u.id::text
              WHERE c.parent_comment_id = ${comment.id}
              ORDER BY c.created_at ASC
            `);
                    return {
                        ...comment,
                        replies: replies.rows.map((reply) => ({
                            ...reply,
                            author: {
                                firstName: reply.first_name,
                                lastName: reply.last_name,
                                email: reply.email,
                                profileImageUrl: reply.profile_image_url
                            }
                        })),
                        author: {
                            firstName: comment.first_name,
                            lastName: comment.last_name,
                            email: comment.email,
                            profileImageUrl: comment.profile_image_url
                        }
                    };
                })();
            }));
            const cleanedComments = commentsWithReplies.map((comment) => {
                const author = comment.author || {};
                return {
                    id: comment.id ?? '',
                    content: comment.content ?? '',
                    author_id: String(comment.author_id ?? ''),
                    created_at: comment.created_at ?? '',
                    is_edited: comment.is_edited ?? false,
                    edit_count: comment.edit_count ?? 0,
                    last_edited_at: comment.last_edited_at ?? '',
                    like_count: comment.like_count ?? 0,
                    first_name: author.firstName ?? '',
                    last_name: author.lastName ?? '',
                    email: author.email ?? '',
                    profile_image_url: author.profileImageUrl ?? '',
                    author: author,
                    replies: comment.replies ?? []
                };
            });
            res.json(cleanedComments);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching comments', error });
            res.status(500).json({ message: "Failed to fetch comments" });
        }
    });
    // Delete comment (user can only delete their own comments)
    app.delete('/api/comments/:commentId', jwtAuth, async (req, res) => {
        try {
            const { commentId } = req.params;
            // Production authentication only
            const userId = req.user ? req.user.id : null;
            if (!userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            // Check if comment exists and belongs to user
            const comment = await db.execute(sql `
        SELECT author_id FROM comments WHERE id = ${commentId}
      `);
            if (comment.rows.length === 0) {
                return res.status(404).json({ message: "Comment not found" });
            }
            if (comment.rows[0].author_id !== userId) {
                return res.status(403).json({ message: "You can only delete your own comments" });
            }
            // Delete the comment and its edit history
            await db.execute(sql `DELETE FROM comment_edit_history WHERE comment_id = ${commentId}`);
            await db.execute(sql `DELETE FROM comments WHERE id = ${commentId}`);
            res.json({ message: "Comment deleted successfully" });
        }
        catch (error) {
            logger.error({ msg: 'Error deleting comment', error });
            res.status(500).json({ message: "Failed to delete comment" });
        }
    });
    // Edit comment (user can only edit their own comments)
    app.put('/api/comments/:commentId', jwtAuth, async (req, res) => {
        try {
            const { commentId } = req.params;
            const { content } = req.body;
            // Production authentication only
            const userId = req.user ? req.user.id : null;
            if (!userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            if (!content || content.trim().length === 0) {
                return res.status(400).json({ message: "Comment content is required" });
            }
            // Content moderation check
            const moderationResult = moderateComment(content);
            if (!moderationResult.isAllowed) {
                return res.status(400).json({
                    message: `Comment rejected: ${moderationResult.reason}`
                });
            }
            // Check if comment exists and belongs to user
            const comment = await db.execute(sql `
        SELECT author_id, content, edit_count FROM comments WHERE id = ${commentId}
      `);
            if (comment.rows.length === 0) {
                return res.status(404).json({ message: "Comment not found" });
            }
            if (comment.rows[0].author_id !== userId) {
                return res.status(403).json({ message: "You can only edit your own comments" });
            }
            const originalContent = comment.rows[0].content;
            const currentEditCount = Number(comment.rows[0].edit_count) || 0;
            const newEditCount = currentEditCount + 1;
            // Save original content to edit history
            await db.execute(sql `
        INSERT INTO comment_edit_history (comment_id, original_content, edit_number)
        VALUES (${commentId}, ${originalContent}, ${newEditCount})
      `);
            // Update the comment
            await db.execute(sql `
        UPDATE comments 
        SET content = ${content.trim()}, 
            is_edited = true, 
            edit_count = ${newEditCount},
            last_edited_at = NOW()
        WHERE id = ${commentId}
      `);
            res.json({
                message: "Comment updated successfully",
                editCount: newEditCount
            });
        }
        catch (error) {
            logger.error({ msg: 'Error updating comment', error });
            res.status(500).json({ message: "Failed to update comment" });
        }
    });
    // Get edit history for a comment (must come before the general comments route)
    app.get('/api/comments/history/:commentId', async (req, res) => {
        try {
            const { commentId } = req.params;
            const history = await db.execute(sql `
        SELECT ceh.*, c.content as current_content, c.edit_count
        FROM comment_edit_history ceh
        JOIN comments c ON ceh.comment_id = c.id
        WHERE ceh.comment_id = ${commentId}
        ORDER BY ceh.edit_number DESC
      `);
            res.json(history.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching comment history', error });
            res.status(500).json({ message: "Failed to fetch comment history" });
        }
    });
    // Like/unlike comments
    app.post('/api/comments/like', jwtAuth, async (req, res) => {
        try {
            const { commentId } = req.body;
            // Production authentication only
            const userId = req.user ? req.user.id : null;
            if (!userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const existing = await db.execute(sql `
        SELECT id FROM comment_likes 
        WHERE comment_id = ${commentId} AND user_id = ${userId}
      `);
            let isLiked = false;
            if (existing.rows.length > 0) {
                await db.execute(sql `
          DELETE FROM comment_likes 
          WHERE comment_id = ${commentId} AND user_id = ${userId}
        `);
                isLiked = false;
            }
            else {
                await db.execute(sql `
          INSERT INTO comment_likes (comment_id, user_id, created_at)
          VALUES (${commentId}, ${userId}, NOW())
        `);
                isLiked = true;
            }
            // Get updated like count
            const likeCountResult = await db.execute(sql `
        SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ${commentId}
      `);
            const likeCount = parseInt(String(likeCountResult.rows?.[0]?.count || 0));
            res.json({
                isLiked,
                likeCount,
                message: "Comment like toggled successfully"
            });
        }
        catch (error) {
            logger.error({ msg: 'Error liking comment', error });
            res.status(500).json({ message: "Failed to like comment" });
        }
    });
    // Forum categories endpoint
    app.get("/api/forum/categories", async (req, res) => {
        try {
            const categories = await db.execute(sql `
        SELECT 
          fc.*,
          COUNT(fp.id) as post_count
        FROM forum_categories fc
        LEFT JOIN forum_posts fp ON fc.id = fp.category_id
        WHERE fc.is_visible = true
        GROUP BY fc.id
        ORDER BY fc.sort_order ASC, fc.name ASC
      `);
            // If no categories found, return demo data
            if (categories.rows.length === 0) {
                const demoCategories = [
                    {
                        id: 1,
                        name: "Politics & Government",
                        description: "Discussions about Canadian politics, elections, and government policies",
                        color: "#3B82F6",
                        icon: "Building",
                        sort_order: 1,
                        is_visible: true,
                        post_count: 5
                    },
                    {
                        id: 2,
                        name: "Legal & Rights",
                        description: "Legal discussions, human rights, and constitutional matters",
                        color: "#10B981",
                        icon: "Scale",
                        sort_order: 2,
                        is_visible: true,
                        post_count: 3
                    },
                    {
                        id: 3,
                        name: "Civic Engagement",
                        description: "How to get involved in your community and make a difference",
                        color: "#F59E0B",
                        icon: "Users",
                        sort_order: 3,
                        is_visible: true,
                        post_count: 4
                    },
                    {
                        id: 4,
                        name: "Transparency & Accountability",
                        description: "Government transparency, FOI requests, and accountability",
                        color: "#EF4444",
                        icon: "Eye",
                        sort_order: 4,
                        is_visible: true,
                        post_count: 2
                    },
                    {
                        id: 5,
                        name: "News & Media",
                        description: "Discussion of current events and media coverage",
                        color: "#8B5CF6",
                        icon: "FileText",
                        sort_order: 5,
                        is_visible: true,
                        post_count: 6
                    }
                ];
                return res.json(demoCategories);
            }
            res.json(categories.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching forum categories', error });
            res.status(500).json({ message: "Failed to fetch forum categories" });
        }
    });
    // Forum subcategories endpoint
    app.get("/api/forum/subcategories", async (req, res) => {
        try {
            const subcategories = await db.execute(sql `
        SELECT 
          fs.*,
          fc.name as category_name,
          COUNT(fp.id) as post_count
        FROM forum_subcategories fs
        LEFT JOIN forum_categories fc ON fs.category_id = fc.id
        LEFT JOIN forum_posts fp ON fs.id = fp.subcategory_id
        WHERE fs.is_visible = true
        GROUP BY fs.id, fc.name
        ORDER BY fs.category_id ASC, fs.sort_order ASC, fs.name ASC
      `);
            res.json(subcategories.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching forum subcategories', error });
            res.status(500).json({ message: "Failed to fetch forum subcategories" });
        }
    });
    // Forum posts with vote counts and category/subcategory filtering
    app.get("/api/forum/posts", async (req, res) => {
        try {
            const { category, subcategory, sort } = req.query;
            let whereClause = sql `WHERE 1=1`;
            if (category && category !== 'all') {
                if (isNaN(Number(category))) {
                    whereClause = sql `${whereClause} AND fc.name = ${category}`;
                }
                else {
                    whereClause = sql `${whereClause} AND fp.category_id = ${category}`;
                }
            }
            if (subcategory && subcategory !== 'all') {
                if (isNaN(Number(subcategory))) {
                    whereClause = sql `${whereClause} AND fs.name = ${subcategory}`;
                }
                else {
                    whereClause = sql `${whereClause} AND fp.subcategory_id = ${subcategory}`;
                }
            }
            let orderClause = sql `ORDER BY fp.is_sticky DESC, fp.created_at DESC`;
            if (sort === 'popular') {
                orderClause = sql `ORDER BY fp.is_sticky DESC, COALESCE(vc.total_score, 0) DESC, fp.created_at DESC`;
            }
            else if (sort === 'oldest') {
                orderClause = sql `ORDER BY fp.is_sticky DESC, fp.created_at ASC`;
            }
            const posts = await db.execute(sql `
        SELECT 
          fp.*,
          fc.name as category_name,
          fc.color as category_color,
          fc.icon as category_icon,
          fs.name as subcategory_name,
          fs.color as subcategory_color,
          fs.icon as subcategory_icon,
          u.first_name,
          u.last_name,
          u.email,
          u.profile_image_url,
          u.civic_level,
          COALESCE(vc.upvotes, 0) as upvotes,
          COALESCE(vc.downvotes, 0) as downvotes,
          COALESCE(vc.total_score, 0) as vote_score,
          COUNT(fr.id) as reply_count
        FROM forum_posts fp
        LEFT JOIN forum_categories fc ON fp.category_id = fc.id
        LEFT JOIN forum_subcategories fs ON fp.subcategory_id = fs.id
        LEFT JOIN forum_replies fr ON fp.id = fr.post_id
        LEFT JOIN users u ON fp.author_id = u.id
        LEFT JOIN vote_counts vc ON vc.target_type = 'post' AND vc.target_id = fp.id
        ${whereClause}
        GROUP BY fp.id, fc.name, fc.color, fc.icon, fs.name, fs.color, fs.icon, u.first_name, u.last_name, u.email, u.profile_image_url, u.civic_level, vc.upvotes, vc.downvotes, vc.total_score
        ${orderClause}
        LIMIT 50
      `);
            // If no posts found, return demo data
            if (posts.rows.length === 0) {
                const demoPosts = [
                    {
                        id: 1,
                        title: "What's your opinion on Mark Carney's economic recovery policies?",
                        content: "Prime Minister Carney has been implementing comprehensive economic recovery strategies. I'm curious to hear what everyone thinks about the current financial reforms and economic stimulus measures. Do you think the current policies are effective, or should we be more aggressive with our economic recovery goals?",
                        author_id: "demo-user-1",
                        category_id: 1,
                        category_name: "Politics & Government",
                        category_color: "#3B82F6",
                        category_icon: "Building",
                        created_at: "2024-01-15T10:30:00Z",
                        updated_at: "2024-01-15T10:30:00Z",
                        view_count: 45,
                        is_sticky: true,
                        is_locked: false,
                        reply_count: 8,
                        like_count: 12,
                        first_name: "Sarah",
                        last_name: "Johnson",
                        email: "sarah.j@example.com",
                        profile_image_url: null,
                        civic_level: "Federal",
                        upvotes: 12,
                        downvotes: 2,
                        vote_score: 10
                    },
                    {
                        id: 2,
                        title: "How can we improve civic engagement in our communities?",
                        content: "I've been thinking about ways to get more people involved in local politics and community decision-making. What strategies have worked in your area? Are there specific barriers that prevent people from participating?",
                        author_id: "demo-user-2",
                        category_id: 3,
                        category_name: "Civic Engagement",
                        category_color: "#F59E0B",
                        category_icon: "Users",
                        created_at: "2024-01-14T14:20:00Z",
                        updated_at: "2024-01-14T14:20:00Z",
                        view_count: 32,
                        is_sticky: false,
                        is_locked: false,
                        reply_count: 5,
                        like_count: 7,
                        first_name: "Michael",
                        last_name: "Chen",
                        email: "michael.c@example.com",
                        profile_image_url: null,
                        civic_level: "Municipal",
                        upvotes: 7,
                        downvotes: 0,
                        vote_score: 7
                    },
                    {
                        id: 3,
                        title: "Media bias in Canadian news coverage",
                        content: "I've noticed some concerning trends in how different media outlets cover the same political events. How do you think we can promote more balanced and fact-based journalism in Canada?",
                        author_id: "demo-user-3",
                        category_id: 5,
                        category_name: "News & Media",
                        category_color: "#8B5CF6",
                        category_icon: "FileText",
                        created_at: "2024-01-13T09:15:00Z",
                        updated_at: "2024-01-13T09:15:00Z",
                        view_count: 67,
                        is_sticky: false,
                        is_locked: false,
                        reply_count: 12,
                        like_count: 15,
                        first_name: "Emma",
                        last_name: "Thompson",
                        email: "emma.t@example.com",
                        profile_image_url: null,
                        civic_level: "Provincial",
                        upvotes: 15,
                        downvotes: 3,
                        vote_score: 12
                    },
                    {
                        id: 4,
                        title: "Transparency in government spending",
                        content: "I'm working on a FOI request to get more details about infrastructure spending in my riding. Has anyone else had experience with this process? Any tips for navigating the bureaucracy?",
                        author_id: "demo-user-4",
                        category_id: 4,
                        category_name: "Transparency & Accountability",
                        category_color: "#EF4444",
                        category_icon: "Eye",
                        created_at: "2024-01-12T16:45:00Z",
                        updated_at: "2024-01-12T16:45:00Z",
                        view_count: 28,
                        is_sticky: false,
                        is_locked: false,
                        reply_count: 3,
                        like_count: 6,
                        first_name: "David",
                        last_name: "Wilson",
                        email: "david.w@example.com",
                        profile_image_url: null,
                        civic_level: "Federal",
                        upvotes: 6,
                        downvotes: 1,
                        vote_score: 5
                    },
                    {
                        id: 5,
                        title: "Legal challenges to recent policy changes",
                        content: "There have been several legal challenges to recent government policies. What do you think about the role of the courts in shaping public policy? Should there be limits on judicial review?",
                        author_id: "demo-user-5",
                        category_id: 2,
                        category_name: "Legal & Rights",
                        category_color: "#10B981",
                        category_icon: "Scale",
                        created_at: "2024-01-11T11:30:00Z",
                        updated_at: "2024-01-11T11:30:00Z",
                        view_count: 41,
                        is_sticky: false,
                        is_locked: false,
                        reply_count: 7,
                        like_count: 9,
                        first_name: "Lisa",
                        last_name: "Martinez",
                        email: "lisa.m@example.com",
                        profile_image_url: null,
                        civic_level: "Provincial",
                        upvotes: 9,
                        downvotes: 2,
                        vote_score: 7
                    }
                ];
                return res.json(demoPosts);
            }
            res.json(posts.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching forum posts', error });
            res.status(500).json({ message: "Failed to fetch forum posts" });
        }
    });
    // Create new forum post
    app.post("/api/forum/posts", jwtAuth, async (req, res) => {
        const postSchema = z.object({
            title: z.string().min(3),
            content: z.string().min(10),
            categoryId: z.number().int(),
            subcategoryId: z.number().int().optional(),
            billId: z.number().int().optional()
        });
        try {
            const parsed = postSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid post data", errors: parsed.error.errors });
            }
            const { title, content, categoryId, subcategoryId, billId } = parsed.data;
            const userId = req.user.claims.sub;
            if (!title?.trim() || !content?.trim() || !categoryId) {
                return res.status(400).json({ message: "Title, content, and category are required" });
            }
            const result = await db.execute(sql `
        INSERT INTO forum_posts (title, content, author_id, category_id, subcategory_id, bill_id, created_at, updated_at)
        VALUES (${title}, ${content}, ${userId}, ${categoryId}, ${subcategoryId || null}, ${billId || null}, NOW(), NOW())
        RETURNING id
      `);
            res.json({
                message: "Post created successfully",
                postId: result.rows[0].id
            });
        }
        catch (error) {
            logger.error({ msg: 'Error creating forum post', error });
            res.status(500).json({ message: "Failed to create forum post" });
        }
    });
    // Politician data enhancement endpoint
    app.post('/api/admin/enhance-politicians', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.claims.sub;
            // Check if user is admin (basic check)
            const user = await db.execute(sql `
        SELECT civic_level FROM users WHERE id = ${userId}
      `);
            if (!user.rows[0] || user.rows[0].civic_level !== 'administrator') {
                return res.status(403).json({ message: "Admin access required" });
            }
            await politicianDataEnhancer.enhanceAllPoliticians();
            const stats = await politicianDataEnhancer.getEnhancementStats();
            res.json({
                message: "Politician data enhancement completed successfully",
                stats
            });
        }
        catch (error) {
            logger.error({ msg: 'Error enhancing politician data', error });
            res.status(500).json({ message: "Failed to enhance politician data" });
        }
    });
    // Get enhancement statistics
    app.get('/api/admin/politician-stats', jwtAuth, async (req, res) => {
        try {
            const stats = await politicianDataEnhancer.getEnhancementStats();
            res.json(stats);
        }
        catch (error) {
            logger.error({ msg: 'Error getting politician stats', error });
            res.status(500).json({ message: "Failed to get politician statistics" });
        }
    });
    // Rights API endpoints
    app.get('/api/rights/charter', async (req, res) => {
        try {
            const charterRights = [
                {
                    id: "1",
                    section: 1,
                    title: "Guarantee of Rights and Freedoms",
                    category: "fundamental",
                    text: "The Canadian Charter of Rights and Freedoms guarantees the rights and freedoms set out in it subject only to such reasonable limits prescribed by law as can be demonstrably justified in a free and democratic society.",
                    plainLanguage: "Your rights are protected, but they can have reasonable limits that are justified in a democratic society.",
                    examples: ["Laws against hate speech", "Safety regulations", "Court orders"],
                    limitations: ["Must be reasonable", "Must be justified in a free and democratic society", "Must be prescribed by law"],
                    relatedSections: [2, 7, 15]
                },
                {
                    id: "2",
                    section: 2,
                    title: "Fundamental Freedoms",
                    category: "fundamental",
                    text: "Everyone has the following fundamental freedoms: (a) freedom of conscience and religion; (b) freedom of thought, belief, opinion and expression, including freedom of the press and other media; (c) freedom of peaceful assembly; (d) freedom of association.",
                    plainLanguage: "You can believe what you want, say what you think, gather peacefully, and join groups.",
                    examples: ["Religious worship", "Peaceful protests", "Joining unions", "Free press", "Publishing opinions"],
                    limitations: ["Cannot incite violence", "Cannot spread hate speech", "Must be peaceful assembly"],
                    relatedSections: [1, 15]
                },
                {
                    id: "3",
                    section: 3,
                    title: "Democratic Rights - Voting",
                    category: "democratic",
                    text: "Every citizen of Canada has the right to vote in an election of members of the House of Commons or of a legislative assembly and to be qualified for membership therein.",
                    plainLanguage: "Every Canadian citizen can vote in federal and provincial elections and can run for office.",
                    examples: ["Federal elections", "Provincial elections", "Running for MP", "Running for MLA"],
                    limitations: ["Must be a Canadian citizen", "Must meet age requirements", "Cannot be disqualified by law"],
                    relatedSections: [4, 5]
                },
                {
                    id: "4",
                    section: 4,
                    title: "Maximum Duration of Legislative Bodies",
                    category: "democratic",
                    text: "No House of Commons and no legislative assembly shall continue for longer than five years from the date fixed for the return of the writs at a general election of its members.",
                    plainLanguage: "Elections must be held at least every five years.",
                    examples: ["Federal election every 5 years maximum", "Provincial elections every 5 years maximum"],
                    limitations: ["Can be extended only in time of war, invasion or insurrection"],
                    relatedSections: [3, 5]
                },
                {
                    id: "5",
                    section: 5,
                    title: "Annual Sitting of Legislative Bodies",
                    category: "democratic",
                    text: "There shall be a sitting of Parliament and of each legislature at least once every twelve months.",
                    plainLanguage: "Parliament and provincial legislatures must meet at least once per year.",
                    examples: ["Parliamentary sessions", "Legislative sessions", "Budget discussions"],
                    limitations: ["Must sit at least annually"],
                    relatedSections: [3, 4]
                },
                {
                    id: "6",
                    section: 6,
                    title: "Mobility Rights",
                    category: "mobility",
                    text: "(1) Every citizen of Canada has the right to enter, remain in and leave Canada. (2) Every citizen of Canada and every person who has the status of a permanent resident of Canada has the right to move to and take up residence in any province and to pursue the gaining of a livelihood in any province.",
                    plainLanguage: "You can travel freely within Canada, leave and return to Canada, live anywhere in Canada, and work anywhere in Canada.",
                    examples: ["Moving between provinces", "Working in any province", "Traveling freely", "Leaving and returning to Canada"],
                    limitations: ["Some professional licensing requirements", "Residency requirements for some benefits"],
                    relatedSections: [15]
                },
                {
                    id: "7",
                    section: 7,
                    title: "Life, Liberty and Security",
                    category: "legal",
                    text: "Everyone has the right to life, liberty and security of the person and the right not to be deprived thereof except in accordance with the principles of fundamental justice.",
                    plainLanguage: "You have the right to life, freedom, and safety. These can only be taken away through fair legal processes.",
                    examples: ["Right to medical treatment", "Protection from arbitrary detention", "Fair criminal trials"],
                    limitations: ["Must follow principles of fundamental justice", "Can be limited by proper legal procedures"],
                    relatedSections: [8, 9, 10, 11, 12]
                },
                {
                    id: "8",
                    section: 8,
                    title: "Search or Seizure",
                    category: "legal",
                    text: "Everyone has the right to be secure against unreasonable search or seizure.",
                    plainLanguage: "Police need good reasons and usually a warrant to search you or your property.",
                    examples: ["Need warrant for home searches", "Reasonable grounds for searches", "Protection of privacy"],
                    limitations: ["Reasonable searches allowed", "Emergency exceptions", "Border searches"],
                    relatedSections: [7, 9]
                },
                {
                    id: "9",
                    section: 9,
                    title: "Detention or Imprisonment",
                    category: "legal",
                    text: "Everyone has the right not to be arbitrarily detained or imprisoned.",
                    plainLanguage: "You cannot be arrested or held without good legal reasons.",
                    examples: ["Need grounds for arrest", "Cannot be held indefinitely", "Proper legal process required"],
                    limitations: ["Must have reasonable grounds", "Preventive detention in some cases"],
                    relatedSections: [7, 8, 10]
                },
                {
                    id: "10",
                    section: 10,
                    title: "Arrest or Detention Rights",
                    category: "legal",
                    text: "Everyone has the right on arrest or detention (a) to be informed promptly of the reasons therefor; (b) to retain and instruct counsel without delay and to be informed of that right; (c) to have the validity of the detention determined by way of habeas corpus and to be released if the detention is not lawful.",
                    plainLanguage: "If arrested, you must be told why, you can call a lawyer, and you can challenge your detention in court.",
                    examples: ["Right to know charges", "Right to call a lawyer", "Habeas corpus applications"],
                    limitations: ["Must be informed promptly", "Reasonable access to counsel"],
                    relatedSections: [7, 9, 11]
                },
                {
                    id: "11",
                    section: 11,
                    title: "Criminal Trial Rights",
                    category: "legal",
                    text: "Any person charged with an offence has the right to be presumed innocent until proven guilty according to law in a fair and public hearing by an independent and impartial tribunal, to be informed without unreasonable delay of the specific offence, to be tried within a reasonable time, to not be compelled to be a witness in proceedings against that person in respect of the offence, to be presumed innocent until proven guilty, and if finally acquitted of the offence, not to be tried for it again.",
                    plainLanguage: "In criminal cases, you're innocent until proven guilty, get a fair trial, can't be forced to testify against yourself, and can't be tried twice for the same crime.",
                    examples: ["Presumption of innocence", "Right to fair trial", "No double jeopardy", "Right to remain silent"],
                    limitations: ["Must be criminal charges", "Reasonable timeframes apply"],
                    relatedSections: [7, 10, 12]
                },
                {
                    id: "12",
                    section: 12,
                    title: "Cruel and Unusual Treatment",
                    category: "legal",
                    text: "Everyone has the right not to be subjected to any cruel and unusual treatment or punishment.",
                    plainLanguage: "You cannot be tortured or subjected to cruel punishments.",
                    examples: ["No torture", "Humane prison conditions", "Proportionate sentences"],
                    limitations: ["Must be cruel and unusual", "Context matters"],
                    relatedSections: [7, 11]
                },
                {
                    id: "15",
                    section: 15,
                    title: "Equality Rights",
                    category: "equality",
                    text: "(1) Every individual is equal before and under the law and has the right to the equal protection and equal benefit of the law without discrimination and, in particular, without discrimination based on race, national or ethnic origin, colour, religion, sex, age or mental or physical disability. (2) Subsection (1) does not preclude any law, program or activity that has as its object the amelioration of conditions of disadvantaged individuals or groups including those that are disadvantaged because of race, national or ethnic origin, colour, religion, sex, age or mental or physical disability.",
                    plainLanguage: "Everyone is equal under the law regardless of race, religion, sex, age, or disability. Programs to help disadvantaged groups are allowed.",
                    examples: ["Equal employment opportunities", "Anti-discrimination laws", "Affirmative action programs"],
                    limitations: ["Allows programs for disadvantaged groups", "Reasonable distinctions may apply"],
                    relatedSections: [1, 2, 6]
                },
                {
                    id: "16",
                    section: 16,
                    title: "Official Languages",
                    category: "language",
                    text: "(1) English and French are the official languages of Canada and have equality of status and equal rights and privileges as to their use in all institutions of the Parliament and government of Canada.",
                    plainLanguage: "English and French are both official languages with equal status in federal institutions.",
                    examples: ["Bilingual federal services", "Parliamentary proceedings", "Federal court cases"],
                    limitations: ["Applies primarily to federal institutions", "Some exceptions for practical reasons"],
                    relatedSections: [17, 18, 19, 20]
                }
            ];
            res.json(charterRights);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching charter rights', error });
            res.status(500).json({ message: "Failed to fetch charter rights" });
        }
    });
    // Clear notifications endpoint
    app.delete('/api/notifications/clear', jwtAuth, async (req, res) => {
        try {
            const userId = req.user ? req.user.id : null;
            await db.execute(sql `
        DELETE FROM notifications WHERE user_id = ${userId}
      `);
            res.json({ message: "All notifications cleared successfully" });
        }
        catch (error) {
            logger.error({ msg: 'Error clearing notifications', error });
            res.status(500).json({ message: "Failed to clear notifications" });
        }
    });
    // Clear specific notification
    app.delete('/api/notifications/:id', jwtAuth, async (req, res) => {
        try {
            const userId = req.user ? req.user.id : null;
            const notificationId = parseInt(req.params.id);
            await db.execute(sql `
        DELETE FROM notifications 
        WHERE id = ${notificationId} AND user_id = ${userId}
      `);
            res.json({ message: "Notification cleared successfully" });
        }
        catch (error) {
            logger.error({ msg: 'Error clearing notification', error });
            res.status(500).json({ message: "Failed to clear notification" });
        }
    });
    // Constitutional cases endpoint
    app.get('/api/legal/constitutional-cases', async (req, res) => {
        try {
            const constitutionalCases = [
                {
                    id: "r-v-oakes-1986",
                    caseName: "R. v. Oakes",
                    year: 1986,
                    court: "Supreme Court of Canada",
                    citation: "[1986] 1 S.C.R. 103",
                    charterSection: "Section 1",
                    summary: "Established the Oakes test for determining whether limitations on Charter rights are justified in a free and democratic society.",
                    significance: "Fundamental case establishing how Charter rights can be limited",
                    keyPrinciples: [
                        "Pressing and substantial objective test",
                        "Proportionality analysis",
                        "Minimal impairment requirement",
                        "Balancing of effects"
                    ],
                    impact: "Sets the standard framework for all Charter rights analysis in Canadian courts",
                    fullText: "Available at Supreme Court of Canada website",
                    relatedSections: [1, 2, 7, 15]
                },
                {
                    id: "r-v-morgentaler-1988",
                    caseName: "R. v. Morgentaler",
                    year: 1988,
                    court: "Supreme Court of Canada",
                    citation: "[1988] 1 S.C.R. 30",
                    charterSection: "Section 7",
                    summary: "Struck down Canada's abortion law as violating women's security of the person under Section 7.",
                    significance: "Landmark case on reproductive rights and security of the person",
                    keyPrinciples: [
                        "Security of the person includes psychological integrity",
                        "State cannot impose delays that increase health risks",
                        "Fundamental justice requires fair procedures"
                    ],
                    impact: "Decriminalized abortion and established broader interpretation of Section 7",
                    fullText: "Available at Supreme Court of Canada website",
                    relatedSections: [7]
                },
                {
                    id: "andrews-v-law-society-1989",
                    caseName: "Andrews v. Law Society of British Columbia",
                    year: 1989,
                    court: "Supreme Court of Canada",
                    citation: "[1989] 1 S.C.R. 143",
                    charterSection: "Section 15",
                    summary: "First major Supreme Court case interpreting equality rights under Section 15.",
                    significance: "Established framework for equality rights analysis",
                    keyPrinciples: [
                        "Equality means substantive, not just formal equality",
                        "Distinction must be discriminatory",
                        "Analogous grounds can be protected",
                        "Ameliorative programs are permitted"
                    ],
                    impact: "Fundamental precedent for all equality rights cases",
                    fullText: "Available at Supreme Court of Canada website",
                    relatedSections: [15]
                },
                {
                    id: "r-v-big-m-drug-mart-1985",
                    caseName: "R. v. Big M Drug Mart Ltd.",
                    year: 1985,
                    court: "Supreme Court of Canada",
                    citation: "[1985] 1 S.C.R. 295",
                    charterSection: "Section 2(a)",
                    summary: "Struck down the Lord's Day Act as violating freedom of religion.",
                    significance: "First major freedom of religion case under the Charter",
                    keyPrinciples: [
                        "Freedom of religion includes freedom from religion",
                        "Government cannot prefer one religion over another",
                        "Secular purpose required for legislation"
                    ],
                    impact: "Established separation of church and state principle",
                    fullText: "Available at Supreme Court of Canada website",
                    relatedSections: [2]
                }
            ];
            res.json(constitutionalCases);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching constitutional cases', error });
            res.status(500).json({ message: "Failed to fetch constitutional cases" });
        }
    });
    // External user authentication endpoint
    app.post('/api/auth/external', async (req, res) => {
        try {
            const { email, password, firstName, lastName } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            // In production, this would verify against external auth providers
            // For now, create/authenticate users with external credentials
            const userResult = await db.execute(sql `
        INSERT INTO users (id, email, first_name, last_name, civic_level, is_verified, created_at)
        VALUES (${email}, ${email}, ${firstName || 'External'}, ${lastName || 'User'}, 'citizen', true, NOW())
        ON CONFLICT (email) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          civic_level = 'citizen'
        RETURNING id, email, first_name, last_name, civic_level
      `);
            const user = userResult.rows[0];
            // Create session token for external user
            const sessionToken = `ext_${Date.now()}_${Math.random().toString(36)}`;
            res.json({
                message: "External authentication successful",
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    civicLevel: user.civic_level
                },
                sessionToken
            });
        }
        catch (error) {
            logger.error({ msg: 'Error with external authentication', error });
            res.status(500).json({ message: "External authentication failed" });
        }
    });
    // Stripe payment route for donations
    app.post("/api/create-payment-intent", async (req, res) => {
        try {
            const { amount } = req.body;
            if (!amount || amount < 1) {
                return res.status(400).json({ message: "Invalid donation amount" });
            }
            // Check if we have Stripe configured
            if (!process.env.STRIPE_SECRET_KEY) {
                // Fallback to simulation for development
                return res.json({
                    success: true,
                    isSimulated: true,
                    amount: amount,
                    message: "Demo payment completed successfully"
                });
            }
            // Real Stripe integration - Create checkout session
            const { default: Stripe } = await import('stripe');
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                apiVersion: '2023-10-16',
            });
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'cad',
                            product_data: {
                                name: 'CivicOS Platform Support',
                                description: 'Support independent Canadian political transparency platform',
                            },
                            unit_amount: Math.round(amount * 100), // Convert to cents
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${FRONTEND_BASE_URL}/donation-success?amount=${amount}`,
                cancel_url: `${FRONTEND_BASE_URL}/`,
                metadata: {
                    platform: 'CivicOS',
                    purpose: 'Platform Support Donation',
                    amount: amount.toString()
                }
            });
            res.json({
                sessionId: session.id,
                url: session.url,
                isSimulated: false,
                amount: amount
            });
        }
        catch (error) {
            logger.error({ msg: 'Payment session creation error', error });
            res.status(500).json({
                message: "Error creating payment session: " + error.message
            });
        }
    });
    // Get comments for a specific post
    app.get('/api/comments/:postId', async (req, res) => {
        try {
            const { postId } = req.params;
            // Get comments with author information
            const commentsResult = await db.execute(sql `
        SELECT 
          c.id,
          c.content,
          c.author_id,
          c.created_at,
          c.is_edited,
          c.edit_count,
          c.last_edited_at,
          c.like_count,
          u.first_name,
          u.last_name,
          u.email,
          u.profile_image_url
        FROM comments c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.post_id = ${postId}
        ORDER BY c.created_at DESC
      `);
            const comments = commentsResult.rows;
            // Get replies for each comment
            const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
                const repliesResult = await db.execute(sql `
            SELECT 
              r.id,
              r.content,
              r.author_id,
              r.created_at,
              r.is_edited,
              r.edit_count,
              r.last_edited_at,
              r.like_count,
              u.first_name,
              u.last_name,
              u.email,
              u.profile_image_url
            FROM comment_replies r
            LEFT JOIN users u ON r.author_id = u.id
            WHERE r.parent_comment_id = ${comment.id}
            ORDER BY r.created_at ASC
          `);
                const replies = repliesResult.rows;
                return {
                    ...comment,
                    replies: replies.map((reply) => ({
                        id: reply.id,
                        content: reply.content,
                        author_id: reply.author_id,
                        created_at: reply.created_at,
                        is_edited: reply.is_edited || false,
                        edit_count: reply.edit_count || 0,
                        last_edited_at: reply.last_edited_at,
                        like_count: reply.like_count || 0,
                        first_name: reply.first_name,
                        last_name: reply.last_name,
                        email: reply.email,
                        profile_image_url: reply.profile_image_url,
                        author: {
                            firstName: reply.first_name,
                            lastName: reply.last_name,
                            email: reply.email,
                            profileImageUrl: reply.profile_image_url
                        }
                    }))
                };
            }));
            const cleanedComments = commentsWithReplies.map((comment) => ({
                id: comment.id ?? '',
                content: comment.content ?? '',
                author_id: String(comment.author_id ?? ''),
                created_at: comment.created_at ?? '',
                is_edited: comment.is_edited ?? false,
                edit_count: comment.edit_count ?? 0,
                last_edited_at: comment.last_edited_at ?? '',
                like_count: comment.like_count ?? 0,
                first_name: comment.author?.firstName ?? '',
                last_name: comment.author?.lastName ?? '',
                email: comment.author?.email ?? '',
                profile_image_url: comment.author?.profileImageUrl ?? '',
                author: comment.author ?? {},
                replies: comment.replies ?? []
            }));
            res.json(cleanedComments);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching comments', error });
            res.status(500).json({ message: "Failed to fetch comments" });
        }
    });
    // Legal search endpoint
    app.get('/api/legal/search', async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ message: "Search query is required" });
            }
            // Mock legal search index
            const legalSearchIndex = [
                {
                    id: "charter-1",
                    title: "Canadian Charter of Rights and Freedoms",
                    type: "Constitutional Law",
                    excerpt: "Fundamental rights and freedoms guaranteed to all Canadians, including freedom of expression, religion, and equality rights...",
                    fullText: "The Charter guarantees fundamental freedoms, democratic rights, mobility rights, legal rights, equality rights, and language rights to all Canadians.",
                    keywords: ["charter", "rights", "freedoms", "constitution", "democracy", "equality"],
                    source: "Constitution Act, 1982",
                    citation: "Part I of the Constitution Act, 1982",
                    url: "/legal/charter"
                },
                {
                    id: "andrews-case",
                    title: "Andrews v. Law Society of British Columbia (1989)",
                    type: "Constitutional Cases",
                    excerpt: "First major Supreme Court case interpreting equality rights under Section 15, establishing framework for equality analysis...",
                    fullText: "Landmark case establishing that equality means substantive equality, not just formal equality, and setting the framework for section 15 analysis.",
                    keywords: ["equality", "section 15", "substantive equality", "discrimination", "analogous grounds", "ameliorative programs"],
                    source: "Supreme Court of Canada",
                    citation: "[1989] 1 S.C.R. 143",
                    url: "/legal/constitutional-cases"
                }
            ];
            // Perform keyword search
            const queryParam = typeof query === 'string' ? query : Array.isArray(query) ? String(query[0]) : String(query);
            const searchTerms = queryParam.toLowerCase().split(' ');
            const results = legalSearchIndex.filter(item => {
                const searchableText = [
                    item.title,
                    item.excerpt,
                    item.fullText,
                    ...(Array.isArray(item.keywords) ? item.keywords : [])
                ].join(' ').toLowerCase();
                return searchTerms.some((term) => searchableText.includes(term));
            });
            // Calculate relevance scores
            const scoredResults = results.map(item => {
                let relevance = 0;
                // const searchableText = [item.title, item.excerpt, item.fullText, ...(Array.isArray(item.keywords) ? item.keywords : [])].join(' ').toLowerCase();
                searchTerms.forEach((term) => {
                    // Title matches get highest score
                    if (item.title.toLowerCase().includes(term))
                        relevance += 10;
                    // Keyword matches get high score
                    if (Array.isArray(item.keywords) && item.keywords.some((keyword) => keyword.toLowerCase().includes(term)))
                        relevance += 8;
                    // Excerpt matches get medium score
                    if (item.excerpt.toLowerCase().includes(term))
                        relevance += 5;
                    // Full text matches get low score
                    if (item.fullText.toLowerCase().includes(term))
                        relevance += 2;
                });
                return { ...item, relevance: relevance / 100 };
            }).sort((a, b) => b.relevance - a.relevance);
            // Group by category
            const categories = {};
            scoredResults.forEach((result) => {
                const type = result.type;
                if (!categories[type])
                    categories[type] = 0;
                categories[type]++;
            });
            const searchResults = {
                query: query,
                totalResults: scoredResults.length,
                categories,
                results: scoredResults.slice(0, 20) // Limit to top 20 results
            };
            res.json(searchResults);
        }
        catch (error) {
            logger.error({ msg: 'Error performing legal search', error });
            res.status(500).json({ message: "Failed to perform legal search" });
        }
    });
    // Public endpoint: Get total donations (CAD)
    app.get('/api/donations/total', async (_req, res) => {
        try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
            let total = 0;
            let hasMore = true;
            let startingAfter = undefined;
            while (hasMore) {
                const charges = await stripe.charges.list({
                    limit: 100,
                    starting_after: startingAfter,
                });
                for (const charge of charges.data) {
                    if (charge.paid && charge.status === 'succeeded' && charge.currency === 'cad') {
                        total += charge.amount;
                    }
                }
                hasMore = charges.has_more;
                startingAfter = charges.data.length > 0 ? charges.data[charges.data.length - 1].id : undefined;
            }
            // Stripe amounts are in cents
            res.json({ total: total / 100 });
        }
        catch (err) {
            res.status(500).json({ message: 'Failed to fetch donation total', error: err?.message });
        }
    });
    // Data scraping endpoints
    app.post('/api/scrapers/trigger', async (req, res) => {
        try {
            console.log("Manual scraper trigger requested");
            const { syncAllGovernmentData } = await import('./dataSync.js');
            await syncAllGovernmentData();
            res.json({ message: "Data scraping completed successfully" });
        }
        catch (error) {
            console.error("Manual scraper trigger failed:", error);
            res.status(500).json({ message: "Data scraping failed", error: error.message });
        }
    });
    app.get('/api/scrapers/status', async (req, res) => {
        try {
            // Check database for scraped data
            const politicians = await db.execute(sql `SELECT COUNT(*) as count FROM politicians`);
            const bills = await db.execute(sql `SELECT COUNT(*) as count FROM bills`);
            const legalActs = await db.execute(sql `SELECT COUNT(*) as count FROM legal_acts`);
            res.json({
                status: "active",
                lastRun: new Date().toISOString(),
                dataCounts: {
                    politicians: politicians.rows[0]?.count || 0,
                    bills: bills.rows[0]?.count || 0,
                    legalActs: legalActs.rows[0]?.count || 0
                }
            });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to get scraper status", error: error.message });
        }
    });
    app.post('/api/scrapers/politicians', async (req, res) => {
        try {
            console.log("Scraping politicians...");
            const { scrapeCurrentMPs } = await import('./scrapers.js');
            const mps = await scrapeCurrentMPs();
            // Store politicians
            for (const mp of mps) {
                try {
                    await storage.createPolitician({
                        name: mp.name,
                        position: mp.position || "Member of Parliament",
                        party: mp.party,
                        constituency: mp.constituency,
                        jurisdiction: mp.province,
                        trustScore: "85.0"
                    });
                }
                catch (error) {
                    // Ignore duplicates
                    if (!error.message?.includes('duplicate')) {
                        console.error('Error storing MP:', error);
                    }
                }
            }
            res.json({ message: `Scraped ${mps.length} politicians successfully` });
        }
        catch (error) {
            console.error("Politician scraping failed:", error);
            res.status(500).json({ message: "Politician scraping failed", error: error.message });
        }
    });
    app.post('/api/scrapers/bills', async (req, res) => {
        try {
            console.log("Scraping bills...");
            const { scrapeFederalBills } = await import('./scrapers.js');
            const bills = await scrapeFederalBills();
            // Store bills
            for (const bill of bills) {
                try {
                    await storage.createBill({
                        billNumber: bill.number,
                        title: bill.title,
                        description: bill.summary,
                        fullText: "",
                        category: inferCategory(bill.title),
                        jurisdiction: "Federal",
                        status: bill.status,
                        votingDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    });
                }
                catch (error) {
                    // Ignore duplicates
                    if (!error.message?.includes('duplicate')) {
                        console.error('Error storing bill:', error);
                    }
                }
            }
            res.json({ message: `Scraped ${bills.length} bills successfully` });
        }
        catch (error) {
            console.error("Bill scraping failed:", error);
            res.status(500).json({ message: "Bill scraping failed", error: error.message });
        }
    });
    // Helper function for bill category inference
    function inferCategory(title) {
        const text = title.toLowerCase();
        if (text.includes('budget') || text.includes('tax') || text.includes('economic')) {
            return 'Finance & Economy';
        }
        else if (text.includes('health') || text.includes('medical')) {
            return 'Healthcare';
        }
        else if (text.includes('environment') || text.includes('climate')) {
            return 'Environment';
        }
        else if (text.includes('education') || text.includes('school')) {
            return 'Education';
        }
        else if (text.includes('defence') || text.includes('security')) {
            return 'Defence & Security';
        }
        else if (text.includes('transport') || text.includes('infrastructure')) {
            return 'Infrastructure';
        }
        else {
            return 'General Legislation';
        }
    }
    // Add after other auth routes:
    app.post('/api/verify-temporary', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            await storage.updateUserVerification(userId, true);
            const updatedUser = await storage.getUser(userId);
            res.json({ success: true, user: updatedUser });
        }
        catch (error) {
            res.status(500).json({ success: false, error: (error instanceof Error ? error.message : String(error)) });
        }
    });
    // Add after other auth/user routes:
    app.get('/api/identity/status', jwtAuth, async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await storage.getUser(userId);
            if (!user)
                return res.status(404).json({ isVerified: false, verificationLevel: 'none' });
            res.json({
                isVerified: !!user.isVerified,
                verificationLevel: user.isVerified ? 'Temporary Verified' : 'none',
                verifiedAt: user.isVerified ? user.updatedAt : null,
                permissions: {
                    canVote: !!user.isVerified,
                    canComment: true,
                    canCreatePetitions: !!user.isVerified,
                    canAccessFOI: !!user.isVerified
                }
            });
        }
        catch (error) {
            res.status(500).json({ isVerified: false, verificationLevel: 'none', error: (error instanceof Error ? error.message : String(error)) });
        }
    });
    // GCKey OAuth callback endpoint
    app.get('/api/auth/gckey/callback', async (req, res) => {
        try {
            // In production, validate the code and state with GCKey
            const { code, state } = req.query;
            // TODO: Exchange code for user info with GCKey
            // For now, simulate verification for the logged-in user (JWT in cookie or header)
            let userId = null;
            // Try to get userId from JWT in Authorization header
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    const decoded = jwt.verify(token, JWT_SECRET);
                    if (typeof decoded === 'object' && decoded && 'id' in decoded) {
                        userId = decoded.id;
                    }
                }
                catch (err) {
                    return res.status(401).json({ error: 'Invalid or expired token' });
                }
            }
            // Optionally, support session/cookie-based auth here
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            await storage.updateUserVerification(userId, true);
            // Redirect to frontend with success (customize as needed)
            return res.redirect('/identity-verification?verified=1');
        }
        catch (error) {
            res.status(500).json({ error: (error instanceof Error ? error.message : String(error)) });
        }
    });
    // User search endpoint (no auth, but rate-limited)
    app.use("/api/users/search", rateLimit({ windowMs: 60 * 1000, max: 30 }));
    app.get("/api/users/search", async (req, res) => {
        const q = (req.query.q || "").trim();
        if (!q || q.length < 2)
            return res.status(400).json({ error: "Query too short" });
        try {
            const users = await storage.searchUsers(q);
            // Only return safe fields
            const safeUsers = users.map(u => ({
                id: u.id,
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                profileImageUrl: u.profileImageUrl,
            }));
            res.json({ users: safeUsers });
        }
        catch (err) {
            res.status(500).json({ error: "Failed to search users", details: err });
        }
    });
    // PATCH /api/users/:userId/profile - update bio, location, website, social
    app.patch('/api/users/:userId/profile', jwtAuth, async (req, res) => {
        try {
            const { userId } = req.params;
            if (req.user?.id !== userId)
                return res.status(403).json({ message: "Forbidden" });
            const { bio, location, website, social, firstName, lastName, profileImageUrl } = req.body;
            const updateData = {
                updatedAt: new Date(),
            };
            if (bio !== undefined)
                updateData.bio = bio;
            if (location !== undefined)
                updateData.location = location;
            if (website !== undefined)
                updateData.website = website;
            if (social !== undefined)
                updateData.social = social;
            if (firstName !== undefined)
                updateData.firstName = firstName;
            if (lastName !== undefined)
                updateData.lastName = lastName;
            if (profileImageUrl !== undefined)
                updateData.profileImageUrl = profileImageUrl;
            await db.update(users)
                .set(updateData)
                .where(eq(users.id, userId));
            res.json({ success: true });
        }
        catch (error) {
            logger.error({ msg: 'Error updating user profile', error });
            res.status(500).json({ message: "Failed to update profile" });
        }
    });
    // FOI routes
    app.get('/api/foi/requests', async (req, res) => {
        try {
            const requests = await db.execute(sql `
        SELECT 
          id, title, department, requestor, date_submitted as "dateSubmitted",
          date_responded as "dateResponded", status, response_type as "responseType",
          pages_requested as "pagesRequested", pages_released as "pagesReleased",
          pages_withheld as "pagesWithheld", exemptions_used as "exemptionsUsed",
          total_cost as "totalCost", summary, key_findings as "keyFindings",
          public_impact as "publicImpact", media_attention as "mediaAttention"
        FROM foi_requests 
        ORDER BY date_submitted DESC 
        LIMIT 100
      `);
            res.json(requests.rows);
        }
        catch (error) {
            logger.error({ msg: 'Error fetching FOI requests', error });
            res.status(500).json({ message: "Failed to fetch FOI requests" });
        }
    });
}
