import { ResponseFormatter } from "../utils/responseFormatter.js";
import { comprehensiveDataService } from "../utils/comprehensiveDataService.js";
export function registerApiRoutes(app) {
    // Comprehensive politicians endpoint (using our data service)
    app.get('/api/politicians/comprehensive', async (req, res) => {
        try {
            const { party, level, riding } = req.query;
            const filters = {};
            if (party && party !== 'all')
                filters.party = party;
            if (level && level !== 'all')
                filters.level = level;
            if (riding)
                filters.riding = riding;
            const politicians = comprehensiveDataService.getPoliticians(filters);
            return ResponseFormatter.success(res, politicians, "Politicians retrieved successfully", 200, politicians.length);
        }
        catch (error) {
            console.error('Politicians API error:', error);
            return ResponseFormatter.databaseError(res, `Failed to fetch politicians: ${error.message}`);
        }
    });
    // Get single politician by ID
    app.get('/api/politicians/:id', async (req, res) => {
        try {
            const politicianId = parseInt(req.params.id);
            if (isNaN(politicianId)) {
                return ResponseFormatter.badRequest(res, "Invalid politician ID");
            }
            const politician = comprehensiveDataService.getPoliticianById(politicianId);
            if (!politician) {
                return ResponseFormatter.notFound(res, "Politician not found");
            }
            return ResponseFormatter.success(res, politician, "Politician retrieved successfully");
        }
        catch (error) {
            console.error('Politician detail API error:', error);
            return ResponseFormatter.databaseError(res, `Failed to fetch politician: ${error.message}`);
        }
    });
    // Bills endpoint using comprehensive data service
    app.get('/api/bills/comprehensive', async (req, res) => {
        try {
            const { status, sponsor } = req.query;
            const filters = {};
            if (status && status !== 'all')
                filters.status = status;
            if (sponsor)
                filters.sponsor = sponsor;
            const bills = comprehensiveDataService.getBills(filters);
            return ResponseFormatter.success(res, bills, "Bills retrieved successfully", 200, bills.length);
        }
        catch (error) {
            console.error('Bills API error:', error);
            return ResponseFormatter.databaseError(res, `Failed to fetch bills: ${error.message}`);
        }
    });
    // Economic data endpoint
    app.get('/api/economic/comprehensive', async (req, res) => {
        try {
            const economicData = comprehensiveDataService.getEconomicData();
            return ResponseFormatter.success(res, economicData, "Economic data retrieved successfully");
        }
        catch (error) {
            console.error('Economic data API error:', error);
            return ResponseFormatter.databaseError(res, `Failed to fetch economic data: ${error.message}`);
        }
    });
    // News endpoint using comprehensive data service
    app.get('/api/news/comprehensive', async (req, res) => {
        try {
            const { category, limit } = req.query;
            const filters = {};
            if (category && category !== 'all')
                filters.category = category;
            if (limit)
                filters.limit = parseInt(limit);
            const news = comprehensiveDataService.getNews(filters);
            return ResponseFormatter.success(res, news, "News retrieved successfully", 200, news.length);
        }
        catch (error) {
            console.error('News API error:', error);
            return ResponseFormatter.databaseError(res, `Failed to fetch news: ${error.message}`);
        }
    });
    // Financial data endpoint
    app.get('/api/finance/comprehensive', async (req, res) => {
        try {
            const financialData = comprehensiveDataService.getFinancialData();
            return ResponseFormatter.success(res, financialData, "Financial data retrieved successfully");
        }
        catch (error) {
            console.error('Financial data API error:', error);
            return ResponseFormatter.databaseError(res, `Failed to fetch financial data: ${error.message}`);
        }
    });
    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            service: 'CivicOS API',
            features: {
                mockAI: true,
                ollama: false,
                comprehensiveData: true
            }
        });
    });
}
