import * as cheerio from 'cheerio';
import { db } from '../db.js';
import { politicians } from '../../shared/schema.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

type ProvinceKey = 'ontario' | 'quebec' | 'bc' | 'alberta' | 'manitoba' | 'saskatchewan' | 'nova_scotia' | 'new_brunswick' | 'pei' | 'newfoundland' | 'yukon' | 'nunavut' | 'nwt';

const PROVINCIAL_SOURCES: Record<ProvinceKey, string> = {
  ontario: 'https://www.ola.org/en/members',
  quebec: 'https://www.assnat.qc.ca/en/deputes',
  bc: 'https://www.leg.bc.ca/learn-about-us/members',
  alberta: 'https://www.assembly.ab.ca/members',
  manitoba: 'https://www.gov.mb.ca/legislature/members',
  saskatchewan: 'https://www.legassembly.sk.ca/mlas',
  nova_scotia: 'https://nslegislature.ca/members',
  new_brunswick: 'https://www.gnb.ca/legis/members',
  pei: 'https://www.assembly.pe.ca/members',
  newfoundland: 'https://www.assembly.nl.ca/members',
  yukon: 'https://yukonassembly.ca/members',
  nunavut: 'https://www.assembly.nu.ca/members',
  nwt: 'https://www.assembly.gov.nt.ca/members',
};

const BUILT_IN_MUNICIPAL_SOURCES: Record<string, string> = {
  'Toronto, Ontario': 'https://www.toronto.ca/city-government/council',
  'Vancouver, British Columbia': 'https://vancouver.ca/your-government/city-councillors.aspx',
  'Montreal, Quebec': 'https://montreal.ca/en/topics/elected-officials',
  'Calgary, Alberta': 'https://www.calgary.ca/our-city/city-council.html',
  'Ottawa, Ontario': 'https://ottawa.ca/en/city-hall/mayor-and-council',
  'Edmonton, Alberta': 'https://www.edmonton.ca/city_government/city_organization/city-councillors',
  'Edson, Alberta': 'https://www.edson.ca/town/town-council',
};

export function loadMunicipalCatalog(): Record<string, string> {
  try {
    const dataUrl = new URL('../../data/municipal_sources.json', import.meta.url);
    const fsPath = dataUrl.pathname;
    if (existsSync(fsPath)) {
      const raw = readFileSync(fsPath, 'utf8');
      const arr = JSON.parse(raw) as Array<{ city: string; province: string; url: string }>;
      const map: Record<string, string> = {};
      for (const e of arr) {
        const key = `${e.city}, ${e.province}`;
        map[key] = e.url;
      }
      return { ...BUILT_IN_MUNICIPAL_SOURCES, ...map };
    }
  } catch {}
  return { ...BUILT_IN_MUNICIPAL_SOURCES };
}

export function saveMunicipalCatalog(entries: Array<{ city: string; province: string; url: string }>): void {
  const dataUrl = new URL('../../data/municipal_sources.json', import.meta.url);
  const fsPath = dataUrl.pathname;
  try { mkdirSync(fsPath.replace(/\/municipal_sources\.json$/, ''), { recursive: true }); } catch {}
  writeFileSync(fsPath, JSON.stringify(entries, null, 2), 'utf8');
}

