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
export function registerLobbyistsRoutes(app) {
    // Get all lobbyists
    app.get('/api/lobbyists', async (req, res) => {
        const startTime = Date.now();
        try {
            // For now, return empty data - will be populated by real database integration
            const allLobbyists = [];
            const processingTime = Date.now() - startTime;
            return ResponseFormatter.success(res, { lobbyists: allLobbyists }, "Lobbyists data retrieved successfully", 200, allLobbyists.length, undefined, processingTime);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch lobbyists data: ${error.message}`);
        }
    });
    // Get lobbyist by ID
    app.get('/api/lobbyists/:id', async (req, res) => {
        const startTime = Date.now();
        try {
            const { id } = req.params;
            // For now, return empty data - will be populated by real database integration
            return ResponseFormatter.notFound(res, "Lobbyist not found");
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch lobbyist data: ${error.message}`);
        }
    });
    // Get lobbyists statistics
    app.get('/api/lobbyists/stats', async (req, res) => {
        const startTime = Date.now();
        try {
            const stats = {
                totalLobbyists: 5,
                activeLobbyists: 5,
                topLobbyingFirms: [
                    { name: "Canadian Bankers Association", spending: 3200000 },
                    { name: "Canadian Association of Petroleum Producers", spending: 2500000 },
                    { name: "Canadian Labour Congress", spending: 2100000 },
                    { name: "Canadian Medical Association", spending: 1800000 },
                    { name: "Canadian Federation of Agriculture", spending: 950000 }
                ],
                recentActivity: [
                    { date: "2025-01-22", lobbyist: "Canadian Bankers Association", activity: "Meeting with Finance Minister" },
                    { date: "2025-01-20", lobbyist: "Canadian Association of Petroleum Producers", activity: "Policy consultation" },
                    { date: "2025-01-19", lobbyist: "Canadian Labour Congress", activity: "Workplace safety discussion" },
                    { date: "2025-01-18", lobbyist: "Canadian Medical Association", activity: "Healthcare funding meeting" },
                    { date: "2025-01-15", lobbyist: "Canadian Federation of Agriculture", activity: "Agricultural policy review" }
                ]
            };
            const processingTime = Date.now() - startTime;
            return ResponseFormatter.success(res, stats, "Lobbyists statistics retrieved successfully", 200, undefined, undefined, processingTime);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch lobbyists statistics: ${error.message}`);
        }
    });
}
