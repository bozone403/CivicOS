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
    // Registration endpoint
    app.post("/api/auth/register", async (req, res) => {
        try {
            const { email, password, firstName, lastName, city, province, postalCode } = req.body;
            if (!email || !password || !firstName || !lastName || !city || !province || !postalCode) {
                return res.status(400).json({ message: "All fields are required: email, password, firstName, lastName, city, province, postalCode" });
            }
            // Check if user already exists
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({ message: "Email already registered" });
            }
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);
            // Create user with enhanced profile data
            const userId = uuidv4();
            const now = new Date();
            const user = await storage.createUser({
                id: userId,
                email,
                password: hashedPassword,
                firstName,
                lastName,
                city,
                province,
                postalCode,
                country: 'Canada',
                civicPoints: 0,
                currentLevel: 1,
                trustScore: "100.00",
                verificationLevel: 'unverified',
                communicationStyle: 'auto',
                engagementLevel: 'newcomer',
                achievementTier: 'bronze',
                profileCompleteness: 50, // Enhanced profile with location data
                createdAt: now,
                updatedAt: now,
            });
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
            console.error('Registration error:', err);
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
            console.error('Login error:', err?.stack || err);
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
