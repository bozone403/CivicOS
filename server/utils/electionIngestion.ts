import pino from 'pino';
import { db } from '../db.js';
import { elections } from '../../shared/schema.js';
import { eq, and, or, ilike, count, desc, asc } from 'drizzle-orm';
import { fetchWithTimeoutRetry } from './fetchUtil.js';

const logger = pino({ name: 'election-ingestion' });

export interface ElectionSource {
  name: string;
  url: string;
  type: 'federal' | 'provincial' | 'municipal';
  jurisdiction: string;
}

export interface ElectionData {
  type: 'federal' | 'provincial' | 'municipal';
  jurisdiction: string;
  title: string;
  date: string;
  status: 'upcoming' | 'completed';
  description: string;
  source: string;
  sourceUrl: string;
  registrationDeadline: string;
  advanceVotingDates: string[];
}

class ElectionIngestionService {
  private sources: ElectionSource[] = [
    // Federal sources
    {
      name: 'Elections Canada',
      url: 'https://www.elections.ca',
      type: 'federal',
      jurisdiction: 'Canada'
    },
    // Provincial sources
    {
      name: 'Elections Ontario',
      url: 'https://www.elections.on.ca',
      type: 'provincial',
      jurisdiction: 'Ontario'
    },
    {
      name: 'Elections BC',
      url: 'https://elections.bc.ca',
      type: 'provincial',
      jurisdiction: 'British Columbia'
    },
    {
      name: 'Elections Alberta',
      url: 'https://www.elections.ab.ca',
      type: 'provincial',
      jurisdiction: 'Alberta'
    },
    {
      name: 'Élections Québec',
      url: 'https://www.electionsquebec.qc.ca',
      type: 'provincial',
      jurisdiction: 'Quebec'
    },
    // Municipal sources
    {
      name: 'Toronto Elections',
      url: 'https://www.toronto.ca/city-government/elections',
      type: 'municipal',
      jurisdiction: 'Toronto, Ontario'
    },
    {
      name: 'Vancouver Elections',
      url: 'https://vancouver.ca/your-government/elections',
      type: 'municipal',
      jurisdiction: 'Vancouver, British Columbia'
    },
    {
      name: 'Montreal Elections',
      url: 'https://montreal.ca/en/elections',
      type: 'municipal',
      jurisdiction: 'Montreal, Quebec'
    }
  ];

