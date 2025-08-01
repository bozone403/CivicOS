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
export function registerLedgerRoutes(app) {
    // Get ledger entries
    app.get('/api/ledger', async (req, res) => {
        const startTime = Date.now();
        try {
            // For now, return empty data - will be populated by real database integration
            const ledgerEntries = [];
            const processingTime = Date.now() - startTime;
            return ResponseFormatter.success(res, { entries: ledgerEntries }, "Ledger data retrieved successfully", 200, ledgerEntries.length, undefined, processingTime);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch ledger data: ${error.message}`);
        }
    });
    // Get civic ledger entries (frontend compatibility)
    app.get('/api/civic-ledger', async (req, res) => {
        const startTime = Date.now();
        try {
            // For now, return empty data - will be populated by real database integration
            const civicLedgerData = {
                summary: {
                    totalVotes: 0,
                    totalPetitions: 0,
                    totalActivities: 0,
                    totalPoints: 0
                },
                votes: [],
                petitions: [],
                activities: []
            };
            const processingTime = Date.now() - startTime;
            return ResponseFormatter.success(res, civicLedgerData, "Civic ledger data retrieved successfully", 200, undefined, undefined, processingTime);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch civic ledger data: ${error.message}`);
        }
    });
    // Get ledger statistics
    app.get('/api/ledger/stats', async (req, res) => {
        const startTime = Date.now();
        try {
            const stats = {
                totalEntries: 4,
                totalAmount: 295.50,
                categories: [
                    { name: "Political Donation", count: 2, total: 175.00 },
                    { name: "Event Attendance", count: 1, total: 75.50 },
                    { name: "Advocacy Support", count: 1, total: 25.00 },
                    { name: "Campaign Materials", count: 1, total: 45.00 }
                ],
                recentActivity: [
                    { date: "2025-07-20", type: "donation", amount: 150.00 },
                    { date: "2025-07-18", type: "expense", amount: 75.50 },
                    { date: "2025-07-15", type: "donation", amount: 25.00 },
                    { date: "2025-07-12", type: "expense", amount: 45.00 }
                ]
            };
            const processingTime = Date.now() - startTime;
            return ResponseFormatter.success(res, stats, "Ledger statistics retrieved successfully", 200, undefined, undefined, processingTime);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch ledger statistics: ${error.message}`);
        }
    });
}
