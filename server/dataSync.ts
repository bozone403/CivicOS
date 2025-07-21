import { storage } from "./storage.js";
import type { InsertBill, InsertPolitician } from "../shared/schema.js";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import pino from "pino";
const logger = pino();

// Comprehensive Canadian government data sources
const DATA_SOURCES = {
  federal: {
    parliament: "https://www.ourcommons.ca/Members/en/search",
    bills: "https://www.parl.ca/LegisInfo/en/bills",
    senate: "https://sencanada.ca/en/senators",
    votes: "https://www.ourcommons.ca/Members/en/votes"
  },
  provincial: {
    ontario: "https://www.ola.org/en/members",
    quebec: "https://www.assnat.qc.ca/en/deputes",
    bc: "https://www.leg.bc.ca/learn-about-us/members",
    alberta: "https://www.assembly.ab.ca/members",
    manitoba: "https://www.gov.mb.ca/legislature/members",
    saskatchewan: "https://www.legassembly.sk.ca/mlas",
    nova_scotia: "https://nslegislature.ca/members",
    new_brunswick: "https://www.gnb.ca/legis/members",
    pei: "https://www.assembly.pe.ca/members",
    newfoundland: "https://www.assembly.nl.ca/members"
  },
  municipal: {
    toronto: "https://www.toronto.ca/city-government/council",
    vancouver: "https://vancouver.ca/your-government/city-councillors.aspx",
    montreal: "https://montreal.ca/en/topics/elected-officials",
    calgary: "https://www.calgary.ca/our-city/city-council.html",
    ottawa: "https://ottawa.ca/en/city-hall/mayor-and-city-councillors",
    edmonton: "https://www.edmonton.ca/city_government/city_organization/city-councillors"
  }
};

interface GovernmentOfficial {
  name: string;
  position: string;
  party?: string;
  jurisdiction: string;
  constituency?: string;
  level: 'Federal' | 'Provincial' | 'Municipal';
  contact?: {
    email?: string;
    phone?: string;
    office?: string;
  };
}

interface LegislativeBill {
  number: string;
  title: string;
  summary: string;
  status: string;
  jurisdiction: string;
  level: 'Federal' | 'Provincial' | 'Municipal';
  sponsor?: string;
  lastAction: string;
  votingDeadline?: Date;
}

/**
 * Automatically sync all Canadian government data
 */
export async function syncAllGovernmentData(): Promise<void> {
  logger.info({ msg: 'Starting full government data sync' });
  // Sync federal data
  await syncFederalData();
  // Sync provincial data
  await syncProvincialData();
  // Sync major municipal data
  await syncMunicipalData();
  logger.info({ msg: 'Completed full government data sync' });
}

/**
 * Sync federal government data
 */
async function syncFederalData(): Promise<void> {
  logger.info({ msg: 'Syncing federal MPs' });
  const mps = await scrapeFederalMPs();
  logger.info({ msg: 'Scraped federal MPs', count: mps.length });
  logger.info({ msg: 'Syncing senators' });
  const senators = await scrapeSenators();
  logger.info({ msg: 'Scraped senators', count: senators.length });
  logger.info({ msg: 'Syncing federal bills' });
  const bills = await scrapeFederalBills();
  logger.info({ msg: 'Scraped federal bills', count: bills.length });
  for (const official of [...mps, ...senators]) {
    await storeOfficial(official);
  }
  for (const bill of bills) {
    await storeBill(bill);
  }
}

/**
 * Sync provincial government data
 */
async function syncProvincialData(): Promise<void> {
  logger.info({ msg: 'Syncing provincial officials' });
  const provinces = Object.keys(DATA_SOURCES.provincial);
  for (const province of provinces) {
    const officials = await scrapeProvincialOfficials(province);
    logger.info({ msg: 'Scraped provincial officials', province, count: officials.length });
    for (const official of officials) {
      await storeOfficial(official);
    }
  }
}

/**
 * Sync municipal government data
 */
async function syncMunicipalData(): Promise<void> {
  logger.info({ msg: 'Syncing municipal officials' });
  const cities = Object.keys(DATA_SOURCES.municipal);
  for (const city of cities) {
    const officials = await scrapeMunicipalOfficials(city);
    logger.info({ msg: 'Scraped municipal officials', city, count: officials.length });
    for (const official of officials) {
      await storeOfficial(official);
    }
  }
}

/**
 * Scrape federal MPs
 */