export async function ingestProvincialIncumbents(provinceInput?: string): Promise<{ inserted: number; updated: number }> {
  const provinces: ProvinceKey[] = provinceInput
    ? (Object.keys(PROVINCIAL_SOURCES).filter(k => k.includes(provinceInput.toLowerCase())) as ProvinceKey[])
    : (Object.keys(PROVINCIAL_SOURCES) as ProvinceKey[]);

  let inserted = 0;
  let updated = 0;

  for (const key of provinces) {
    const url = PROVINCIAL_SOURCES[key];
    try {
      const html = await (await fetch(url)).text();
      const $ = cheerio.load(html);
      const jurisdiction = toProvinceName(key);
      $('*').each((_i: number, el: any) => {
        const $el = $(el);
        const text = $el.text().trim();
        const name = $el.find('a, .name, h3, h4').first().text().trim() || (/([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/.exec(text)?.[0] || '');
        const party = $el.find('.party').first().text().trim() || '';
        const constituency = $el.find('.constituency, .riding, .district, .ward').first().text().trim() || '';
        if (name && likelyPersonName(name)) {
          const vals: any = {
            name,
            party: party || null,
            position: getProvincialTitle(key),
            constituency: constituency || null,
            level: 'Provincial',
            jurisdiction,
            isIncumbent: true,
            updatedAt: new Date(),
          };
          db.insert(politicians).values(vals).onConflictDoNothing().returning().then(([row]) => {
            if (row) inserted++; else updated++;
          }).catch(async () => {
            try { await db.update(politicians).set(vals).where((politicians.name as any).eq(name as any)); updated++; } catch {}
          });
        }
      });
    } catch {}
  }
  return { inserted, updated };
}

export async function ingestMunicipalIncumbents(targets?: Array<{ city: string; province: string }>): Promise<{ inserted: number; updated: number }> {
  const catalog = loadMunicipalCatalog();
  const entries = targets && targets.length
    ? targets.map(t => `${t.city}, ${t.province}`)
    : Object.keys(catalog);

  let inserted = 0;
  let updated = 0;

  for (const key of entries) {
    const url = catalog[key];
    if (!url) continue;
    try {
      const html = await (await fetch(url)).text();
      const $ = cheerio.load(html);
      const [city, province] = key.split(',').map(s => s.trim());
      $('*').each((_i: number, el: any) => {
        const $el = $(el);
        const text = $el.text().trim();
        const name = $el.find('a, .name, h3, h4').first().text().trim() || (/([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/.exec(text)?.[0] || '');
        const isMayor = /mayor/i.test(text) || /mayor/i.test($el.attr('class') || '');
        if (name && likelyPersonName(name)) {
          const vals: any = {
            name,
            party: null,
            position: isMayor ? 'Mayor' : 'City Councillor',
            constituency: city,
            level: 'Municipal',
            jurisdiction: `${city}, ${province}`,
            isIncumbent: true,
            updatedAt: new Date(),
          };
          db.insert(politicians).values(vals).onConflictDoNothing().returning().then(([row]) => {
            if (row) inserted++; else updated++;
          }).catch(async () => {
            try { await db.update(politicians).set(vals).where((politicians.name as any).eq(name as any)); updated++; } catch {}
          });
        }
      });
    } catch {}
  }
  return { inserted, updated };
}

function toProvinceName(key: ProvinceKey): string {
  const map: Record<ProvinceKey, string> = {
    ontario: 'Ontario',
    quebec: 'Quebec',
    bc: 'British Columbia',
    alberta: 'Alberta',
    manitoba: 'Manitoba',
    saskatchewan: 'Saskatchewan',
    nova_scotia: 'Nova Scotia',
    new_brunswick: 'New Brunswick',
    pei: 'Prince Edward Island',
    newfoundland: 'Newfoundland and Labrador',
    yukon: 'Yukon',
    nunavut: 'Nunavut',
    nwt: 'Northwest Territories',
  };
  return map[key];
}

function getProvincialTitle(key: ProvinceKey): string {
  const map: Record<ProvinceKey, string> = {
    ontario: 'Member of Provincial Parliament',
    quebec: 'Member of National Assembly',
    bc: 'Member of Legislative Assembly',
    alberta: 'Member of Legislative Assembly',
    manitoba: 'Member of Legislative Assembly',
    saskatchewan: 'Member of Legislative Assembly',
    nova_scotia: 'Member of Legislative Assembly',
    new_brunswick: 'Member of Legislative Assembly',
    pei: 'Member of Legislative Assembly',
    newfoundland: 'Member of House of Assembly',
    yukon: 'Member of Legislative Assembly',
    nunavut: 'Member of Legislative Assembly',
    nwt: 'Member of Legislative Assembly',
  };
  return map[key];
}

function likelyPersonName(name: string): boolean {
  return /[A-Za-z][a-z]+\s+[A-Za-z][a-z]+/.test(name) && name.length < 60;
}


