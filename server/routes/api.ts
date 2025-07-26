import { Express, Request, Response } from "express";
import { ResponseFormatter } from "../utils/responseFormatter.js";
import { comprehensiveDataService } from "../utils/comprehensiveDataService.js";

export function registerApiRoutes(app: Express) {
  // Comprehensive politicians endpoint (using our data service)
  app.get('/api/politicians/comprehensive', async (req: Request, res: Response) => {
    try {
      const { party, level, riding } = req.query;
      
      const filters: any = {};
      if (party && party !== 'all') filters.party = party as string;
      if (level && level !== 'all') filters.level = level as string;
      if (riding) filters.riding = riding as string;
      
      const politicians = comprehensiveDataService.getPoliticians(filters);
      
      return ResponseFormatter.success(
        res,
        politicians,
        "Politicians retrieved successfully",
        200,
        politicians.length
      );
    } catch (error) {
      // console.error removed for production
      return ResponseFormatter.databaseError(res, `Failed to fetch politicians: ${(error as Error).message}`);
    }
  });

  // Get single politician by ID
  app.get('/api/politicians/:id', async (req: Request, res: Response) => {
    try {
      const politicianId = parseInt(req.params.id);
      if (isNaN(politicianId)) {
        return ResponseFormatter.badRequest(res, "Invalid politician ID");
      }
      
      const politician = comprehensiveDataService.getPoliticianById(politicianId);
      
      if (!politician) {
        return ResponseFormatter.notFound(res, "Politician not found");
      }
      
      return ResponseFormatter.success(
        res,
        politician,
        "Politician retrieved successfully"
      );
    } catch (error) {
      // console.error removed for production
      return ResponseFormatter.databaseError(res, `Failed to fetch politician: ${(error as Error).message}`);
    }
  });

  // Bills endpoint using comprehensive data service
  app.get('/api/bills/comprehensive', async (req: Request, res: Response) => {
    try {
      const { status, sponsor } = req.query;
      
      const filters: any = {};
      if (status && status !== 'all') filters.status = status as string;
      if (sponsor) filters.sponsor = sponsor as string;
      
      const bills = comprehensiveDataService.getBills(filters);
      
      return ResponseFormatter.success(
        res,
        bills,
        "Bills retrieved successfully",
        200,
        bills.length
      );
    } catch (error) {
      // console.error removed for production
      return ResponseFormatter.databaseError(res, `Failed to fetch bills: ${(error as Error).message}`);
    }
  });

  // Economic data endpoint
  app.get('/api/economic/comprehensive', async (req: Request, res: Response) => {
    try {
      const economicData = comprehensiveDataService.getEconomicData();
      
      return ResponseFormatter.success(
        res,
        economicData,
        "Economic data retrieved successfully"
      );
    } catch (error) {
      // console.error removed for production
      return ResponseFormatter.databaseError(res, `Failed to fetch economic data: ${(error as Error).message}`);
    }
  });

  // News endpoint using comprehensive data service
  app.get('/api/news/comprehensive', async (req: Request, res: Response) => {
    try {
      const { category, limit } = req.query;
      
      const filters: any = {};
      if (category && category !== 'all') filters.category = category as string;
      if (limit) filters.limit = parseInt(limit as string);
      
      const news = comprehensiveDataService.getNews(filters);
      
      return ResponseFormatter.success(
        res,
        news,
        "News retrieved successfully",
        200,
        news.length
      );
    } catch (error) {
      // console.error removed for production
      return ResponseFormatter.databaseError(res, `Failed to fetch news: ${(error as Error).message}`);
    }
  });

  // Financial data endpoint
  app.get('/api/finance/comprehensive', async (req: Request, res: Response) => {
    try {
      const financialData = comprehensiveDataService.getFinancialData();
      
      return ResponseFormatter.success(
        res,
        financialData,
        "Financial data retrieved successfully"
      );
    } catch (error) {
      // console.error removed for production
      return ResponseFormatter.databaseError(res, `Failed to fetch financial data: ${(error as Error).message}`);
    }
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
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