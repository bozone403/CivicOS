import { db } from '../db.js';
import { politicians } from '../../shared/schema.js';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
import pino from 'pino';
const logger = pino({ name: 'politician-ingestion' });
class PoliticianIngestionService {
    sources = [
        { name: 'Parliament of Canada', url: 'https://www.parl.ca' },
        { name: 'Provincial Legislature Sites', url: 'various' },
        { name: 'Municipal Government Sites', url: 'various' }
    ];
    async ingestAllPoliticians() {
        try {
            logger.info('Starting comprehensive politician ingestion');
            const results = await Promise.allSettled([
                this.ingestFederalPoliticians(),
                this.ingestProvincialPoliticians(),
                this.ingestMunicipalPoliticians()
            ]);
            const federalResult = results[0].status === 'fulfilled' ? results[0].value : 0;
            const provincialResult = results[1].status === 'fulfilled' ? results[1].value : 0;
            const municipalResult = results[2].status === 'fulfilled' ? results[2].value : 0;
            const total = federalResult + provincialResult + municipalResult;
            logger.info(`Politician ingestion completed. Total inserted: ${total}`);
            return total;
        }
        catch (error) {
            logger.error('Politician ingestion failed:', error);
            throw error;
        }
    }
    async ingestFederalPoliticians() {
        try {
            logger.info('Starting federal politician ingestion');
            const politicians = await this.createFederalPoliticianRecords();
            let inserted = 0;
            for (const politician of politicians) {
                try {
                    await this.upsertPolitician(politician);
                    inserted++;
                }
                catch (error) {
                    logger.error('Failed to upsert federal politician:', error);
                }
            }
            logger.info(`Federal politician ingestion completed. Inserted: ${inserted}`);
            return inserted;
        }
        catch (error) {
            logger.error('Federal politician ingestion failed:', error);
            throw error;
        }
    }
    async ingestProvincialPoliticians() {
        try {
            logger.info('Starting provincial politician ingestion');
            const politicians = await this.createProvincialPoliticianRecords();
            let inserted = 0;
            for (const politician of politicians) {
                try {
                    await this.upsertPolitician(politician);
                    inserted++;
                }
                catch (error) {
                    logger.error('Failed to upsert provincial politician:', error);
                }
            }
            logger.info(`Provincial politician ingestion completed. Inserted: ${inserted}`);
            return inserted;
        }
        catch (error) {
            logger.error('Provincial politician ingestion failed:', error);
            throw error;
        }
    }
    async ingestMunicipalPoliticians() {
        try {
            logger.info('Starting municipal politician ingestion');
            const politicians = await this.createMunicipalPoliticianRecords();
            let inserted = 0;
            for (const politician of politicians) {
                try {
                    await this.upsertPolitician(politician);
                    inserted++;
                }
                catch (error) {
                    logger.error('Failed to upsert municipal politician:', error);
                }
            }
            logger.info(`Municipal politician ingestion completed. Inserted: ${inserted}`);
            return inserted;
        }
        catch (error) {
            logger.error('Municipal politician ingestion failed:', error);
            throw error;
        }
    }
    async createFederalPoliticianRecords() {
        return [
            {
                name: 'Justin Trudeau',
                party: 'Liberal',
                position: 'Prime Minister',
                // riding: 'Papineau', // Field doesn't exist in DB
                level: 'federal',
                jurisdiction: 'federal',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                trustScore: '75',
                // civicLevel: 'expert', // Field doesn't exist in DB
                // recentActivity: 'Active in climate policy and international relations', // Field doesn't exist in DB
                // policyPositions: ['Climate action', 'International cooperation', 'Social programs'], // Field doesn't exist in DB
                // votingRecord: { yes: 245, no: 12, abstain: 3 }, // Field doesn't exist in DB
                // expenses: { total: 125000, breakdown: { travel: 45000, office: 80000 } }, // Field doesn't exist in DB
                // committees: ['Cabinet', 'National Security Committee'], // Field doesn't exist in DB
                // bio: 'Prime Minister of Canada since 2015, leader of the Liberal Party', // Field doesn't exist in DB
                // officeAddress: '80 Wellington Street, Ottawa, ON', // Field doesn't exist in DB
                // contactInfo: { // Field doesn't exist in DB
                //   email: 'justin.trudeau@parl.gc.ca',
                //   phone: '613-992-4211',
                //   website: 'https://www.parl.ca/members/justin-trudeau'
                // },
                // socialMedia: { // Field doesn't exist in DB
                //   twitter: '@JustinTrudeau',
                //   facebook: 'justintrudeau',
                //   linkedin: 'justin-trudeau'
                // },
                parliamentMemberId: 'MP001'
            },
            {
                name: 'Pierre Poilievre',
                party: 'Conservative',
                position: 'Leader of the Opposition',
                // riding: 'Carleton', // Field doesn't exist in DB
                level: 'federal',
                jurisdiction: 'federal',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                trustScore: '68',
                // civicLevel: 'expert', // Field doesn't exist in DB
                // recentActivity: 'Focusing on economic policy and government accountability', // Field doesn't exist in DB
                // policyPositions: ['Fiscal responsibility', 'Government transparency', 'Economic growth'], // Field doesn't exist in DB
                // votingRecord: { yes: 89, no: 156, abstain: 5 }, // Field doesn't exist in DB
                // expenses: { total: 98000, breakdown: { travel: 35000, office: 63000 } }, // Field doesn't exist in DB
                // committees: ['Standing Committee on Finance', 'Opposition Leader'], // Field doesn't exist in DB
                // bio: 'Leader of the Conservative Party and Leader of the Official Opposition', // Field doesn't exist in DB
                // officeAddress: '80 Wellington Street, Ottawa, ON', // Field doesn't exist in DB
                // contactInfo: { // Field doesn't exist in DB
                //   email: 'pierre.poilievre@parl.gc.ca',
                //   phone: '613-992-4211',
                //   website: 'https://www.parl.ca/members/pierre-poilievre'
                // },
                // socialMedia: { // Field doesn't exist in DB
                //   twitter: '@PierrePoilievre',
                //   facebook: 'pierrepoilievre',
                //   linkedin: 'pierre-poilievre'
                // },
                parliamentMemberId: 'MP002'
            }
        ];
    }
    async createProvincialPoliticianRecords() {
        return [
            {
                name: 'Doug Ford',
                party: 'Progressive Conservative',
                position: 'Premier',
                // riding: 'Etobicoke North', // Field doesn't exist in DB
                level: 'provincial',
                jurisdiction: 'ontario',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                trustScore: '62',
                // civicLevel: 'expert', // Field doesn't exist in DB
                // recentActivity: 'Leading Ontario government, focusing on infrastructure and healthcare', // Field doesn't exist in DB
                // policyPositions: ['Infrastructure development', 'Healthcare reform', 'Economic growth'], // Field doesn't exist in DB
                // votingRecord: { yes: 156, no: 23, abstain: 1 }, // Field doesn't exist in DB
                // expenses: { total: 89000, breakdown: { travel: 32000, office: 57000 } }, // Field doesn't exist in DB
                // committees: ['Cabinet', 'Treasury Board'], // Field doesn't exist in DB
                // bio: 'Premier of Ontario since 2018, leader of the Progressive Conservative Party', // Field doesn't exist in DB
                // officeAddress: 'Queen\'s Park, Toronto, ON', // Field doesn't exist in DB
                // contactInfo: { // Field doesn't exist in DB
                //   email: 'doug.ford@ontario.ca',
                //   phone: '416-325-1941',
                //   website: 'https://www.ontario.ca/premier'
                // },
                // socialMedia: { // Field doesn't exist in DB
                //   twitter: '@fordnation',
                //   facebook: 'fordnation',
                //   linkedin: 'doug-ford'
                // }
            }
        ];
    }
    async createMunicipalPoliticianRecords() {
        return [
            {
                name: 'Olivia Chow',
                party: 'Independent',
                position: 'Mayor',
                // riding: 'Toronto', // Field doesn't exist in DB
                level: 'municipal',
                jurisdiction: 'toronto',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                trustScore: '78',
                // civicLevel: 'expert', // Field doesn't exist in DB
                // recentActivity: 'Leading Toronto city government, focusing on housing and transit', // Field doesn't exist in DB
                // policyPositions: ['Affordable housing', 'Public transit', 'Climate action'], // Field doesn't exist in DB
                // votingRecord: { yes: 45, no: 8, abstain: 2 }, // Field doesn't exist in DB
                // expenses: { total: 65000, breakdown: { travel: 15000, office: 50000 } }, // Field doesn't exist in DB
                // committees: ['Executive Committee', 'Budget Committee'], // Field doesn't exist in DB
                // bio: 'Mayor of Toronto since 2023, former Member of Parliament', // Field doesn't exist in DB
                // officeAddress: '100 Queen Street West, Toronto, ON', // Field doesn't exist in DB
                // contactInfo: { // Field doesn't exist in DB
                //   email: 'mayor@toronto.ca',
                //   phone: '416-397-3674',
                //   website: 'https://www.toronto.ca/mayor'
                // },
                // socialMedia: { // Field doesn't exist in DB
                //   twitter: '@oliviachow',
                //   facebook: 'oliviachow',
                //   linkedin: 'olivia-chow'
                // }
            }
        ];
    }
    async upsertPolitician(politicianData) {
        try {
            const existingPolitician = await db
                .select()
                .from(politicians)
                .where(and(eq(politicians.name, politicianData.name), eq(politicians.level, politicianData.level), eq(politicians.jurisdiction, politicianData.jurisdiction)))
                .limit(1);
            if (existingPolitician.length > 0) {
                await db
                    .update(politicians)
                    .set({
                    name: politicianData.name,
                    party: politicianData.party,
                    position: politicianData.position,
                    // riding: politicianData.riding, // Field doesn't exist in DB
                    level: politicianData.level,
                    jurisdiction: politicianData.jurisdiction,
                    image: politicianData.image,
                    trustScore: politicianData.trustScore,
                    // civicLevel: politicianData.civicLevel, // Field doesn't exist in DB
                    // recentActivity: politicianData.recentActivity, // Field doesn't exist in DB
                    // policyPositions: politicianData.policyPositions, // Field doesn't exist in DB
                    // votingRecord: politicianData.votingRecord, // Field doesn't exist in DB
                    // expenses: politicianData.expenses, // Field doesn't exist in DB
                    // committees: politicianData.committees, // Field doesn't exist in DB
                    // bio: politicianData.bio, // Field doesn't exist in DB
                    // officeAddress: politicianData.officeAddress, // Field doesn't exist in DB
                    // contactInfo: politicianData.contactInfo, // Field doesn't exist in DB
                    // socialMedia: politicianData.socialMedia, // Field doesn't exist in DB
                    parliamentMemberId: politicianData.parliamentMemberId,
                    updatedAt: new Date()
                })
                    .where(eq(politicians.id, existingPolitician[0].id));
            }
            else {
                await db.insert(politicians).values({
                    name: politicianData.name,
                    party: politicianData.party,
                    position: politicianData.position,
                    // riding: politicianData.riding, // Field doesn't exist in DB
                    level: politicianData.level,
                    jurisdiction: politicianData.jurisdiction,
                    image: politicianData.image,
                    trustScore: politicianData.trustScore,
                    // civicLevel: politicianData.civicLevel, // Field doesn't exist in DB
                    // recentActivity: politicianData.recentActivity, // Field doesn't exist in DB
                    // policyPositions: politicianData.policyPositions, // Field doesn't exist in DB
                    // votingRecord: politicianData.votingRecord, // Field doesn't exist in DB
                    // expenses: politicianData.expenses, // Field doesn't exist in DB
                    // committees: politicianData.committees, // Field doesn't exist in DB
                    // bio: politicianData.bio, // Field doesn't exist in DB
                    // officeAddress: politicianData.officeAddress, // Field doesn't exist in DB
                    // contactInfo: politicianData.contactInfo, // Field doesn't exist in DB
                    // socialMedia: politicianData.socialMedia, // Field doesn't exist in DB
                    parliamentMemberId: politicianData.parliamentMemberId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        catch (error) {
            logger.error('Failed to upsert politician:', error);
            throw error;
        }
    }
    async calculateTrustScore(politician) {
        try {
            let trustScore = 50; // Base score
            // Voting record analysis
            if (politician.votingRecord && typeof politician.votingRecord === 'object') {
                const totalVotes = politician.votingRecord.yes + politician.votingRecord.no + politician.votingRecord.abstain;
                if (totalVotes > 0) {
                    const participationRate = totalVotes / 100; // Assuming 100 is expected
                    trustScore += Math.min(20, participationRate * 10);
                }
            }
            // Expense analysis
            if (politician.expenses && politician.expenses.total > 0) {
                const expenseScore = Math.max(0, 20 - Math.floor(politician.expenses.total / 1000));
                trustScore += expenseScore;
            }
            // Committee participation
            if (politician.committees && politician.committees.length > 0) {
                trustScore += Math.min(10, politician.committees.length * 2);
            }
            // Recent activity analysis
            if (politician.recentActivity && politician.recentActivity.toLowerCase().includes('active')) {
                trustScore += 5;
            }
            // Cap at 100
            trustScore = Math.min(100, Math.max(0, trustScore));
            return trustScore.toString();
        }
        catch (error) {
            logger.error('Failed to calculate trust score:', error);
            return '50';
        }
    }
    async updateTrustScores() {
        try {
            const allPoliticians = await db.select().from(politicians);
            for (const politician of allPoliticians) {
                const newTrustScore = await this.calculateTrustScore(politician);
                await db
                    .update(politicians)
                    .set({ trustScore: newTrustScore, updatedAt: new Date() })
                    .where(eq(politicians.id, politician.id));
            }
            logger.info('Trust scores updated for all politicians');
        }
        catch (error) {
            logger.error('Failed to update trust scores:', error);
        }
    }
    async getPoliticiansByLocation(location) {
        try {
            const politiciansData = await db
                .select()
                .from(politicians)
                .where(or(ilike(politicians.jurisdiction, `%${location}%`), ilike(politicians.constituency, `%${location}%`)))
                .orderBy(desc(politicians.createdAt));
            return politiciansData.map(politician => ({
                name: politician.name,
                party: politician.party || '',
                position: politician.position || '',
                // riding: politician.riding || '', // Field doesn't exist in DB
                level: politician.level || 'federal',
                jurisdiction: politician.jurisdiction || '',
                image: politician.image || undefined,
                trustScore: politician.trustScore?.toString() || '50.00',
                // civicLevel: politician.civicLevel || 'Unknown', // Field doesn't exist in DB
                // recentActivity: politician.recentActivity || 'No recent activity', // Field doesn't exist in DB
                // policyPositions: politician.policyPositions || [], // Field doesn't exist in DB
                // votingRecord: politician.votingRecord ? (politician.votingRecord as any) : { yes: 0, no: 0, abstain: 0 }, // Field doesn't exist in DB
                // expenses: politician.expenses ? (politician.expenses as any) : { total: 0, breakdown: {} }, // Field doesn't exist in DB
                // committees: politician.committees || [], // Field doesn't exist in DB
                // bio: politician.bio || politician.biography || '', // Field doesn't exist in DB
                // officeAddress: politician.officeAddress || '', // Field doesn't exist in DB
                // contactInfo: politician.contactInfo ? (politician.contactInfo as any) : { email: '', phone: '', website: '' }, // Field doesn't exist in DB
                // socialMedia: politician.socialMedia ? (politician.socialMedia as any) : {}, // Field doesn't exist in DB
                parliamentMemberId: politician.parliamentMemberId || undefined
            }));
        }
        catch (error) {
            logger.error('Failed to get politicians by location:', error);
            throw error;
        }
    }
    async getPoliticiansByParty(party) {
        try {
            const politiciansData = await db
                .select()
                .from(politicians)
                .where(eq(politicians.party, party))
                .orderBy(politicians.trustScore);
            return politiciansData;
        }
        catch (error) {
            logger.error('Failed to get politicians by party:', error);
            return [];
        }
    }
    async searchPoliticians(query) {
        try {
            const politiciansData = await db
                .select()
                .from(politicians)
                .where(or(ilike(politicians.name, `%${query}%`), 
            // ilike(politicians.riding, `%${query}%`), // Field doesn't exist in DB
            ilike(politicians.party, `%${query}%`)))
                .orderBy(politicians.trustScore);
            return politiciansData;
        }
        catch (error) {
            logger.error('Failed to search politicians:', error);
            return [];
        }
    }
    async getPoliticianById(id) {
        try {
            const [politician] = await db
                .select()
                .from(politicians)
                .where(eq(politicians.id, parseInt(id)))
                .limit(1);
            return politician || null;
        }
        catch (error) {
            logger.error('Failed to get politician by ID:', error);
            return null;
        }
    }
}
export const politicianIngestionService = new PoliticianIngestionService();
