import pino from 'pino';
import { db } from '../db.js';
import { politicians, parliamentMembers, billRollcalls, billRollcallRecords } from '../../shared/schema.js';
import { fetchWithTimeoutRetry } from './fetchUtil.js';
import { ingestParliamentMembers } from './parliamentIngestion.js';

const logger = pino({ name: 'politician-ingestion' });

export interface PoliticianData {
  name: string;
  party: string;
  position: string;
  riding: string;
  level: 'federal' | 'provincial' | 'municipal';
  jurisdiction: string;
  image?: string;
  trustScore: number;
  civicLevel: string;
  recentActivity: string;
  policyPositions: string[];
  votingRecord: { yes: number; no: number; abstain: number };
  contactInfo: {
    email?: string;
    phone?: string;
    office?: string;
    website?: string;
    social?: {
      twitter?: string;
      facebook?: string;
    };
  };
  bio: string;
  keyAchievements: string[];
  committees: string[];
  expenses: {
    travel: number;
    hospitality: number;
    office: number;
    total: number;
    year: string;
  };
  isIncumbent: boolean;
  parliamentMemberId?: string;
}

class PoliticianIngestionService {
  private sources = [
    {
      name: 'OpenParliament',
      url: 'https://openparliament.ca',
      type: 'federal'
    },
    {
      name: 'Our Commons',
      url: 'https://ourcommons.ca',
      type: 'federal'
    },
    {
      name: 'Elections Canada',
      url: 'https://www.elections.ca',
      type: 'federal'
    }
  ];

