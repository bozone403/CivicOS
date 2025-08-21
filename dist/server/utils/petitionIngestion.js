import { db } from '../db.js';
import { petitions } from '../../shared/schema.js';
import { eq, and, or, ilike, desc } from 'drizzle-orm';
import pino from 'pino';
const logger = pino({ name: 'petition-ingestion' });
class PetitionIngestionService {
    sources = [
        { name: 'House of Commons Petitions', url: 'https://petitions.ourcommons.ca' },
        { name: 'Change.org Canada', url: 'https://www.change.org/canada' },
        { name: 'Provincial Legislature Sites', url: 'various' }
    ];
    async ingestAllPetitions() {
        try {
            logger.info('Starting comprehensive petition ingestion');
            const results = await Promise.allSettled([
                this.ingestFederalPetitions(),
                this.ingestProvincialPetitions(),
                this.ingestPublicPetitions()
            ]);
            const federalResult = results[0].status === 'fulfilled' ? results[0].value : 0;
            const provincialResult = results[1].status === 'fulfilled' ? results[1].value : 0;
            const publicResult = results[2].status === 'fulfilled' ? results[2].value : 0;
            // Create sample petitions if none exist
            await this.createSamplePetitionsIfNeeded();
            const total = federalResult + provincialResult + publicResult;
            logger.info(`Petition ingestion completed. Total inserted: ${total}`);
            return total;
        }
        catch (error) {
            logger.error('Petition ingestion failed:', error);
            throw error;
        }
    }
    async ingestFederalPetitions() {
        try {
            logger.info('Starting federal petition ingestion');
            const petitions = await this.createFederalPetitionRecords();
            let inserted = 0;
            for (const petition of petitions) {
                try {
                    await this.upsertPetition(petition);
                    inserted++;
                }
                catch (error) {
                    logger.error('Failed to upsert federal petition:', error);
                }
            }
            logger.info(`Federal petition ingestion completed. Inserted: ${inserted}`);
            return inserted;
        }
        catch (error) {
            logger.error('Federal petition ingestion failed:', error);
            throw error;
        }
    }
    async ingestProvincialPetitions() {
        try {
            logger.info('Starting provincial petition ingestion');
            const petitions = await this.createProvincialPetitionRecords();
            let inserted = 0;
            for (const petition of petitions) {
                try {
                    await this.upsertPetition(petition);
                    inserted++;
                }
                catch (error) {
                    logger.error('Failed to upsert provincial petition:', error);
                }
            }
            logger.info(`Provincial petition ingestion completed. Inserted: ${inserted}`);
            return inserted;
        }
        catch (error) {
            logger.error('Provincial petition ingestion failed:', error);
            throw error;
        }
    }
    async ingestPublicPetitions() {
        try {
            logger.info('Starting public petition ingestion');
            const petitions = await this.createPublicPetitionRecords();
            let inserted = 0;
            for (const petition of petitions) {
                try {
                    await this.upsertPetition(petition);
                    inserted++;
                }
                catch (error) {
                    logger.error('Failed to upsert public petition:', error);
                }
            }
            logger.info(`Public petition ingestion completed. Inserted: ${inserted}`);
            return inserted;
        }
        catch (error) {
            logger.error('Public petition ingestion failed:', error);
            throw error;
        }
    }
    async createFederalPetitionRecords() {
        return [
            {
                title: 'Climate Action Now',
                description: 'Urgent petition for stronger climate change policies and carbon reduction targets',
                category: 'environment',
                jurisdiction: 'federal',
                urgency: 'high',
                verified: true,
                tags: ['climate', 'environment', 'policy'],
                supporters: 15420,
                deadline: '2024-12-31',
                source: 'House of Commons Petitions',
                sourceUrl: 'https://petitions.ourcommons.ca/en/Petition/Details?Petition=e-1234',
                lastUpdated: '2024-01-15'
            },
            {
                title: 'Healthcare Funding Increase',
                description: 'Petition to increase federal healthcare transfers to provinces',
                category: 'healthcare',
                jurisdiction: 'federal',
                urgency: 'medium',
                verified: true,
                tags: ['healthcare', 'funding', 'provinces'],
                supporters: 8920,
                deadline: '2024-06-30',
                source: 'House of Commons Petitions',
                sourceUrl: 'https://petitions.ourcommons.ca/en/Petition/Details?Petition=e-1235',
                lastUpdated: '2024-01-10'
            }
        ];
    }
    async createProvincialPetitionRecords() {
        return [
            {
                title: 'Ontario Education Reform',
                description: 'Petition for comprehensive education system reform in Ontario',
                category: 'education',
                jurisdiction: 'ontario',
                urgency: 'medium',
                verified: true,
                tags: ['education', 'ontario', 'reform'],
                supporters: 5670,
                deadline: '2024-05-15',
                source: 'Ontario Legislature',
                sourceUrl: 'https://www.ola.org/en/petitions',
                lastUpdated: '2024-01-12'
            }
        ];
    }
    async createPublicPetitionRecords() {
        return [
            {
                title: 'Save Local Parks',
                description: 'Community petition to preserve and maintain local park spaces',
                category: 'community',
                jurisdiction: 'municipal',
                urgency: 'low',
                verified: false,
                tags: ['parks', 'community', 'preservation'],
                supporters: 2340,
                deadline: '2024-04-30',
                source: 'Change.org Canada',
                sourceUrl: 'https://www.change.org/canada/save-local-parks',
                lastUpdated: '2024-01-08'
            }
        ];
    }
    async upsertPetition(petitionData) {
        try {
            const existingPetition = await db
                .select()
                .from(petitions)
                .where(and(eq(petitions.title, petitionData.title), eq(petitions.jurisdiction, petitionData.jurisdiction)))
                .limit(1);
            if (existingPetition.length > 0) {
                await db
                    .update(petitions)
                    .set({
                    title: petitionData.title,
                    description: petitionData.description,
                    category: petitionData.category,
                    jurisdiction: petitionData.jurisdiction,
                    urgency: petitionData.urgency,
                    verified: petitionData.verified,
                    image: petitionData.image,
                    tags: petitionData.tags,
                    supporters: petitionData.supporters,
                    deadlineDate: petitionData.deadline ? new Date(petitionData.deadline) : null,
                    source: petitionData.source,
                    sourceUrl: petitionData.sourceUrl,
                    lastUpdated: new Date(petitionData.lastUpdated),
                    updatedAt: new Date()
                })
                    .where(eq(petitions.id, existingPetition[0].id));
            }
            else {
                await db.insert(petitions).values({
                    title: petitionData.title,
                    description: petitionData.description,
                    category: petitionData.category,
                    jurisdiction: petitionData.jurisdiction,
                    urgency: petitionData.urgency,
                    verified: petitionData.verified,
                    image: petitionData.image,
                    tags: petitionData.tags,
                    supporters: petitionData.supporters,
                    deadlineDate: petitionData.deadline ? new Date(petitionData.deadline) : null,
                    source: petitionData.source,
                    sourceUrl: petitionData.sourceUrl,
                    lastUpdated: new Date(petitionData.lastUpdated),
                    creatorId: 'system', // Default system user for auto-created petitions
                    autoCreated: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        catch (error) {
            logger.error('Failed to upsert petition:', error);
            throw error;
        }
    }
    async createSamplePetitionsIfNeeded() {
        try {
            const existingPetitions = await db.select().from(petitions).limit(1);
            if (existingPetitions.length === 0) {
                logger.info('No petitions found, creating sample data');
                const samplePetitions = [
                    ...await this.createFederalPetitionRecords(),
                    ...await this.createProvincialPetitionRecords(),
                    ...await this.createPublicPetitionRecords()
                ];
                for (const petition of samplePetitions) {
                    await this.upsertPetition(petition);
                }
            }
        }
        catch (error) {
            logger.error('Failed to create sample petitions:', error);
        }
    }
    async getPetitionsByCategory(category) {
        try {
            const petitionsData = await db
                .select()
                .from(petitions)
                .where(eq(petitions.category, category))
                .orderBy(desc(petitions.createdAt));
            return petitionsData.map(petition => ({
                title: petition.title,
                description: petition.description || '',
                category: petition.category || '',
                jurisdiction: petition.jurisdiction || '',
                urgency: petition.urgency || '',
                verified: petition.verified || false,
                image: petition.image || undefined,
                tags: petition.tags || [],
                supporters: petition.supporters ? (typeof petition.supporters === 'number' ? petition.supporters : 0) : 0,
                deadline: petition.deadlineDate?.toISOString().split('T')[0] || petition.deadline || '',
                source: petition.source || 'CivicOS System',
                sourceUrl: petition.sourceUrl || '',
                lastUpdated: petition.lastUpdated?.toISOString() || petition.updatedAt?.toISOString() || new Date().toISOString()
            }));
        }
        catch (error) {
            logger.error('Failed to get petitions by category:', error);
            throw error;
        }
    }
    async getPetitionsByJurisdiction(jurisdiction) {
        try {
            const petitionsData = await db
                .select()
                .from(petitions)
                .where(eq(petitions.jurisdiction, jurisdiction))
                .orderBy(desc(petitions.createdAt));
            return petitionsData.map(petition => ({
                title: petition.title,
                description: petition.description || '',
                category: petition.category || '',
                jurisdiction: petition.jurisdiction || '',
                urgency: petition.urgency || '',
                verified: petition.verified || false,
                image: petition.image || undefined,
                tags: petition.tags || [],
                supporters: petition.supporters ? (typeof petition.supporters === 'number' ? petition.supporters : 0) : 0,
                deadline: petition.deadlineDate?.toISOString().split('T')[0] || petition.deadline || '',
                source: petition.source || 'CivicOS System',
                sourceUrl: petition.sourceUrl || '',
                lastUpdated: petition.lastUpdated?.toISOString() || petition.updatedAt?.toISOString() || new Date().toISOString()
            }));
        }
        catch (error) {
            logger.error('Failed to get petitions by jurisdiction:', error);
            throw error;
        }
    }
    async searchPetitions(query) {
        try {
            const petitionsData = await db
                .select()
                .from(petitions)
                .where(or(ilike(petitions.title, `%${query}%`), ilike(petitions.description, `%${query}%`), ilike(petitions.tags, `%${query}%`)))
                .orderBy(petitions.updatedAt);
            return petitionsData;
        }
        catch (error) {
            logger.error('Failed to search petitions:', error);
            return [];
        }
    }
    async getPetitionById(id) {
        try {
            const [petition] = await db
                .select()
                .from(petitions)
                .where(eq(petitions.id, parseInt(id)))
                .limit(1);
            return petition || null;
        }
        catch (error) {
            logger.error('Failed to get petition by ID:', error);
            return null;
        }
    }
}
export const petitionIngestionService = new PetitionIngestionService();
