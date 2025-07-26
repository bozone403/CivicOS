import { ResponseFormatter } from "../utils/responseFormatter.js";
// JWT Auth middleware
function jwtAuth(req, res, next) {
    // Simple JWT check for now
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return ResponseFormatter.unauthorized(res, "Missing or invalid token");
    }
    // For now, just check if token exists
    req.user = { id: 'test-user-id' };
    next();
}
export function registerLedgerRoutes(app) {
    // Get ledger entries
    app.get('/api/ledger', async (req, res) => {
        const startTime = Date.now();
        try {
            // Sample ledger data for demonstration
            const ledgerEntries = [
                {
                    id: 1,
                    type: "donation",
                    amount: 150.00,
                    description: "Campaign donation to local candidate",
                    category: "Political Donation",
                    date: "2025-07-20",
                    recipient: "Jane Smith Campaign",
                    status: "completed"
                },
                {
                    id: 2,
                    type: "expense",
                    amount: 75.50,
                    description: "Event ticket for political fundraiser",
                    category: "Event Attendance",
                    date: "2025-07-18",
                    recipient: "Democratic Party Fundraiser",
                    status: "completed"
                },
                {
                    id: 3,
                    type: "donation",
                    amount: 25.00,
                    description: "Monthly contribution to advocacy group",
                    category: "Advocacy Support",
                    date: "2025-07-15",
                    recipient: "Citizens for Democracy",
                    status: "completed"
                },
                {
                    id: 4,
                    type: "expense",
                    amount: 45.00,
                    description: "Political literature and materials",
                    category: "Campaign Materials",
                    date: "2025-07-12",
                    recipient: "Campaign Supply Store",
                    status: "completed"
                }
            ];
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
            // Sample civic ledger data for demonstration
            const civicLedgerData = {
                summary: {
                    totalVotes: 12,
                    totalPetitions: 5,
                    totalActivities: 23,
                    totalPoints: 450
                },
                votes: [
                    {
                        id: 1,
                        itemId: 101,
                        itemType: "bill",
                        voteValue: 1,
                        reasoning: "Supporting this bill as it aligns with democratic values",
                        timestamp: "2024-01-15T10:30:00Z"
                    },
                    {
                        id: 2,
                        itemId: 102,
                        itemType: "bill",
                        voteValue: -1,
                        reasoning: "Opposing this bill due to privacy concerns",
                        timestamp: "2024-01-14T14:20:00Z"
                    }
                ],
                petitions: [
                    {
                        id: 1,
                        petitionId: 201,
                        signedAt: "2024-01-10T09:15:00Z",
                        petition: {
                            title: "Support Electoral Reform",
                            description: "Petition to implement proportional representation",
                            currentSignatures: 15420,
                            targetSignatures: 10000
                        }
                    }
                ],
                activities: [
                    {
                        id: 1,
                        activityType: "vote",
                        entityId: 101,
                        entityType: "bill",
                        pointsEarned: 10,
                        details: { billTitle: "Democratic Reform Act" },
                        createdAt: "2024-01-15T10:30:00Z"
                    }
                ]
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
