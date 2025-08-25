import { Router } from "express";
const router = Router();
// Sample FOI data
const foiRequests = [
    {
        id: 1,
        title: "Government Spending on Infrastructure Projects",
        department: "Infrastructure Canada",
        requestor: "Canadian Taxpayers Federation",
        status: "Completed",
        responseType: "Full Release",
        dateSubmitted: "2024-01-15",
        dateResponded: "2024-03-20",
        summary: "Request for detailed spending breakdown of all infrastructure projects over $10 million in the past fiscal year",
        totalCost: 250,
        pagesReleased: 450,
        pagesWithheld: 23,
        exemptionsUsed: ["Personal Information", "Cabinet Confidence"],
        keyFindings: [
            "Total infrastructure spending exceeded $12 billion",
            "45% of projects were behind schedule",
            "Cost overruns averaged 23% across all projects"
        ],
        publicImpact: 8,
        mediaAttention: "High"
    },
    {
        id: 2,
        title: "COVID-19 Response Funding Allocation",
        department: "Health Canada",
        requestor: "Canadian Press",
        status: "Under Review",
        responseType: "Pending",
        dateSubmitted: "2024-02-01",
        dateResponded: null,
        summary: "Request for detailed breakdown of COVID-19 response funding by province and territory",
        totalCost: null,
        pagesReleased: 0,
        pagesWithheld: 0,
        exemptionsUsed: [],
        keyFindings: [],
        publicImpact: 9,
        mediaAttention: "Very High"
    },
    {
        id: 3,
        title: "Military Procurement Contracts",
        department: "National Defence",
        requestor: "Defence Watch",
        status: "Completed",
        responseType: "Partial Release",
        dateSubmitted: "2023-11-10",
        dateResponded: "2024-01-25",
        summary: "Request for details on military procurement contracts valued over $100 million",
        totalCost: 150,
        pagesReleased: 280,
        pagesWithheld: 145,
        exemptionsUsed: ["National Security", "International Relations"],
        keyFindings: [
            "Total procurement budget exceeded $25 billion",
            "60% of contracts went to Canadian companies",
            "Average delivery time was 18 months behind schedule"
        ],
        publicImpact: 7,
        mediaAttention: "Medium"
    },
    {
        id: 4,
        title: "Environmental Assessment Records",
        department: "Environment and Climate Change Canada",
        requestor: "Greenpeace Canada",
        status: "Rejected",
        responseType: "Rejected",
        dateSubmitted: "2024-01-20",
        dateResponded: "2024-02-15",
        summary: "Request for environmental assessment records related to oil pipeline projects",
        totalCost: 0,
        pagesReleased: 0,
        pagesWithheld: 0,
        exemptionsUsed: ["Cabinet Confidence", "Solicitor-Client Privilege"],
        keyFindings: [],
        publicImpact: 6,
        mediaAttention: "High"
    },
    {
        id: 5,
        title: "Immigration Processing Times",
        department: "Immigration, Refugees and Citizenship Canada",
        requestor: "Canadian Immigration Lawyers Association",
        status: "Overdue",
        responseType: "Pending",
        dateSubmitted: "2023-12-01",
        dateResponded: null,
        summary: "Request for detailed statistics on immigration application processing times by category",
        totalCost: null,
        pagesReleased: 0,
        pagesWithheld: 0,
        exemptionsUsed: [],
        keyFindings: [],
        publicImpact: 8,
        mediaAttention: "Medium"
    }
];
// GET /api/foi/requests - Get all FOI requests
router.get("/requests", async (req, res) => {
    try {
        res.json(foiRequests);
    }
    catch (error) {
        // console.error removed for production
        res.status(500).json({ error: "Failed to fetch FOI requests" });
    }
});
// GET /api/foi/requests/:id - Get specific FOI request
router.get("/requests/:id", async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const request = foiRequests.find(r => r.id === requestId);
        if (!request) {
            return res.status(404).json({ error: "FOI request not found" });
        }
        res.json(request);
    }
    catch (error) {
        // console.error removed for production
        res.status(500).json({ error: "Failed to fetch FOI request" });
    }
});
// POST /api/foi/requests - Submit new FOI request
router.post("/requests", async (req, res) => {
    try {
        const { title, department, summary } = req.body;
        if (!title || !department || !summary) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const newRequest = {
            id: foiRequests.length + 1,
            title,
            department,
            requestor: "Anonymous",
            status: "Under Review",
            responseType: "Pending",
            dateSubmitted: new Date().toISOString().split('T')[0],
            dateResponded: null,
            summary,
            totalCost: null,
            pagesReleased: 0,
            pagesWithheld: 0,
            exemptionsUsed: [],
            keyFindings: [],
            publicImpact: 5,
            mediaAttention: "Low"
        };
        foiRequests.push(newRequest);
        res.status(201).json(newRequest);
    }
    catch (error) {
        // console.error removed for production
        res.status(500).json({ error: "Failed to create FOI request" });
    }
});
// GET /api/foi/analytics - Get FOI analytics
router.get("/analytics", async (req, res) => {
    try {
        const analytics = {
            totalRequests: foiRequests.length,
            completedRequests: foiRequests.filter(r => r.status === "Completed").length,
            pendingRequests: foiRequests.filter(r => r.status === "Under Review").length,
            rejectedRequests: foiRequests.filter(r => r.status === "Rejected").length,
            overdueRequests: foiRequests.filter(r => r.status === "Overdue").length,
            averageResponseTime: 67,
            completionRate: 73,
            exemptionRate: 34
        };
        res.json(analytics);
    }
    catch (error) {
        // console.error removed for production
        res.status(500).json({ error: "Failed to fetch FOI analytics" });
    }
});
export default router;
