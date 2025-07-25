import { db } from "../db.js";
import { users, politicians, electoralDistricts } from "../../shared/schema.js";
import { eq, desc, sql, count } from "drizzle-orm";
import { ResponseFormatter } from "../utils/responseFormatter.js";
import jwt from "jsonwebtoken";
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
export function registerMapsRoutes(app) {
    // Root maps endpoint
    app.get('/api/maps', async (req, res) => {
        try {
            // Ensure we have some sample districts if none exist
            const districtsCount = await db.select({ count: count() }).from(electoralDistricts);
            if (districtsCount[0]?.count === 0) {
                // Insert sample districts
                await db.insert(electoralDistricts).values([
                    {
                        districtName: "Toronto Centre",
                        districtNumber: "35035",
                        province: "Ontario",
                        population: 120000,
                        area: "12.5",
                        majorCities: ["Toronto"],
                        currentRepresentative: "Hon. Chrystia Freeland",
                        lastElectionTurnout: "65.2",
                        isUrban: true,
                        isRural: false,
                    },
                    {
                        districtName: "Vancouver Granville",
                        districtNumber: "59035",
                        province: "British Columbia",
                        population: 110000,
                        area: "15.2",
                        majorCities: ["Vancouver"],
                        currentRepresentative: "Hon. Taleeb Noormohamed",
                        lastElectionTurnout: "68.1",
                        isUrban: true,
                        isRural: false,
                    },
                    {
                        districtName: "Calgary Centre",
                        districtNumber: "48005",
                        province: "Alberta",
                        population: 105000,
                        area: "18.7",
                        majorCities: ["Calgary"],
                        currentRepresentative: "Hon. Greg McLean",
                        lastElectionTurnout: "62.8",
                        isUrban: true,
                        isRural: false,
                    }
                ]).onConflictDoNothing();
            }
            const [districts, politiciansData, stats] = await Promise.all([
                db.select().from(electoralDistricts).orderBy(electoralDistricts.districtName),
                db.select().from(politicians).orderBy(desc(politicians.createdAt)),
                db.select({ count: count() }).from(electoralDistricts)
            ]);
            res.json({
                districts: districts.slice(0, 10),
                politicians: politiciansData.slice(0, 20),
                totalDistricts: stats[0]?.count || 0,
                message: "Maps data retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch maps data' });
        }
    });
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