async function scrapeFederalMPs(): Promise<GovernmentOfficial[]> {
  const response = await fetch(DATA_SOURCES.federal.parliament);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const officials: GovernmentOfficial[] = [];
  
  $('.mp-card, .member-card, .member-item, tr').each((_, element) => {
    const $element = $(element);
    const text = $element.text();
    
    if (text.includes('Liberal') || text.includes('Conservative') || text.includes('NDP') || text.includes('Bloc')) {
      const name = $element.find('a, .name, .member-name').first().text().trim();
      const party = text.match(/(Liberal|Conservative|NDP|Bloc|Green)/)?.[0] || '';
      const constituency = $element.find('.constituency, .riding').first().text().trim();
      
      if (name && party) {
        officials.push({
          name,
          position: 'Member of Parliament',
          party,
          jurisdiction: 'Canada',
          constituency,
          level: 'Federal'
        });
      }
    }
  });
  
  return officials;
}

/**
 * Scrape senators
 */
async function scrapeSenators(): Promise<GovernmentOfficial[]> {
  try {
    const response = await fetch(DATA_SOURCES.federal.senate);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const officials: GovernmentOfficial[] = [];
    
    $('.senator, .member').each((_, element) => {
      const $element = $(element);
      const name = $element.find('.name, h3, h4').first().text().trim();
      const province = $element.find('.province, .region').first().text().trim();
      
      if (name) {
        officials.push({
          name,
          position: 'Senator',
          jurisdiction: province || 'Canada',
          level: 'Federal'
        });
      }
    });
    
    return officials;
  } catch (error) {
    return [];
  }
}

/**
 * Scrape federal bills
 */
async function scrapeFederalBills(): Promise<LegislativeBill[]> {
  try {
    const response = await fetch(DATA_SOURCES.federal.bills);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const bills: LegislativeBill[] = [];
    
    $('*').each((_, element) => {
      const text = $(element).text();
      const billMatch = text.match(/([CS]-\d+)/g);
      
      if (billMatch) {
        billMatch.forEach(billNumber => {
          if (!bills.find(b => b.number === billNumber)) {
            const title = text.substring(text.indexOf(billNumber) + billNumber.length, text.indexOf(billNumber) + billNumber.length + 100).trim();
            
            if (title) {
              bills.push({
                number: billNumber,
                title,
                summary: title,
                status: 'Active',
                jurisdiction: 'Canada',
                level: 'Federal',
                lastAction: new Date().toISOString()
              });
            }
          }
        });
      }
    });
    
    return bills;
  } catch (error) {
    return [];
  }
}

/**
 * Scrape provincial officials
 */
async function scrapeProvincialOfficials(province: string): Promise<GovernmentOfficial[]> {
  const url = DATA_SOURCES.provincial[province as keyof typeof DATA_SOURCES.provincial];
  if (!url) return [];
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const officials: GovernmentOfficial[] = [];
    
    $('.member, .mpp, .mla, .deputy, tr').each((_, element) => {
      const $element = $(element);
      const name = $element.find('a, .name, h3, h4').first().text().trim();
      const party = $element.find('.party').first().text().trim();
      const constituency = $element.find('.riding, .constituency').first().text().trim();
      
      if (name) {
        officials.push({
          name,
          position: getProvincialTitle(province),
          party,
          jurisdiction: getProvinceName(province),
          constituency,
          level: 'Provincial'
        });
      }
    });
    
    return officials;
  } catch (error) {
    return [];
  }
}

/**
 * Scrape municipal officials
 */
async function scrapeMunicipalOfficials(city: string): Promise<GovernmentOfficial[]> {
  const url = DATA_SOURCES.municipal[city as keyof typeof DATA_SOURCES.municipal];
  if (!url) return [];
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const officials: GovernmentOfficial[] = [];
    
    $('.councillor, .member, .mayor, tr').each((_, element) => {
      const $element = $(element);
      const name = $element.find('a, .name, h3, h4').first().text().trim();
      const ward = $element.find('.ward, .district').first().text().trim();
      
      if (name) {
        officials.push({
          name,
          position: name.toLowerCase().includes('mayor') ? 'Mayor' : 'City Councillor',
          jurisdiction: getCityName(city),
          constituency: ward,
          level: 'Municipal'
        });
      }
    });
    
    return officials;
  } catch (error) {
    return [];
  }
}

/**
 * Store official in database
 */
async function storeOfficial(official: GovernmentOfficial): Promise<void> {
  try {
    const politicianData: InsertPolitician = {
      name: official.name,
      position: official.position,
      party: official.party || '',
      jurisdiction: official.jurisdiction,
      constituency: official.constituency || '',
      trustScore: calculateInitialTrustScore(official)
    };
    await storage.createPolitician(politicianData);
    logger.info({ msg: 'Stored politician', name: official.name, position: official.position, jurisdiction: official.jurisdiction });
  } catch (error) {
    const err = error as any;
    if (!err.message?.includes('duplicate') && !err.message?.includes('unique constraint')) {
      logger.error({ msg: 'Error storing official', name: official.name, error: err });
    } else {
      logger.info({ msg: 'Duplicate politician not stored', name: official.name });
    }
  }
}