  async ingestAllPoliticians(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      logger.info('Starting comprehensive politician ingestion');

      const results = await Promise.allSettled([
        this.ingestFederalPoliticians(),
        this.ingestProvincialPoliticians(),
        this.ingestMunicipalPoliticians()
      ]);

      const federalResult = results[0].status === 'fulfilled' ? results[0].value : { success: false, message: 'Failed' };
      const provincialResult = results[1].status === 'fulfilled' ? results[1].value : { success: false, message: 'Failed' };
      const municipalResult = results[2].status === 'fulfilled' ? results[2].value : { success: false, message: 'Failed' };

      // Calculate trust scores for all politicians
      await this.calculateTrustScores();

      return {
        success: true,
        message: 'Politician ingestion completed',
        data: {
          federal: federalResult,
          provincial: provincialResult,
          municipal: municipalResult
        }
      };
    } catch (error) {
      logger.error('Politician ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest politicians',
        data: { error: (error as any)?.message }
      };
    }
  }

  async ingestFederalPoliticians(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      logger.info('Ingesting federal politicians');

      // Use the existing parliament ingestion
      const parliamentResult = await ingestParliamentMembers();
      
      // Create comprehensive politician records
      const federalPoliticians = await this.createFederalPoliticianRecords();
      
      return {
        success: true,
        message: `${federalPoliticians.length} federal politicians processed`,
        data: { politicians: federalPoliticians.length }
      };
    } catch (error) {
      logger.error('Federal politician ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest federal politicians',
        data: { error: (error as any)?.message }
      };
    }
  }

  async ingestProvincialPoliticians(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      logger.info('Ingesting provincial politicians');

      // Create sample provincial politicians for now
      const provincialPoliticians = await this.createProvincialPoliticianRecords();
      
      return {
        success: true,
        message: `${provincialPoliticians.length} provincial politicians processed`,
        data: { politicians: provincialPoliticians.length }
      };
    } catch (error) {
      logger.error('Provincial politician ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest provincial politicians',
        data: { error: (error as any)?.message }
      };
    }
  }

  async ingestMunicipalPoliticians(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      logger.info('Ingesting municipal politicians');

      // Create sample municipal politicians for now
      const municipalPoliticians = await this.createMunicipalPoliticianRecords();
      
      return {
        success: true,
        message: `${municipalPoliticians.length} municipal politicians processed`,
        data: { politicians: municipalPoliticians.length }
      };
    } catch (error) {
      logger.error('Municipal politician ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest municipal politicians',
        data: { error: (error as any)?.message }
      };
    }
  }

  private async createFederalPoliticianRecords(): Promise<any[]> {
    try {
      // Get parliament members from the database
      const members = await db.select().from(parliamentMembers);
      
      const federalPoliticians = members.map(member => ({
        name: member.name,
        party: member.party || 'Independent',
        position: member.position || 'Member of Parliament',
        riding: member.constituency || 'Unknown',
        level: 'federal' as const,
        jurisdiction: 'Canada',
        image: member.imageUrl,
        trustScore: 75, // Default trust score
        civicLevel: 'Federal Representative',
        recentActivity: 'Active in Parliament',
        policyPositions: ['Democracy', 'Transparency', 'Public Service'],
        votingRecord: { yes: 0, no: 0, abstain: 0 }, // Will be calculated from roll-calls
        contactInfo: {
          email: member.email,
          office: member.officeAddress,
          website: member.website
        },
        bio: member.bio || 'Member of Parliament representing constituents.',
        keyAchievements: ['Elected to Parliament', 'Serving constituents'],
        committees: member.committees || [],
        expenses: {
          travel: 0,
          hospitality: 0,
          office: 0,
          total: 0,
          year: new Date().getFullYear().toString()
        },
        isIncumbent: true,
        parliamentMemberId: member.id
      }));

      // Upsert federal politicians
      for (const politician of federalPoliticians) {
        await this.upsertPolitician(politician);
      }

      return federalPoliticians;
    } catch (error) {
      logger.error('Failed to create federal politician records:', error);
      throw error;
    }
  }

  private async createProvincialPoliticianRecords(): Promise<any[]> {
    try {
      const provincialPoliticians = [
        {
          name: 'Doug Ford',
          party: 'Progressive Conservative',
          position: 'Premier',
          riding: 'Etobicoke North',
          level: 'provincial' as const,
          jurisdiction: 'Ontario',
          image: undefined,
          trustScore: 70,
          civicLevel: 'Provincial Premier',
          recentActivity: 'Leading Ontario government',
          policyPositions: ['Economic Development', 'Infrastructure', 'Healthcare'],
          votingRecord: { yes: 0, no: 0, abstain: 0 },
          contactInfo: {
            email: 'premier@ontario.ca',
            office: 'Queen\'s Park, Toronto',
            website: 'https://www.ontario.ca/premier'
          },
          bio: 'Premier of Ontario since 2018, leading the Progressive Conservative government.',
          keyAchievements: ['Premier of Ontario', 'Mayor of Toronto'],
          committees: ['Cabinet', 'Executive Council'],
          expenses: {
            travel: 15000,
            hospitality: 5000,
            office: 25000,
            total: 45000,
            year: new Date().getFullYear().toString()
          },
          isIncumbent: true
        },
        {
          name: 'David Eby',
          party: 'New Democratic',
          position: 'Premier',
          riding: 'Vancouver-Point Grey',
          level: 'provincial' as const,
          jurisdiction: 'British Columbia',
          image: undefined,
          trustScore: 75,
          civicLevel: 'Provincial Premier',
          recentActivity: 'Leading BC government',
          policyPositions: ['Housing', 'Climate Action', 'Healthcare'],
          votingRecord: { yes: 0, no: 0, abstain: 0 },
          contactInfo: {
            email: 'premier@gov.bc.ca',
            office: 'Parliament Buildings, Victoria',
            website: 'https://www2.gov.bc.ca/gov/content/governments/organizational-structure/premier'
          },
          bio: 'Premier of British Columbia since 2022, leading the NDP government.',
          keyAchievements: ['Premier of BC', 'Attorney General'],
          committees: ['Cabinet', 'Executive Council'],
          expenses: {
            travel: 12000,
            hospitality: 4000,
            office: 22000,
            total: 38000,
            year: new Date().getFullYear().toString()
          },
          isIncumbent: true
        }
      ];

      // Upsert provincial politicians
      for (const politician of provincialPoliticians) {
        await this.upsertPolitician(politician);
      }

      return provincialPoliticians;
    } catch (error) {
      logger.error('Failed to create provincial politician records:', error);
      throw error;
    }
  }

  private async createMunicipalPoliticianRecords(): Promise<any[]> {
    try {
      const municipalPoliticians = [
        {
          name: 'Olivia Chow',
          party: 'Independent',
          position: 'Mayor',
          riding: 'Toronto',
          level: 'municipal' as const,
          jurisdiction: 'Toronto, Ontario',
          image: undefined,
          trustScore: 80,
          civicLevel: 'Municipal Mayor',
          recentActivity: 'Leading Toronto city government',
          policyPositions: ['Transit', 'Housing', 'Community Safety'],
          votingRecord: { yes: 0, no: 0, abstain: 0 },
          contactInfo: {
            email: 'mayor@toronto.ca',
            office: 'Toronto City Hall',
            website: 'https://www.toronto.ca/mayor'
          },
          bio: 'Mayor of Toronto since 2023, former Member of Parliament and city councillor.',
          keyAchievements: ['Mayor of Toronto', 'MP for Trinity-Spadina'],
          committees: ['Executive Committee', 'City Council'],
          expenses: {
            travel: 8000,
            hospitality: 3000,
            office: 18000,
            total: 29000,
            year: new Date().getFullYear().toString()
          },
          isIncumbent: true
        },
        {
          name: 'Ken Sim',
          party: 'ABC Vancouver',
          position: 'Mayor',
          riding: 'Vancouver',
          level: 'municipal' as const,
          jurisdiction: 'Vancouver, British Columbia',
          image: undefined,
          trustScore: 75,
          civicLevel: 'Municipal Mayor',
          recentActivity: 'Leading Vancouver city government',
          policyPositions: ['Public Safety', 'Housing', 'Economic Development'],
          votingRecord: { yes: 0, no: 0, abstain: 0 },
          contactInfo: {
            email: 'mayor@vancouver.ca',
            office: 'Vancouver City Hall',
            website: 'https://vancouver.ca/your-government/mayor-and-council'
          },
          bio: 'Mayor of Vancouver since 2022, leading the ABC Vancouver party.',
          keyAchievements: ['Mayor of Vancouver', 'Business leader'],
          committees: ['Council', 'Executive Committee'],
          expenses: {
            travel: 7000,
            hospitality: 2500,
            office: 16000,
            total: 25500,
            year: new Date().getFullYear().toString()
          },
          isIncumbent: true
        }
      ];

      // Upsert municipal politicians
      for (const politician of municipalPoliticians) {
        await this.upsertPolitician(politician);
      }

      return municipalPoliticians;
    } catch (error) {
      logger.error('Failed to create municipal politician records:', error);
      throw error;
    }
  }

  private async upsertPolitician(politicianData: PoliticianData): Promise<void> {
    try {
      // Check if politician already exists
      const existingPolitician = await db
        .select()
        .from(politicians)
        .where(
          db.and(
            db.eq(politicians.name, politicianData.name),
            db.eq(politicians.level, politicianData.level),
            db.eq(politicians.jurisdiction, politicianData.jurisdiction)
          )
        )
        .limit(1);

      if (existingPolitician.length > 0) {
        // Update existing politician
        await db
          .update(politicians)
          .set({
            party: politicianData.party,
            position: politicianData.position,
            riding: politicianData.riding,
            trustScore: politicianData.trustScore,
            civicLevel: politicianData.civicLevel,
            recentActivity: politicianData.recentActivity,
            policyPositions: politicianData.policyPositions,
            votingRecord: politicianData.votingRecord,
            contactInfo: politicianData.contactInfo,
            bio: politicianData.bio,
            keyAchievements: politicianData.keyAchievements,
            committees: politicianData.committees,
            expenses: politicianData.expenses,
            isIncumbent: politicianData.isIncumbent,
            parliamentMemberId: politicianData.parliamentMemberId,
            updatedAt: new Date()
          })
          .where(db.eq(politicians.id, existingPolitician[0].id));
      } else {
        // Insert new politician
        await db.insert(politicians).values({
          name: politicianData.name,
          party: politicianData.party,
          position: politicianData.position,
          riding: politicianData.riding,
          level: politicianData.level,
          jurisdiction: politicianData.jurisdiction,
          image: politicianData.image,
          trustScore: politicianData.trustScore,
          civicLevel: politicianData.civicLevel,
          recentActivity: politicianData.recentActivity,
          policyPositions: politicianData.policyPositions,
          votingRecord: politicianData.votingRecord,
          contactInfo: politicianData.contactInfo,
          bio: politicianData.bio,
          keyAchievements: politicianData.keyAchievements,
          committees: politicianData.committees,
          expenses: politicianData.expenses,
          isIncumbent: politicianData.isIncumbent,
          parliamentMemberId: politicianData.parliamentMemberId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      logger.error('Failed to upsert politician:', error);
      throw error;
    }
  }

  private async calculateTrustScores(): Promise<void> {
    try {
      logger.info('Calculating trust scores for politicians');

      // Get all politicians
      const allPoliticians = await db.select().from(politicians);
      
      for (const politician of allPoliticians) {
        let trustScore = 50; // Base score

        // Factor 1: Incumbency (higher score for incumbents)
        if (politician.isIncumbent) {
          trustScore += 10;
        }

        // Factor 2: Voting record (if available)
        if (politician.votingRecord) {
          const totalVotes = politician.votingRecord.yes + politician.votingRecord.no + politician.votingRecord.abstain;
          if (totalVotes > 0) {
            const participationRate = totalVotes / 100; // Assuming 100 votes is full participation
            trustScore += Math.round(participationRate * 10);
          }
        }

        // Factor 3: Expense management (lower expenses = higher trust)
        if (politician.expenses && politician.expenses.total > 0) {
          const expenseScore = Math.max(0, 20 - Math.floor(politician.expenses.total / 1000));
          trustScore += expenseScore;
        }

        // Factor 4: Committee participation
        if (politician.committees && politician.committees.length > 0) {
          trustScore += Math.min(10, politician.committees.length * 2);
        }

        // Factor 5: Recent activity
        if (politician.recentActivity && politician.recentActivity.toLowerCase().includes('active')) {
          trustScore += 5;
        }

        // Ensure score is between 0 and 100
        trustScore = Math.max(0, Math.min(100, trustScore));

        // Update politician with new trust score
        await db
          .update(politicians)
          .set({ trustScore, updatedAt: new Date() })
          .where(db.eq(politicians.id, politician.id));
      }

      logger.info('Trust scores calculated and updated');
    } catch (error) {
      logger.error('Failed to calculate trust scores:', error);
      throw error;
    }
  }

  async getPoliticiansByLocation(location?: string): Promise<any[]> {
    try {
      let query = db.select().from(politicians);
      
      if (location) {
        const locationLower = location.toLowerCase();
        query = query.where(
          db.or(
            db.ilike(politicians.jurisdiction, `%${locationLower}%`),
            db.ilike(politicians.riding, `%${locationLower}%`),
            db.ilike(politicians.name, `%${locationLower}%`)
          )
        );
      }

      const politicians = await query.orderBy(politicians.trustScore);
      return politicians;
    } catch (error) {
      logger.error('Failed to get politicians by location:', error);
      return [];
    }
  }

  async getPoliticianById(id: string): Promise<any | null> {
    try {
      const [politician] = await db
        .select()
        .from(politicians)
        .where(db.eq(politicians.id, parseInt(id)))
        .limit(1);

      return politician || null;
    } catch (error) {
      logger.error('Failed to get politician by ID:', error);
      return null;
    }
  }
}

export const politicianIngestionService = new PoliticianIngestionService();
