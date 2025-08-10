import { db } from '../db.js';
import { legalActs, legalCases } from '../../shared/schema.js';
import * as cheerio from 'cheerio';

type CuratedAct = { title: string; actNumber?: string; summary?: string; jurisdiction?: string; fullText?: string };
type CuratedCase = { caseNumber: string; title: string; description?: string; jurisdiction?: string; status?: string };

export async function ingestLegalActsCurated(acts: CuratedAct[]): Promise<number> {
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

export async function ingestLegalCasesCurated(casesIn: CuratedCase[]): Promise<number> {
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

// Fetch federal acts list from laws-lois (Justice Laws Website) index pages (best-effort)
export async function ingestFederalActsFromJustice(): Promise<number> {
  try {
    const indexUrl = 'https://laws-lois.justice.gc.ca/eng/acts/';
    const html = await (await fetch(indexUrl)).text();
    const $ = (cheerio as any).load(html);
    let inserted = 0;
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/^eng\/acts\//.test(href) && text.length > 2) {
        const title = text;
        // Attempt to infer act number/year if present in text
        const actNumber = undefined;
        db.insert(legalActs).values({ title, actNumber: actNumber || null, jurisdiction: 'federal' }).onConflictDoNothing().execute().then(() => inserted++).catch(() => undefined);
      }
    });
    return inserted;
  } catch {
    return 0;
  }
}

// Fetch Criminal Code sections index page as a fallback to populate key sections
export async function ingestCriminalCodeFromJustice(): Promise<number> {
  try {
    const url = 'https://laws-lois.justice.gc.ca/eng/acts/C-46/';
    const html = await (await fetch(url)).text();
    const $ = (cheerio as any).load(html);
    let inserted = 0;
    $('a').each((_, el) => {
      const text = $(el).text().trim();
      const secMatch = text.match(/^(\d+[\w\.-]*)\s+-\s+(.*)$/);
      if (secMatch) {
        const sectionNumber = secMatch[1];
        const title = secMatch[2];
        db.insert(legalActs).values({ title: `Criminal Code s. ${sectionNumber} — ${title}`, actNumber: sectionNumber, jurisdiction: 'federal' }).onConflictDoNothing().execute().then(() => inserted++).catch(() => undefined);
      }
    });
    return inserted;
  } catch {
    return 0;
  }
}


