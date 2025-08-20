import pino from 'pino';
import { db } from '../db.js';
import { politicians, bills, elections, legalActs, legalCases, procurementContracts, lobbyistOrgs, newsArticles, petitions } from '../../shared/schema.js';
import { ingestParliamentMembers, ingestBillRollcallsForCurrentSession } from './parliamentIngestion.js';
import { ingestProcurementFromCKAN } from './procurementIngestion.js';
import { ingestLobbyistsFromCKAN } from './lobbyistsIngestion.js';
import { ingestFederalActsFromJustice, ingestCriminalCodeFromJustice } from './legalIngestion.js';
import { ingestProvincialIncumbents, ingestMunicipalIncumbents } from './provincialMunicipalIngestion.js';
import { ingestNewsFeeds } from './newsIngestion.js';
import { billIngestionService } from './billIngestion.js';
import { politicianIngestionService } from './politicianIngestion.js';
import { electionIngestionService } from './electionIngestion.js';

const logger = pino({ name: 'comprehensive-data-ingestion' });

export interface IngestionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
  timestamp: string;
}

export interface IngestionStatus {
  politicians: IngestionResult;
  bills: IngestionResult;
  elections: IngestionResult;
  legal: IngestionResult;
  procurement: IngestionResult;
  lobbyists: IngestionResult;
  news: IngestionResult;
  petitions: IngestionResult;
}

class ComprehensiveDataIngestion {
  private isRunning: boolean = false;

  async runFullIngestion(): Promise<IngestionStatus> {
    if (this.isRunning) {
      throw new Error('Ingestion already in progress');
    }

    this.isRunning = true;
    const startTime = Date.now();
    logger.info('Starting comprehensive data ingestion');

    try {
      const results = await Promise.allSettled([
        this.ingestPoliticians(),
        this.ingestBills(),
        this.ingestElections(),
        this.ingestLegal(),
        this.ingestProcurement(),
        this.ingestLobbyists(),
        this.ingestNews(),
        this.ingestPetitions()
      ]);

      const status: IngestionStatus = {
        politicians: this.processResult(results[0], 'Politicians'),
        bills: this.processResult(results[1], 'Bills'),
        elections: this.processResult(results[2], 'Elections'),
        legal: this.processResult(results[3], 'Legal'),
        procurement: this.processResult(results[4], 'Procurement'),
        lobbyists: this.processResult(results[5], 'Lobbyists'),
        news: this.processResult(results[6], 'News'),
        petitions: this.processResult(results[7], 'Petitions')
      };

      const duration = Date.now() - startTime;
      logger.info(`Comprehensive ingestion completed in ${duration}ms`, status);

      return status;
    } finally {
      this.isRunning = false;
    }
  }