/**
 * Store bill in database
 */
async function storeBill(bill: LegislativeBill): Promise<void> {
  try {
    const billData: InsertBill = {
      billNumber: bill.number,
      title: bill.title,
      description: bill.summary,
      fullText: "",
      category: inferCategory(bill.title),
      jurisdiction: bill.jurisdiction,
      status: bill.status,
      votingDeadline: bill.votingDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    await storage.createBill(billData);
  } catch (error) {
    if (!(error as Error).message?.includes('duplicate')) {
      console.error('Error storing bill:', error);
    }
  }
}

/**
 * Helper functions
 */
function getProvincialTitle(province: string): string {
  const titles: Record<string, string> = {
    ontario: 'Member of Provincial Parliament',
    quebec: 'Member of National Assembly',
    bc: 'Member of Legislative Assembly',
    alberta: 'Member of Legislative Assembly',
    manitoba: 'Member of Legislative Assembly',
    saskatchewan: 'Member of Legislative Assembly',
    nova_scotia: 'Member of Legislative Assembly',
    new_brunswick: 'Member of Legislative Assembly',
    pei: 'Member of Legislative Assembly',
    newfoundland: 'Member of House of Assembly'
  };
  return titles[province] || 'Provincial Representative';
}

function getProvinceName(province: string): string {
  const names: Record<string, string> = {
    ontario: 'Ontario',
    quebec: 'Quebec',
    bc: 'British Columbia',
    alberta: 'Alberta',
    manitoba: 'Manitoba',
    saskatchewan: 'Saskatchewan',
    nova_scotia: 'Nova Scotia',
    new_brunswick: 'New Brunswick',
    pei: 'Prince Edward Island',
    newfoundland: 'Newfoundland and Labrador'
  };
  return names[province] || province;
}

function getCityName(city: string): string {
  const names: Record<string, string> = {
    toronto: 'Toronto',
    vancouver: 'Vancouver',
    montreal: 'Montreal',
    calgary: 'Calgary',
    ottawa: 'Ottawa',
    edmonton: 'Edmonton'
  };
  return names[city] || city;
}

function inferCategory(title: string): string {
  const text = title.toLowerCase();
  
  if (text.includes('budget') || text.includes('tax') || text.includes('economic')) {
    return 'Finance & Economy';
  } else if (text.includes('health') || text.includes('medical')) {
    return 'Healthcare';
  } else if (text.includes('environment') || text.includes('climate')) {
    return 'Environment';
  } else if (text.includes('education') || text.includes('school')) {
    return 'Education';
  } else if (text.includes('defence') || text.includes('security')) {
    return 'Defence & Security';
  } else if (text.includes('transport') || text.includes('infrastructure')) {
    return 'Infrastructure';
  } else {
    return 'General Legislation';
  }
}

function calculateInitialTrustScore(official: GovernmentOfficial): string {
  // Calculate initial trust score based on various factors
  let baseScore = 75.0;
  
  // Adjust based on position level
  if (official.level === 'Federal') {
    baseScore += 5; // Federal positions get slight boost
  } else if (official.level === 'Municipal') {
    baseScore += 2; // Municipal positions are closer to constituents
  }
  
  // Adjust based on position type
  if (official.position.includes('Prime Minister') || official.position.includes('Premier') || official.position.includes('Mayor')) {
    baseScore += 10; // Leadership positions
  } else if (official.position.includes('Minister') || official.position.includes('Speaker')) {
    baseScore += 5; // Senior positions
  }
  
  // Add small random variation to make it realistic
  const variation = (Math.random() - 0.5) * 10;
  const finalScore = Math.max(50, Math.min(95, baseScore + variation));
  
  return finalScore.toFixed(2);
}

/**
 * Initialize automatic data sync on server start
 */
export function initializeDataSync(): void {
  
  // Run initial sync
  syncAllGovernmentData().catch(error => {
    console.error("Initial data sync failed:", error instanceof Error ? error : String(error));
  });
  
  // Set up periodic sync (every 24 hours)
  setInterval(() => {
    syncAllGovernmentData().catch(error => {
      console.error("Scheduled data sync failed:", error instanceof Error ? error : String(error));
    });
  }, 24 * 60 * 60 * 1000); // 24 hours
}