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

// On-demand: resolve a federal act by title from Justice Laws, fetch detail page, return content and cache
export async function resolveFederalActDetailByTitle(titleQuery: string): Promise<{ title: string; url?: string; html?: string; text?: string }> {
  const indexUrl = 'https://laws-lois.justice.gc.ca/eng/acts/';
  const html = await (await fetch(indexUrl)).text();
  const $ = (cheerio as any).load(html);
  const q = titleQuery.trim().toLowerCase();
  let actUrl: string | undefined;
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const t = $(el).text().trim().toLowerCase();
    if (!actUrl && /^eng\/acts\//.test(href) && t.includes(q)) {
      actUrl = new URL(href, indexUrl).toString();
    }
  });
  if (!actUrl) return { title: titleQuery };
  const page = await (await fetch(actUrl)).text();
  const $p = (cheerio as any).load(page);
  const main = $p('#wb-main, main, body').first();
  const text = main.text().replace(/\s+/g, ' ').trim();
  // Cache best-effort into DB by title
  try {
    const existing = await db.select().from(legalActs).where((legalActs.title as any).eq(titleQuery as any)).limit(1);
    if (existing.length) {
      await db.update(legalActs).set({ fullText: text, updatedAt: new Date() } as any).where((legalActs.id as any).eq((existing[0] as any).id));
    }
  } catch {}
  return { title: titleQuery, url: actUrl, html: undefined, text };
}

// On-demand: fetch Criminal Code section content by section number (e.g., "83.01")
export async function fetchCriminalCodeSectionDetail(sectionNumber: string): Promise<{ section: string; url?: string; text?: string }> {
  const baseUrl = 'https://laws-lois.justice.gc.ca/eng/acts/C-46/';
  const page = await (await fetch(baseUrl)).text();
  const $ = (cheerio as any).load(page);
  // Attempt to find an anchor or heading containing the section number
  let text: string | undefined;
  const sec = sectionNumber.trim();
  const candidates: any[] = [];
  $('*:contains("' + sec + '")').each((_, el) => {
    const t = $(el).text();
    if (t && t.includes(sec)) candidates.push($(el));
  });
  if (candidates.length) {
    // Take the first candidate's parent block text as a rough section content
    const block = candidates[0].closest('section, article, div');
    text = (block.length ? block : candidates[0]).text().replace(/\s+/g, ' ').trim();
  }
  return { section: sectionNumber, url: baseUrl, text };
}


