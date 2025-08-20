import { Express, Request, Response } from "express";
import { ResponseFormatter } from "../utils/responseFormatter.js";
import { fetchWithTimeoutRetry } from '../utils/fetchUtil.js';
import { nextFederalElectionDate, nextMunicipalElectionDate } from "../utils/electionRules.js";
import { electionIngestionService } from "../utils/electionIngestion.js";

export function registerElectionsRoutes(app: Express) {
  // Get comprehensive election data with location filtering
  app.get('/api/elections', async (req: Request, res: Response) => {
    try {
      const location = req.query.location as string;
      const electionData = await electionIngestionService.getElectionsByLocation(location);
      
      res.json({
        success: true,
        ...electionData
      });
    } catch (error) {
      console.error('Failed to fetch elections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch election data',
        error: (error as any)?.message
      });
    }
  });

  // Get elections by type (federal, provincial, municipal)
  app.get('/api/elections/:type', async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const location = req.query.location as string;
      
      if (!['federal', 'provincial', 'municipal'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid election type. Must be federal, provincial, or municipal.'
        });
      }

      const electionData = await electionIngestionService.getElectionsByLocation(location);
      
      // Filter by type
      const filteredData = {
        upcoming: electionData.upcoming.filter((e: any) => e.type === type),
        recent: electionData.recent.filter((e: any) => e.type === type),
        lastUpdated: electionData.lastUpdated,
        sources: electionData.sources
      };

      res.json({
        success: true,
        type,
        ...filteredData
      });
    } catch (error) {
      console.error('Failed to fetch elections by type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch election data by type',
        error: (error as any)?.message
      });
    }
  });

  // Get specific election details
  app.get('/api/elections/detail/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // This would fetch detailed election information
      // For now, return a placeholder
      res.json({
        success: true,
        message: 'Election detail endpoint - implementation pending',
        electionId: id
      });
    } catch (error) {
      console.error('Failed to fetch election details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch election details',
        error: (error as any)?.message
      });
    }
  });

  // Get election statistics
  app.get('/api/elections/stats', async (req: Request, res: Response) => {
    try {
      const electionData = await electionIngestionService.getElectionsByLocation();
      
      const stats = {
        totalElections: electionData.upcoming.length + electionData.recent.length,
        upcomingElections: electionData.upcoming.length,
        completedElections: electionData.recent.length,
        byType: {
          federal: electionData.upcoming.filter((e: any) => e.type === 'federal').length + 
                  electionData.recent.filter((e: any) => e.type === 'federal').length,
          provincial: electionData.upcoming.filter((e: any) => e.type === 'provincial').length + 
                     electionData.recent.filter((e: any) => e.type === 'provincial').length,
          municipal: electionData.upcoming.filter((e: any) => e.type === 'municipal').length + 
                    electionData.recent.filter((e: any) => e.type === 'municipal').length
        },
        lastUpdated: electionData.lastUpdated
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Failed to fetch election stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch election statistics',
        error: (error as any)?.message
      });
    }
  });

  // Search elections by location or keyword
  app.get('/api/elections/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const electionData = await electionIngestionService.getElectionsByLocation(query);
      
      res.json({
        success: true,
        query,
        results: electionData
      });
    } catch (error) {
      console.error('Failed to search elections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search elections',
        error: (error as any)?.message
      });
    }
  });

  // Get upcoming elections countdown
  app.get('/api/elections/countdown', async (req: Request, res: Response) => {
    try {
      const electionData = await electionIngestionService.getElectionsByLocation();
      
      const countdowns = electionData.upcoming.map((election: any) => {
        const electionDate = new Date(election.electionDate);
        const now = new Date();
        const diffTime = electionDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          id: election.id,
          title: election.title,
          type: election.type,
          jurisdiction: election.jurisdiction,
          electionDate: election.electionDate,
          daysRemaining: diffDays,
          status: diffDays < 0 ? 'passed' : diffDays === 0 ? 'today' : 'upcoming'
        };
      });

      res.json({
        success: true,
        countdowns: countdowns.sort((a: any, b: any) => a.daysRemaining - b.daysRemaining)
      });
    } catch (error) {
      console.error('Failed to fetch election countdowns:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch election countdowns',
        error: (error as any)?.message
      });
    }
  });
} 