  async ingestAllElections(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      logger.info('Starting comprehensive election ingestion');

      const results = await Promise.allSettled([
        this.ingestFederalElections(),
        this.ingestProvincialElections(),
        this.ingestMunicipalElections()
      ]);

      const federalResult = results[0].status === 'fulfilled' ? results[0].value : { success: false, message: 'Failed' };
      const provincialResult = results[1].status === 'fulfilled' ? results[1].value : { success: false, message: 'Failed' };
      const municipalResult = results[2].status === 'fulfilled' ? results[2].value : { success: false, message: 'Failed' };

      // Create sample elections if none exist
      await this.createSampleElectionsIfNeeded();

      return {
        success: true,
        message: 'Election ingestion completed',
        data: {
          federal: federalResult,
          provincial: provincialResult,
          municipal: municipalResult
        }
      };
    } catch (error) {
      logger.error('Election ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest elections',
        data: { error: (error as any)?.message }
      };
    }
  }

  async ingestFederalElections(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      logger.info('Ingesting federal elections');

      const federalElections = this.getFederalElections();

      // Insert or update federal elections
      for (const election of federalElections) {
        await this.upsertElection(election);
      }

      return {
        success: true,
        message: `${federalElections.length} federal elections processed`,
        data: { elections: federalElections.length }
      };
    } catch (error) {
      logger.error('Federal election ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest federal elections',
        data: { error: (error as any)?.message }
      };
    }
  }

  async ingestProvincialElections(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      logger.info('Ingesting provincial elections');

      const provincialElections = this.getProvincialElections();

      // Insert or update provincial elections
      for (const election of provincialElections) {
        await this.upsertElection(election);
      }

      return {
        success: true,
        message: `${provincialElections.length} provincial elections processed`,
        data: { elections: provincialElections.length }
      };
    } catch (error) {
      logger.error('Provincial election ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest provincial elections',
        data: { error: (error as any)?.message }
      };
    }
  }

  async ingestMunicipalElections(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      logger.info('Ingesting municipal elections');

      const municipalElections = this.getMunicipalElections();

      // Insert or update municipal elections
      for (const election of municipalElections) {
        await this.upsertElection(election);
      }

      return {
        success: true,
        message: `${municipalElections.length} municipal elections processed`,
        data: { elections: municipalElections.length }
      };
    } catch (error) {
      logger.error('Municipal election ingestion failed:', error);
      return {
        success: false,
        message: 'Failed to ingest municipal elections',
        data: { error: (error as any)?.message }
      };
    }
  }

  private async upsertElection(electionData: ElectionData): Promise<void> {
    try {
      // Check if election already exists
      const existingElection = await db
        .select()
        .from(elections)
        .where(
          and(
            eq(elections.type, electionData.type),
            eq(elections.jurisdiction, electionData.jurisdiction),
            eq(elections.title, electionData.title)
          )
        )
        .limit(1);

      if (existingElection.length > 0) {
        // Update existing election
        await db
          .update(elections)
          .set({
            date: new Date(electionData.date),
            status: electionData.status,
            updatedAt: new Date()
          })
          .where(eq(elections.id, existingElection[0].id));
      } else {
        // Insert new election
        await db.insert(elections).values({
          type: electionData.type,
          jurisdiction: electionData.jurisdiction,
          title: electionData.title,
          date: new Date(electionData.date),
          status: electionData.status,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      logger.error('Failed to upsert election:', error);
      throw error;
    }
  }

  private async createSampleElectionsIfNeeded(): Promise<void> {
    try {
      const existingElections = await db.select().from(elections).limit(1);
      
      if (existingElections.length === 0) {
        logger.info('No elections found, creating sample data');
        await this.ingestAllElections();
      }
    } catch (error) {
      logger.error('Failed to create sample elections:', error);
    }
  }

  async getElectionsByLocation(location?: string): Promise<{ upcoming: any[]; recent: any[]; lastUpdated: string; sources: string[] }> {
    try {
      let electionsData;
      
      if (location) {
        const locationLower = location.toLowerCase();
        electionsData = await db
          .select()
          .from(elections)
          .where(
            or(
              ilike(elections.jurisdiction, `%${locationLower}%`),
              ilike(elections.title, `%${locationLower}%`)
            )
          )
          .orderBy(elections.date);
      } else {
        electionsData = await db
          .select()
          .from(elections)
          .orderBy(elections.date);
      }

      const now = new Date();

      const upcoming = electionsData.filter(election => {
        const electionDate = new Date(election.date);
        return electionDate > now && election.status === 'upcoming';
      });

      const recent = electionsData.filter(election => {
        const electionDate = new Date(election.date);
        return electionDate <= now || election.status === 'completed';
      });

      return {
        upcoming,
        recent,
        lastUpdated: new Date().toISOString(),
        sources: this.sources.map(s => s.name)
      };
    } catch (error) {
      logger.error('Failed to get elections by location:', error);
      return {
        upcoming: [],
        recent: [],
        lastUpdated: new Date().toISOString(),
        sources: []
      };
    }
  }

  async getElectionsByType(type: string): Promise<ElectionData[]> {
    try {
      const electionsData = await db
        .select()
        .from(elections)
        .where(eq(elections.type, type))
        .orderBy(desc(elections.date));

      return electionsData.map(election => ({
        id: election.id,
        title: election.title,
        date: election.date.toISOString().split('T')[0],
        type: election.type as 'federal' | 'provincial' | 'municipal',
        jurisdiction: election.jurisdiction,
        status: (election.status || 'upcoming') as 'upcoming' | 'completed',
        // Add placeholder values for fields not in DB schema but required by ElectionData
        description: 'Election information from CivicOS',
        source: 'CivicOS System',
        sourceUrl: '',
        registrationDeadline: '',
        advanceVotingDates: [],
        candidates: [],
        sources: ['CivicOS System'],
        turnout: 0,
        results: []
      }));
    } catch (error) {
      logger.error('Failed to get elections by type:', error);
      throw error;
    }
  }

  async getAllElections(): Promise<ElectionData[]> {
    try {
      const electionsData = await db
        .select()
        .from(elections)
        .orderBy(desc(elections.date));

      return electionsData.map(election => ({
        id: election.id,
        title: election.title,
        date: election.date.toISOString().split('T')[0],
        type: election.type as 'federal' | 'provincial' | 'municipal',
        jurisdiction: election.jurisdiction,
        status: (election.status || 'upcoming') as 'upcoming' | 'completed',
        // Add placeholder values for fields not in DB schema but required by ElectionData
        description: 'Election information from CivicOS',
        source: 'CivicOS System',
        sourceUrl: '',
        registrationDeadline: '',
        advanceVotingDates: [],
        candidates: [],
        sources: ['CivicOS System'],
        turnout: 0,
        results: []
      }));
    } catch (error) {
      logger.error('Failed to get all elections:', error);
      throw error;
    }
  }

  private getFederalElections(): ElectionData[] {
    const currentYear = new Date().getFullYear();
    const nextFederalElection = currentYear + (currentYear % 4 === 0 ? 0 : 4 - (currentYear % 4));

    return [
      {
        type: 'federal' as const,
        jurisdiction: 'Canada',
        title: '44th Canadian Federal Election',
        date: `${nextFederalElection}-10-20`, // Third Monday in October
        status: 'upcoming' as const,
        description: 'General election for the House of Commons of Canada. All 338 electoral districts will elect Members of Parliament.',
        source: 'Elections Canada',
        sourceUrl: 'https://www.elections.ca',
        registrationDeadline: `${nextFederalElection}-10-13`,
        advanceVotingDates: [`${nextFederalElection}-10-10`, `${nextFederalElection}-10-11`, `${nextFederalElection}-10-12`, `${nextFederalElection}-10-13`]
      },
      {
        type: 'federal' as const,
        jurisdiction: 'Canada',
        title: '43rd Canadian Federal Election',
        date: '2021-09-20',
        status: 'completed' as const,
        description: 'General election for the House of Commons of Canada. The Liberal Party won a minority government.',
        source: 'Elections Canada',
        sourceUrl: 'https://www.elections.ca',
        registrationDeadline: '2021-09-13',
        advanceVotingDates: ['2021-09-10', '2021-09-11', '2021-09-12', '2021-09-13']
      }
    ];
  }

  private getProvincialElections(): ElectionData[] {
    return [
      {
        type: 'provincial' as const,
        jurisdiction: 'Ontario',
        title: '43rd Ontario General Election',
        date: '2026-06-04',
        status: 'upcoming' as const,
        description: 'General election for the Legislative Assembly of Ontario. All 124 electoral districts will elect Members of Provincial Parliament.',
        source: 'Elections Ontario',
        sourceUrl: 'https://www.elections.on.ca',
        registrationDeadline: '2026-05-28',
        advanceVotingDates: ['2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31']
      },
      {
        type: 'provincial' as const,
        jurisdiction: 'British Columbia',
        title: '42nd British Columbia General Election',
        date: '2024-10-19',
        status: 'completed' as const,
        description: 'General election for the Legislative Assembly of British Columbia. The BC NDP won a majority government.',
        source: 'Elections BC',
        sourceUrl: 'https://elections.bc.ca',
        registrationDeadline: '2024-10-12',
        advanceVotingDates: ['2024-10-12', '2024-10-13', '2024-10-14', '2024-10-15']
      },
      {
        type: 'provincial' as const,
        jurisdiction: 'Alberta',
        title: '31st Alberta General Election',
        date: '2027-05-31',
        status: 'upcoming' as const,
        description: 'General election for the Legislative Assembly of Alberta. All 87 electoral districts will elect Members of the Legislative Assembly.',
        source: 'Elections Alberta',
        sourceUrl: 'https://www.elections.ab.ca',
        registrationDeadline: '2027-05-24',
        advanceVotingDates: ['2027-05-24', '2027-05-25', '2027-05-26', '2027-05-27']
      },
      {
        type: 'provincial' as const,
        jurisdiction: 'Quebec',
        title: '44th Quebec General Election',
        date: '2026-10-05',
        status: 'upcoming' as const,
        description: 'General election for the National Assembly of Quebec. All 125 electoral districts will elect Members of the National Assembly.',
        source: 'Elections Quebec',
        sourceUrl: 'https://www.electionsquebec.qc.ca',
        registrationDeadline: '2026-09-28',
        advanceVotingDates: ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']
      }
    ];
  }

  private getMunicipalElections(): ElectionData[] {
    return [
      {
        type: 'municipal' as const,
        jurisdiction: 'Toronto, Ontario',
        title: '2026 Toronto Municipal Election',
        date: '2026-10-26',
        status: 'upcoming' as const,
        description: 'Municipal election for the City of Toronto. Voters will elect the Mayor, City Councillors, and School Board Trustees.',
        source: 'Toronto Elections',
        sourceUrl: 'https://www.toronto.ca/city-government/elections',
        registrationDeadline: '2026-10-19',
        advanceVotingDates: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22']
      },
      {
        type: 'municipal' as const,
        jurisdiction: 'Vancouver, British Columbia',
        title: '2026 Vancouver Municipal Election',
        date: '2026-10-17',
        status: 'upcoming' as const,
        description: 'Municipal election for the City of Vancouver. Voters will elect the Mayor, City Councillors, and School Board Trustees.',
        source: 'Vancouver Elections',
        sourceUrl: 'https://vancouver.ca/your-government/elections',
        registrationDeadline: '2026-10-10',
        advanceVotingDates: ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13']
      },
      {
        type: 'municipal' as const,
        jurisdiction: 'Montreal, Quebec',
        title: '2025 Montreal Municipal Election',
        date: '2025-11-02',
        status: 'upcoming' as const,
        description: 'Municipal election for the City of Montreal. Voters will elect the Mayor, City Councillors, and Borough Councillors.',
        source: 'Montreal Elections',
        sourceUrl: 'https://montreal.ca/en/elections',
        registrationDeadline: '2025-10-26',
        advanceVotingDates: ['2025-10-26', '2025-10-27', '2025-10-28', '2025-10-29']
      }
    ];
  }
}

export const electionIngestionService = new ElectionIngestionService();
