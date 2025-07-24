import { db } from "../db.js";
import { users, politicians, electoralDistricts } from "../../shared/schema.js";
import { eq, desc, sql, count } from "drizzle-orm";
// JWT Auth middleware
function jwtAuth(req, res, next) {
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
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
export function registerMapsRoutes(app) {
    // Get electoral districts for mapping
    app.get('/api/maps/districts', async (req, res) => {
        try {
            const districts = await db.select().from(electoralDistricts).orderBy(electoralDistricts.districtName);
            res.json({
                districts,
                total: districts.length,
                message: "Electoral districts retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch electoral districts' });
        }
    });
    // Get user engagement by location
    app.get('/api/maps/engagement', jwtAuth, async (req, res) => {
        try {
            const usersWithLocation = await db.select()
                .from(users)
                .where(sql `${users.latitude} IS NOT NULL AND ${users.longitude} IS NOT NULL`)
                .orderBy(desc(users.createdAt));
            res.json({
                users: usersWithLocation,
                total: usersWithLocation.length,
                message: "User engagement data retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch user engagement data' });
        }
    });
    // Get politicians by district
    app.get('/api/maps/politicians/:districtId', async (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch politicians in district' });
        }
    });
    // Get engagement statistics
    app.get('/api/maps/stats', async (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch map statistics' });
        }
    });
}
