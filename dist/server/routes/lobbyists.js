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
            // Sample lobbyist data for demonstration
            const allLobbyists = [
                {
                    id: 1,
                    name: "Canadian Association of Petroleum Producers",
                    type: "Industry Association",
                    registrationDate: "2023-01-15",
                    status: "active",
                    primaryIssues: ["Energy Policy", "Climate Regulations", "Infrastructure"],
                    totalSpending: 2500000,
                    meetingsCount: 45,
                    lastActivity: "2025-01-20"
                },
                {
                    id: 2,
                    name: "Canadian Medical Association",
                    type: "Professional Association",
                    registrationDate: "2022-06-10",
                    status: "active",
                    primaryIssues: ["Healthcare Funding", "Medical Training", "Drug Pricing"],
                    totalSpending: 1800000,
                    meetingsCount: 32,
                    lastActivity: "2025-01-18"
                },
                {
                    id: 3,
                    name: "Canadian Bankers Association",
                    type: "Industry Association",
                    registrationDate: "2021-03-22",
                    status: "active",
                    primaryIssues: ["Financial Regulations", "Consumer Protection", "Digital Banking"],
                    totalSpending: 3200000,
                    meetingsCount: 67,
                    lastActivity: "2025-01-22"
                },
                {
                    id: 4,
                    name: "Canadian Federation of Agriculture",
                    type: "Industry Association",
                    registrationDate: "2022-09-05",
                    status: "active",
                    primaryIssues: ["Agricultural Subsidies", "Trade Policy", "Climate Adaptation"],
                    totalSpending: 950000,
                    meetingsCount: 28,
                    lastActivity: "2025-01-15"
                },
                {
                    id: 5,
                    name: "Canadian Labour Congress",
                    type: "Labour Union",
                    registrationDate: "2020-11-12",
                    status: "active",
                    primaryIssues: ["Workplace Safety", "Minimum Wage", "Pension Reform"],
                    totalSpending: 2100000,
                    meetingsCount: 41,
                    lastActivity: "2025-01-19"
                }
            ];
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
            // Sample lobbyist data for demonstration
            const lobbyistData = {
                id: parseInt(id),
                name: "Canadian Association of Petroleum Producers",
                type: "Industry Association",
                registrationDate: "2023-01-15",
                status: "active",
                primaryIssues: ["Energy Policy", "Climate Regulations", "Infrastructure"],
                totalSpending: 2500000,
                meetingsCount: 45,
                lastActivity: "2025-01-20",
                contactInfo: {
                    address: "350 7th Avenue SW, Calgary, AB",
                    phone: "403-267-1100",
                    email: "info@capp.ca",
                    website: "https://www.capp.ca"
                },
                recentMeetings: [
                    {
                        date: "2025-01-20",
                        official: "Minister of Natural Resources",
                        topic: "Energy transition policy",
                        outcome: "Policy discussion"
                    },
                    {
                        date: "2025-01-15",
                        official: "Deputy Minister of Environment",
                        topic: "Climate regulations",
                        outcome: "Regulatory consultation"
                    }
                ]
            };
            const processingTime = Date.now() - startTime;
            return ResponseFormatter.success(res, lobbyistData, "Lobbyist data retrieved successfully", 200, undefined, undefined, processingTime);
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