  private processResult(result: PromiseSettledResult<IngestionResult>, name: string): IngestionResult {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        message: `Failed to ingest ${name}`,
        error: result.reason,
        timestamp: new Date().toISOString()
      };
    }
  }

  async ingestPoliticians(): Promise<IngestionResult> {
    try {
      logger.info('Starting politician ingestion');
      
      const result = await politicianIngestionService.ingestAllPoliticians();
      
      return {
        success: result.success,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Politician ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest politicians',
        error: error,
        timestamp: new Date().toISOString()
      };
    }
  }

  async ingestBills(): Promise<IngestionResult> {
    try {
      logger.info('Starting bill ingestion');
      
      const result = await billIngestionService.ingestAllBills();
      
      return {
        success: result.success,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Bill ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest bills',
        error: error,
        timestamp: new Date().toISOString()
      };
    }
  }

  async ingestElections(): Promise<IngestionResult> {
    try {
      logger.info('Starting election ingestion');
      
      const result = await electionIngestionService.ingestAllElections();
      
      return {
        success: result.success,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Election ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest elections',
        error: error,
        timestamp: new Date().toISOString()
      };
    }
  }

  async ingestLegal(): Promise<IngestionResult> {
    try {
      logger.info('Starting legal ingestion');
      
      // 1. Federal Acts from Justice Laws
      const federalActsResult = await ingestFederalActsFromJustice();
      
      // 2. Criminal Code sections
      const criminalCodeResult = await ingestCriminalCodeFromJustice();
      
      // 3. Additional legal sources
      const additionalLegalResult = await this.ingestAdditionalLegalSources();

      return {
        success: true,
        message: 'Legal ingestion completed successfully',
        data: {
          federalActs: federalActsResult,
          criminalCode: criminalCodeResult,
          additional: additionalLegalResult
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Legal ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest legal data',
        error: error,
        timestamp: new Date().toISOString()
      };
    }
  }

  async ingestProcurement(): Promise<IngestionResult> {
    try {
      logger.info('Starting procurement ingestion');
      
      const result = await ingestProcurementFromCKAN();
      
      return {
        success: true,
        message: 'Procurement ingestion completed successfully',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Procurement ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest procurement data',
        error: error,
        timestamp: new Date().toISOString()
      };
    }
  }

  async ingestLobbyists(): Promise<IngestionResult> {
    try {
      logger.info('Starting lobbyist ingestion');
      
      const result = await ingestLobbyistsFromCKAN();
      
      return {
        success: true,
        message: 'Lobbyist ingestion completed successfully',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Lobbyist ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest lobbyist data',
        error: error,
        timestamp: new Date().toISOString()
      };
    }
  }

  async ingestNews(): Promise<IngestionResult> {
    try {
      logger.info('Starting news ingestion');
      
      const result = await ingestNewsFeeds();
      
      return {
        success: true,
        message: 'News ingestion completed successfully',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('News ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest news',
        error: error,
        timestamp: new Date().toISOString()
      };
    }
  }

  async ingestPetitions(): Promise<IngestionResult> {
    try {
      logger.info('Starting petition ingestion');
      
      // Create sample petitions if none exist
      const existingPetitions = await db.select().from(petitions).limit(1);
      
      if (existingPetitions.length === 0) {
        await this.createSamplePetitions();
      }

      return {
        success: true,
        message: 'Petition ingestion completed successfully',
        data: { created: existingPetitions.length === 0 ? 'sample_petitions' : 'existing_petitions' },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Petition ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest petitions',
        error: error,
        timestamp: new Date().toISOString()
      };
    }
  }



  private async createSamplePetitions(): Promise<void> {
    try {
      const samplePetitions = [
        {
          title: 'Improve Public Transit Infrastructure',
          description: 'Petition to increase funding for public transit infrastructure across major Canadian cities to reduce carbon emissions and improve accessibility.',
          category: 'infrastructure',
          targetSignatures: 10000,
          currentSignatures: 0,
          status: 'active',
          creatorId: 'system',
          jurisdiction: 'federal',
          tags: ['transportation', 'environment', 'infrastructure'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Strengthen Whistleblower Protections',
          description: 'Petition to enhance legal protections for whistleblowers in government and private sector to encourage reporting of wrongdoing.',
          category: 'governance',
          targetSignatures: 15000,
          currentSignatures: 0,
          status: 'active',
          creatorId: 'system',
          jurisdiction: 'federal',
          tags: ['governance', 'transparency', 'whistleblower'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Increase Funding for Mental Health Services',
          description: 'Petition to allocate more federal funding for mental health services and make them more accessible to all Canadians.',
          category: 'healthcare',
          targetSignatures: 20000,
          currentSignatures: 0,
          status: 'active',
          creatorId: 'system',
          jurisdiction: 'federal',
          tags: ['healthcare', 'mental-health', 'funding'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.insert(petitions).values(samplePetitions);
      logger.info('Sample petitions created');
    } catch (error) {
      logger.error('Failed to create sample petitions:', error);
      throw error;
    }
  }

  async getIngestionStatus(): Promise<IngestionStatus> {
    try {
      const [politiciansCount] = await db.select({ count: db.fn.count() }).from(politicians);
      const [billsCount] = await db.select({ count: db.fn.count() }).from(bills);
      const [electionsCount] = await db.select({ count: db.fn.count() }).from(elections);
      const [legalActsCount] = await db.select({ count: db.fn.count() }).from(legalActs);
      const [procurementCount] = await db.select({ count: db.fn.count() }).from(procurementContracts);
      const [lobbyistsCount] = await db.select({ count: db.fn.count() }).from(lobbyistOrgs);
      const [newsCount] = await db.select({ count: db.fn.count() }).from(newsArticles);
      const [petitionsCount] = await db.select({ count: db.fn.count() }).from(petitions);

      return {
        politicians: { success: true, message: `${politiciansCount.count} politicians`, timestamp: new Date().toISOString() },
        bills: { success: true, message: `${billsCount.count} bills`, timestamp: new Date().toISOString() },
        elections: { success: true, message: `${electionsCount.count} elections`, timestamp: new Date().toISOString() },
        legal: { success: true, message: `${legalActsCount.count} legal acts`, timestamp: new Date().toISOString() },
        procurement: { success: true, message: `${procurementCount.count} procurement contracts`, timestamp: new Date().toISOString() },
        lobbyists: { success: true, message: `${lobbyistsCount.count} lobbyist organizations`, timestamp: new Date().toISOString() },
        news: { success: true, message: `${newsCount.count} news articles`, timestamp: new Date().toISOString() },
        petitions: { success: true, message: `${petitionsCount.count} petitions`, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      logger.error('Failed to get ingestion status:', error);
      throw error;
    }
  }
}

export const comprehensiveDataIngestion = new ComprehensiveDataIngestion();
