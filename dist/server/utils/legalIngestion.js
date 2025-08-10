import { db } from '../db.js';
import { legalActs, legalCases } from '../../shared/schema.js';
export async function ingestLegalActsCurated(acts) {
    let inserted = 0;
    for (const act of acts) {
        await db.insert(legalActs).values({
            title: act.title,
            actNumber: act.actNumber || null,
            summary: act.summary || null,
            jurisdiction: act.jurisdiction || 'federal',
            fullText: act.fullText || null,
        });
        inserted++;
    }
    return inserted;
}
export async function ingestLegalCasesCurated(casesIn) {
    let inserted = 0;
    for (const c of casesIn) {
        await db.insert(legalCases).values({
            caseNumber: c.caseNumber,
            title: c.title,
            description: c.description || null,
            jurisdiction: c.jurisdiction || 'federal',
            status: c.status || null,
        });
        inserted++;
    }
    return inserted;
}
