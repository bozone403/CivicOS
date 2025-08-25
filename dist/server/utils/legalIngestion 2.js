import { db } from '../db.js';
import { legalActs, legalCases, criminalCodeSections } from '../../shared/schema.js';
import { eq, and, or, ilike } from 'drizzle-orm';
import pino from 'pino';
const logger = pino({ name: 'legal-ingestion' });
class LegalIngestionService {
    sources = [
        { name: 'Justice Laws Website', url: 'https://laws-lois.justice.gc.ca' },
        { name: 'Supreme Court of Canada', url: 'https://scc-csc.lexum.com' },
        { name: 'Federal Court', url: 'https://decisions.fct-cf.gc.ca' }
    ];
    async ingestFederalActs() {
        try {
            logger.info('Starting federal acts ingestion');
            const acts = await this.scrapeFederalActs();
            let inserted = 0;
            for (const act of acts) {
                try {
                    await this.upsertLegalAct(act);
                    inserted++;
                }
                catch (error) {
                    logger.error('Failed to upsert legal act:', error);
                }
            }
            logger.info(`Federal acts ingestion completed. Inserted: ${inserted}`);
            return inserted;
        }
        catch (error) {
            logger.error('Federal acts ingestion failed:', error);
            throw error;
        }
    }
    async ingestCriminalCode() {
        try {
            logger.info('Starting criminal code ingestion');
            const sections = await this.scrapeCriminalCode();
            let inserted = 0;
            for (const section of sections) {
                try {
                    await this.upsertCriminalCodeSection(section);
                    inserted++;
                }
                catch (error) {
                    logger.error('Failed to upsert criminal code section:', error);
                }
            }
            logger.info(`Criminal code ingestion completed. Inserted: ${inserted}`);
            return inserted;
        }
        catch (error) {
            logger.error('Criminal code ingestion failed:', error);
            throw error;
        }
    }
    async ingestLegalCases() {
        try {
            logger.info('Starting legal cases ingestion');
            const cases = await this.scrapeLegalCases();
            let inserted = 0;
            for (const caseData of cases) {
                try {
                    await this.upsertLegalCase(caseData);
                    inserted++;
                }
                catch (error) {
                    logger.error('Failed to upsert legal case:', error);
                }
            }
            logger.info(`Legal cases ingestion completed. Inserted: ${inserted}`);
            return inserted;
        }
        catch (error) {
            logger.error('Legal cases ingestion failed:', error);
            throw error;
        }
    }
    async scrapeFederalActs() {
        // Mock data for now - replace with actual scraping logic
        return [
            {
                title: 'Criminal Code',
                actNumber: 'RSC 1985, c C-46',
                jurisdiction: 'federal',
                summary: 'An Act respecting the criminal law',
                source: 'Justice Laws Website',
                sourceUrl: 'https://laws-lois.justice.gc.ca/eng/acts/c-46/',
                lastUpdated: '2024-01-01'
            },
            {
                title: 'Constitution Act, 1982',
                actNumber: 'Schedule B to the Canada Act 1982 (UK)',
                jurisdiction: 'federal',
                summary: 'An Act to give effect to a request by the Senate and House of Commons of Canada',
                source: 'Justice Laws Website',
                sourceUrl: 'https://laws-lois.justice.gc.ca/eng/const/',
                lastUpdated: '2024-01-01'
            }
        ];
    }
    async scrapeCriminalCode() {
        // Mock data for now - replace with actual scraping logic
        return [
            {
                title: 'Murder',
                sectionNumber: '229',
                jurisdiction: 'federal',
                // content: 'Culpable homicide is murder where the person who causes the death of a human being...', // Field doesn't exist in DB
                source: 'Justice Laws Website',
                sourceUrl: 'https://laws-lois.justice.gc.ca/eng/acts/c-46/section-229.html',
                lastUpdated: '2024-01-01'
            },
            {
                title: 'Assault',
                sectionNumber: '265',
                jurisdiction: 'federal',
                // content: 'A person commits an assault when without the consent of another person...', // Field doesn't exist in DB
                source: 'Justice Laws Website',
                sourceUrl: 'https://laws-lois.justice.gc.ca/eng/acts/c-46/section-265.html',
                lastUpdated: '2024-01-01'
            }
        ];
    }
    async scrapeLegalCases() {
        // Mock data for now - replace with actual scraping logic
        return [
            {
                title: 'R. v. Jordan',
                caseNumber: '2016 SCC 27',
                court: 'Supreme Court of Canada',
                summary: 'Case establishing the Jordan framework for unreasonable delay in criminal proceedings',
                source: 'Supreme Court of Canada',
                sourceUrl: 'https://scc-csc.lexum.com/scc-csc/scc-csc/en/item/16057/index.do',
                lastUpdated: '2024-01-01'
            }
        ];
    }
    async upsertLegalAct(actData) {
        try {
            const existingAct = await db
                .select()
                .from(legalActs)
                .where(and(eq(legalActs.title, actData.title), eq(legalActs.actNumber, actData.actNumber)))
                .limit(1);
            if (existingAct.length > 0) {
                await db
                    .update(legalActs)
                    .set({
                    title: actData.title,
                    actNumber: actData.actNumber,
                    summary: actData.summary,
                    source: actData.source,
                    sourceUrl: actData.sourceUrl,
                    lastUpdated: new Date(actData.lastUpdated),
                    updatedAt: new Date()
                })
                    .where(eq(legalActs.id, existingAct[0].id));
            }
            else {
                await db.insert(legalActs).values({
                    title: actData.title,
                    actNumber: actData.actNumber,
                    summary: actData.summary,
                    source: actData.source,
                    sourceUrl: actData.sourceUrl,
                    lastUpdated: new Date(actData.lastUpdated),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        catch (error) {
            logger.error('Failed to upsert legal act:', error);
            throw error;
        }
    }
    async upsertCriminalCodeSection(sectionData) {
        try {
            const existingSection = await db
                .select()
                .from(criminalCodeSections)
                .where(and(eq(criminalCodeSections.sectionNumber, sectionData.sectionNumber), eq(criminalCodeSections.title, sectionData.title)))
                .limit(1);
            if (existingSection.length > 0) {
                await db
                    .update(criminalCodeSections)
                    .set({
                    title: sectionData.title,
                    sectionNumber: sectionData.sectionNumber,
                    // content: sectionData.content, // Field doesn't exist in DB
                    source: sectionData.source,
                    sourceUrl: sectionData.sourceUrl,
                    lastUpdated: new Date(sectionData.lastUpdated),
                    updatedAt: new Date()
                })
                    .where(eq(criminalCodeSections.id, existingSection[0].id));
            }
            else {
                await db.insert(criminalCodeSections).values({
                    title: sectionData.title,
                    sectionNumber: sectionData.sectionNumber,
                    // content: sectionData.content, // Field doesn't exist in DB
                    source: sectionData.source,
                    sourceUrl: sectionData.sourceUrl,
                    lastUpdated: new Date(sectionData.lastUpdated),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        catch (error) {
            logger.error('Failed to upsert criminal code section:', error);
            throw error;
        }
    }
    async upsertLegalCase(caseData) {
        try {
            const existingCase = await db
                .select()
                .from(legalCases)
                .where(and(eq(legalCases.caseNumber, caseData.caseNumber), eq(legalCases.title, caseData.title)))
                .limit(1);
            if (existingCase.length > 0) {
                await db
                    .update(legalCases)
                    .set({
                    title: caseData.title,
                    caseNumber: caseData.caseNumber,
                    summary: caseData.summary,
                    source: caseData.source,
                    sourceUrl: caseData.sourceUrl,
                    lastUpdated: new Date(caseData.lastUpdated),
                    updatedAt: new Date()
                })
                    .where(eq(legalCases.id, existingCase[0].id));
            }
            else {
                await db.insert(legalCases).values({
                    title: caseData.title,
                    caseNumber: caseData.caseNumber,
                    summary: caseData.summary,
                    source: caseData.source,
                    sourceUrl: caseData.sourceUrl,
                    lastUpdated: new Date(caseData.lastUpdated),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }
        catch (error) {
            logger.error('Failed to upsert legal case:', error);
            throw error;
        }
    }
    async getLegalActsByCategory(category) {
        try {
            const query = db.select().from(legalActs);
            const acts = await query.orderBy(legalActs.lastUpdated);
            return acts;
        }
        catch (error) {
            logger.error('Failed to get legal acts by category:', error);
            return [];
        }
    }
    async searchLegalActs(query) {
        try {
            const acts = await db
                .select()
                .from(legalActs)
                .where(or(ilike(legalActs.title, `%${query}%`), ilike(legalActs.summary, `%${query}%`)))
                .orderBy(legalActs.lastUpdated);
            return acts;
        }
        catch (error) {
            logger.error('Failed to search legal acts:', error);
            return [];
        }
    }
    async searchCriminalCodeSections(query) {
        try {
            const sections = await db
                .select()
                .from(criminalCodeSections)
                .where(or(ilike(criminalCodeSections.title, `%${query}%`), ilike(criminalCodeSections.content, `%${query}%`)))
                .orderBy(criminalCodeSections.sectionNumber);
            return sections;
        }
        catch (error) {
            logger.error('Failed to search criminal code sections:', error);
            return [];
        }
    }
    async searchLegalCases(query) {
        try {
            const cases = await db
                .select()
                .from(legalCases)
                .where(or(ilike(legalCases.title, `%${query}%`), ilike(legalCases.summary, `%${query}%`)))
                .orderBy(legalCases.lastUpdated);
            return cases;
        }
        catch (error) {
            logger.error('Failed to search legal cases:', error);
            return [];
        }
    }
    async getLegalActById(id) {
        try {
            const [act] = await db
                .select()
                .from(legalActs)
                .where(eq(legalActs.id, parseInt(id)))
                .limit(1);
            return act || null;
        }
        catch (error) {
            logger.error('Failed to get legal act by ID:', error);
            return null;
        }
    }
    async getCriminalCodeSectionById(id) {
        try {
            const [section] = await db
                .select()
                .from(criminalCodeSections)
                .where(eq(criminalCodeSections.id, parseInt(id)))
                .limit(1);
            return section || null;
        }
        catch (error) {
            logger.error('Failed to get criminal code section by ID:', error);
            return null;
        }
    }
    async getLegalCaseById(id) {
        try {
            const [caseData] = await db
                .select()
                .from(legalCases)
                .where(eq(legalCases.id, parseInt(id)))
                .limit(1);
            return caseData || null;
        }
        catch (error) {
            logger.error('Failed to get legal case by ID:', error);
            return null;
        }
    }
}
export const legalIngestionService = new LegalIngestionService();
