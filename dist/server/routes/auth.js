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
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
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
    // Debug endpoint to check JWT secret
    app.get("/api/auth/debug-jwt", async (req, res) => {
        try {
            const secret = process.env.SESSION_SECRET;
            const hasSecret = !!secret;
            const secretLength = secret ? secret.length : 0;
            res.json({
                status: 'success',
                hasSecret,
                secretLength,
                secretPreview: secret ? `${secret.substring(0, 10)}...` : 'undefined',
                timestamp: new Date().toISOString()
            });
        }
        catch (err) {
            res.status(500).json({
                status: 'error',
                message: 'Debug endpoint failed',
                error: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    });
    // Test endpoint to check database schema
    app.get("/api/auth/test-schema", async (req, res) => {
        try {
            console.log('🔍 Testing database schema...');
            // Test if we can create a user with all fields
            const testUserData = {
                id: 'test-schema-check',
                email: 'test@example.com',
                password: 'test',
                firstName: 'Test',
                lastName: 'User',
                phoneNumber: '123-456-7890',
                dateOfBirth: new Date('1990-01-01'),
                city: 'Test City',
                province: 'Test Province',
                postalCode: 'A1A 1A1',
                federalRiding: 'Test Riding',
                provincialRiding: 'Test Provincial Riding',
                municipalWard: 'Test Ward',
                citizenshipStatus: 'citizen',
                voterRegistrationStatus: 'registered',
                communicationStyle: 'auto',
                country: 'Canada',
                civicPoints: 0,
                currentLevel: 1,
                trustScore: "100.00",
                verificationLevel: 'unverified',
                engagementLevel: 'newcomer',
                achievementTier: 'bronze',
                profileCompleteness: 50,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            console.log('📝 Test user data:', testUserData);
            // Try to create the user (this will fail if fields don't exist)
            const user = await storage.createUser(testUserData);
            console.log('✅ Schema test successful - all fields available');
            // Clean up the test user
            await db.delete(users).where(eq(users.id, 'test-schema-check'));
            res.json({
                status: 'success',
                message: 'Database schema is correct - all user fields available',
                timestamp: new Date().toISOString()
            });
        }
        catch (err) {
            console.error('❌ Schema test failed:', err);
            res.status(500).json({
                status: 'error',
                message: 'Database schema test failed - missing fields',
                error: err?.message || String(err),
                timestamp: new Date().toISOString()
            });
        }
    });
    // Registration endpoint
    app.post("/api/auth/register", async (req, res) => {
        try {
            console.log('🔍 Registration request received:', {
                body: req.body,
                headers: req.headers,
                method: req.method,
                url: req.url
            });
            const { email, password, firstName, lastName, phoneNumber, dateOfBirth, city, province, postalCode, federalRiding, provincialRiding, municipalWard, citizenshipStatus, voterRegistrationStatus, communicationStyle } = req.body;
            console.log('📝 Parsed registration data:', {
                email: email ? 'provided' : 'missing',
                password: password ? 'provided' : 'missing',
                firstName: firstName ? 'provided' : 'missing',
                lastName: lastName ? 'provided' : 'missing',
                city: city ? 'provided' : 'missing',
                province: province ? 'provided' : 'missing',
                postalCode: postalCode ? 'provided' : 'missing',
                phoneNumber: phoneNumber ? 'provided' : 'missing',
                dateOfBirth: dateOfBirth ? 'provided' : 'missing',
                federalRiding: federalRiding ? 'provided' : 'missing',
                provincialRiding: provincialRiding ? 'provided' : 'missing',
                municipalWard: municipalWard ? 'provided' : 'missing',
                citizenshipStatus: citizenshipStatus ? 'provided' : 'missing',
                voterRegistrationStatus: voterRegistrationStatus ? 'provided' : 'missing',
                communicationStyle: communicationStyle ? 'provided' : 'missing'
            });
            // Required fields validation (only essentials)
            if (!email || !password || !firstName || !lastName) {
                console.log('❌ Missing required fields:', {
                    email: !!email,
                    password: !!password,
                    firstName: !!firstName,
                    lastName: !!lastName
                });
                return res.status(400).json({ message: "Required fields: email, password, firstName, lastName" });
            }
            // Check if user already exists
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
                console.log('❌ User already exists:', email);
                return res.status(409).json({ message: "Email already registered" });
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);
            // Create user with enhanced profile data
            const userId = uuidv4();
            const now = new Date();
            const userData = {
                id: userId,
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phoneNumber: phoneNumber || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                city: city || null,
                province: province || null,
                postalCode: postalCode || null,
                federalRiding: federalRiding || null,
                provincialRiding: provincialRiding || null,
                municipalWard: municipalWard || null,
                citizenshipStatus: citizenshipStatus || null,
                voterRegistrationStatus: voterRegistrationStatus || null,
                communicationStyle: communicationStyle || null,
                country: 'Canada',
                civicPoints: 0,
                currentLevel: 1,
                trustScore: "100.00",
                verificationLevel: 'unverified',
                engagementLevel: 'newcomer',
                achievementTier: 'bronze',
                profileCompleteness: 50,
                createdAt: now,
                updatedAt: now,
            };
            console.log('👤 Creating user with data:', {
                id: userData.id,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                city: userData.city,
                province: userData.province,
                postalCode: userData.postalCode
            });
            const user = await storage.createUser(userData);
            console.log('✅ User created successfully:', user.id);
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
                    city: user.city,
                    province: user.province,
                    civicPoints: user.civicPoints,
                    trustScore: user.trustScore,
                }
            });
        }
        catch (err) {
            console.error('❌ Registration error:', err);
            res.status(500).json({ message: err?.message || 'Registration failed' });
        }
    });
    // Login endpoint
    app.post("/api/auth/login", async (req, res) => {
        try {
            console.log('🔍 Login request received:', {
                body: req.body,
                headers: req.headers,
                method: req.method,
                url: req.url
            });
            const { email, password } = req.body;
            if (!email || !password) {
                console.log('❌ Missing login credentials:', {
                    email: !!email,
                    password: !!password
                });
                return res.status(400).json({ message: "Email and password are required" });
            }
            // Find user by email
            const user = await storage.getUserByEmail(email);
            if (!user) {
                console.log('❌ User not found for login:', email);
                return res.status(401).json({ message: "Invalid credentials" });
            }
            console.log('👤 User found for login:', {
                id: user.id,
                email: user.email,
                hasPassword: !!user.password
            });
            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password || '');
            if (!isValidPassword) {
                console.log('❌ Invalid password for user:', email);
                return res.status(401).json({ message: "Invalid credentials" });
            }
            console.log('✅ Login successful for user:', email);
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
            console.error('❌ Login error:', err?.stack || err);
            res.status(500).json({ message: err?.message || 'Login failed' });
        }
    });
    // Auth user endpoint (JWT)
    app.get('/api/auth/user', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            try {
                const user = await storage.getUser(userId);
                if (user) {
                    // Return the complete user object
                    return res.json(user);
                }
                else {
                    return res.status(404).json({ message: "User not found" });
                }
            }
            catch (dbError) {
                console.error("[/api/auth/user] Database error:", dbError);
                return res.status(500).json({ message: "Internal server error" });
            }
        }
        catch (error) {
            console.error("[/api/auth/user] Handler error:", error);
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
            const { firstName, lastName, bio, profileImageUrl, location, website } = req.body;
            // Update user profile
            await db.update(users)
                .set({
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                bio: bio || undefined,
                profileImageUrl: profileImageUrl || undefined,
                location: location || undefined,
                website: website || undefined,
                updatedAt: new Date()
            })
                .where(eq(users.id, userId));
            res.json({ message: "Profile updated successfully" });
        }
        catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ message: "Failed to update profile" });
        }
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
            console.error('Error uploading profile picture:', error);
            res.status(500).json({ message: "Failed to upload profile picture" });
        }
    });
    return { jwtAuth };
}
