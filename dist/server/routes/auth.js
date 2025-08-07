import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { storage } from "../storage.js";
import { upload } from "../middleware/upload.js";
// JWT configuration
const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
}
function generateToken(user) {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET not configured");
    }
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
        issuer: 'civicos',
        audience: 'civicos-users'
    });
}
export function jwtAuth(req, res, next) {
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
export function registerAuthRoutes(app) {
    // Function to generate unique username
    async function generateUniqueUsername(firstName, lastName, email) {
        // Create base username from first and last name
        const baseUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
        // Check if base username exists
        const existingUser = await db
            .select({ username: users.username })
            .from(users)
            .where(eq(users.username, baseUsername))
            .limit(1);
        if (existingUser.length === 0) {
            return baseUsername;
        }
        // If base username exists, try with numbers
        for (let i = 1; i <= 999; i++) {
            const usernameWithNumber = `${baseUsername}${i}`;
            const existingUserWithNumber = await db
                .select({ username: users.username })
                .from(users)
                .where(eq(users.username, usernameWithNumber))
                .limit(1);
            if (existingUserWithNumber.length === 0) {
                return usernameWithNumber;
            }
        }
        // If all attempts fail, use email-based username with timestamp
        return `${email.split('@')[0]}_${Date.now()}`;
    }
    // Environment check endpoint
    app.get("/api/auth/env-check", async (req, res) => {
        try {
            const sessionSecret = process.env.SESSION_SECRET;
            const nodeEnv = process.env.NODE_ENV;
            res.json({
                status: 'success',
                hasSessionSecret: !!sessionSecret,
                sessionSecretLength: sessionSecret ? sessionSecret.length : 0,
                nodeEnv,
                timestamp: new Date().toISOString()
            });
        }
        catch (err) {
            res.status(500).json({
                status: 'error',
                message: 'Environment check failed',
                error: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    });
    // Registration endpoint
    app.post("/api/auth/register", async (req, res) => {
        try {
            const { 
            // Basic Information
            email, password, firstName, lastName, middleName, preferredName, phoneNumber, dateOfBirth, gender, 
            // Address Information
            streetAddress, apartmentUnit, city, province, postalCode, country, 
            // Professional Information
            employer, jobTitle, industry, yearsOfExperience, highestEducation, almaMater, graduationYear, 
            // Political Engagement
            politicalExperience, campaignExperience, volunteerExperience, advocacyAreas, policyInterests, 
            // Emergency Contact
            emergencyContactName, emergencyContactPhone, emergencyContactRelationship, 
            // Membership
            membershipType, 
            // Terms and Conditions
            agreeToTerms, agreeToPrivacy, agreeToMarketing } = req.body;
            // Required fields validation
            if (!email || !password || !firstName || !lastName || !agreeToTerms) {
                return res.status(400).json({
                    message: "Required fields: email, password, firstName, lastName, and agreement to terms"
                });
            }
            // Check if user already exists
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({ message: "Email already registered" });
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);
            // Create user with comprehensive profile data
            const userId = uuidv4();
            const now = new Date();
            // Calculate profile completion percentage
            const requiredFields = ['firstName', 'lastName', 'email', 'city', 'province', 'postalCode'];
            const optionalFields = [
                'middleName', 'preferredName', 'phoneNumber', 'dateOfBirth', 'gender',
                'streetAddress', 'employer', 'jobTitle', 'industry', 'highestEducation',
                'emergencyContactName', 'emergencyContactPhone'
            ];
            let completedFields = 0;
            const totalFields = requiredFields.length + optionalFields.length;
            // Count completed required fields
            requiredFields.forEach(field => {
                if (req.body[field])
                    completedFields++;
            });
            // Count completed optional fields
            optionalFields.forEach(field => {
                if (req.body[field])
                    completedFields++;
            });
            const profileCompletionPercentage = Math.round((completedFields / totalFields) * 100);
            const userData = {
                id: userId,
                username: await generateUniqueUsername(firstName, lastName, email),
                email,
                password: hashedPassword,
                firstName,
                lastName,
                middleName: middleName || null,
                preferredName: preferredName || null,
                phoneNumber: phoneNumber || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender: gender || null,
                // Address Information
                streetAddress: streetAddress || null,
                apartmentUnit: apartmentUnit || null,
                city: city || null,
                province: province || null,
                postalCode: postalCode || null,
                country: country || 'Canada',
                // Professional Information
                employer: employer || null,
                jobTitle: jobTitle || null,
                industry: industry || null,
                yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
                highestEducation: highestEducation || null,
                almaMater: almaMater || null,
                graduationYear: graduationYear ? parseInt(graduationYear) : null,
                // Political Engagement
                politicalExperience: politicalExperience || null,
                campaignExperience: campaignExperience || null,
                volunteerExperience: volunteerExperience || null,
                advocacyAreas: advocacyAreas || [],
                policyInterests: policyInterests || [],
                // Emergency Contact
                emergencyContactName: emergencyContactName || null,
                emergencyContactPhone: emergencyContactPhone || null,
                emergencyContactRelationship: emergencyContactRelationship || null,
                // Membership
                membershipType: membershipType || 'citizen',
                membershipStatus: 'active',
                membershipStartDate: now,
                accessLevel: membershipType === 'citizen' ? 'basic' : membershipType === 'press' ? 'press' : 'government',
                // Communication Preferences
                emailPreferences: {
                    marketing: agreeToMarketing || false,
                    updates: true,
                    notifications: true
                },
                notificationPreferences: {
                    email: true,
                    push: true,
                    sms: false
                },
                privacySettings: {
                    profileVisibility: 'public',
                    showEmail: false,
                    showPhone: false
                },
                // Default values
                civicPoints: 0,
                currentLevel: 1,
                trustScore: "100.00",
                verificationLevel: 'unverified',
                engagementLevel: 'newcomer',
                achievementTier: 'bronze',
                profileCompletionPercentage,
                socialLinks: {},
                featureAccess: {},
                usageLimits: {},
                createdAt: now,
                updatedAt: now,
            };
            const user = await storage.createUser(userData);
            // Generate token
            const token = generateToken(user);
            res.status(201).json({
                message: "User registered successfully",
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    membershipType: user.membershipType,
                    accessLevel: user.accessLevel,
                    profileCompletionPercentage: user.profileCompletionPercentage,
                    civicPoints: user.civicPoints,
                    trustScore: user.trustScore,
                }
            });
        }
        catch (err) {
            res.status(500).json({ message: err?.message || 'Registration failed' });
        }
    });
    // Login endpoint
    app.post("/api/auth/login", async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            // Find user by email
            const user = await storage.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password || '');
            if (!isValidPassword) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            // Generate token
            const token = generateToken(user);
            res.json({
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                }
            });
        }
        catch (err) {
            res.status(500).json({ message: err?.message || 'Login failed' });
        }
    });
    // Auth user endpoint (JWT protected)
    app.get('/api/auth/user', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            // Get user from database
            const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (user.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            const userData = user[0];
            res.json({
                id: userData.id,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
                membershipType: userData.membershipType,
                civicLevel: userData.civicLevel,
                trustScore: userData.trustScore,
                civicPoints: userData.civicPoints,
                profileCompletionPercentage: userData.profileCompletionPercentage,
                verificationLevel: userData.verificationLevel,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt
            });
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    });
    // Logout route (no-op for JWT)
    app.post('/api/auth/logout', (req, res) => {
        res.json({ message: "Logged out (client should delete token)" });
    });
    // Profile update endpoint (JWT protected)
    app.put('/api/users/profile', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { firstName, lastName, bio, profileImageUrl, website } = req.body;
            // Update user profile
            await db.update(users)
                .set({
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                bio: bio || undefined,
                profileImageUrl: profileImageUrl || undefined,
                website: website || undefined,
                updatedAt: new Date()
            })
                .where(eq(users.id, userId));
            res.json({ message: "Profile updated successfully" });
        }
        catch (error) {
            res.status(500).json({ message: 'Profile update failed', error: error?.message || String(error) });
        }
    });
    // Profile picture upload route (JWT protected)
    app.post('/api/auth/upload-profile-picture', jwtAuth, upload.single('profileImage'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            const userId = req.user?.id;
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
            res.status(500).json({ message: 'Profile picture upload failed', error: error?.message || String(error) });
        }
    });
    return { jwtAuth };
}
