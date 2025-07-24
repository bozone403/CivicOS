import { db } from "./db.js";
import { sql } from "drizzle-orm";
import * as cheerio from "cheerio";
import pino from "pino";
const logger = pino();

/**
 * Parliament of Canada Open Data Integration
 * Uses official Parliament API endpoints and structured data feeds
 */
export class ParliamentAPIService {
  
  /**
   * Fetch current MPs from Parliament of Canada official source
   */
  async fetchCurrentMPs() {
    try {
      
      // Parliament's official MP listing
      const response = await fetch('https://www.ourcommons.ca/members/en/search', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Parliament API returned ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const mps: Array<{
        name: string;
        party: string;
        constituency: string;
        email?: string;
        phone?: string;
        website?: string;
        province?: string;
        position?: string;
        level?: string;
        jurisdiction?: string;
        source?: string;
      }> = [];
      
      // Parse MP data from official Parliament structure
      $('.ce-mip-mp-tile').each((index, element) => {
        const $mp = $(element);
        
        const name = $mp.find('.ce-mip-mp-name').text().trim();
        const party = $mp.find('.ce-mip-mp-party').text().trim();
        const constituency = $mp.find('.ce-mip-mp-constituency').text().trim();
        const province = $mp.find('.ce-mip-mp-province').text().trim();
        
        if (name && party && constituency) {
          mps.push({
            name,
            party,
            constituency,
            province,
            position: 'Member of Parliament',
            level: 'federal',
            jurisdiction: province || 'Federal',
            source: 'Parliament of Canada Official'
          });
        }
      });
      
      // Store authentic MP data
      for (const mp of mps) {
        await this.storeMPData(mp);
      }
      
      return mps;
    } catch (error) {
      logger.error({ msg: 'Error fetching Parliament MPs', error });
      return [];
    }
  }

  /**
   * Fetch federal bills from LEGISinfo
   */
  async fetchFederalBills() {
    try {
      
      const response = await fetch('https://www.parl.ca/legisinfo/en/bills/current-session', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`LEGISinfo returned ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const bills: Array<{
        billNumber: string;
        title: string;
        status: string;
        sponsor: string;
        summary?: string;
        jurisdiction?: string;
        source?: string;
      }> = [];
      
      // Parse bill data from LEGISinfo structure
      $('.bill-item').each((index, element) => {
        const $bill = $(element);
        
        const title = $bill.find('.bill-title').text().trim();
        const number = $bill.find('.bill-number').text().trim();
        const status = $bill.find('.bill-status').text().trim();
        const summary = $bill.find('.bill-summary').text().trim();
        
        if (title && number) {
          bills.push({
            title,
            billNumber: number,
            status: status.toLowerCase(),
            sponsor: 'Unknown', // Default sponsor since not available in scraping
            summary,
            jurisdiction: 'federal',
            source: 'LEGISinfo Official'
          });
        }
      });
      
      // Store authentic bill data
      for (const bill of bills) {
        await this.storeBillData(bill);
      }
      
      return bills;
    } catch (error) {
      logger.error({ msg: 'Error fetching federal bills', error });
      return [];
    }
  }

  /**
   * Store authentic MP data from Parliament source
   */
  private async storeMPData(mpData: any) {
    try {
      await db.execute(sql`
        INSERT INTO politicians (
          name, position, party, jurisdiction, constituency, level
        ) VALUES (
          ${mpData.name}, ${mpData.position}, ${mpData.party}, 
          ${mpData.jurisdiction}, ${mpData.constituency}, ${mpData.level}
        )
        ON CONFLICT (name, jurisdiction) DO UPDATE SET
          position = EXCLUDED.position,
          party = EXCLUDED.party,
          constituency = EXCLUDED.constituency,
          level = EXCLUDED.level,
          updated_at = NOW()
      `);
      
      logger.info({ 
        msg: "Stored politician", 
        name: mpData.name, 
        position: mpData.position, 
        jurisdiction: mpData.jurisdiction 
      });
    } catch (error) {
      logger.error({ msg: 'Error storing MP data', error });
    }
  }

  /**
   * Store authentic bill data from LEGISinfo
   */
  private async storeBillData(billData: any) {
    try {
      await db.execute(sql`
        INSERT INTO bills (
          title, "billNumber", status, description, jurisdiction
        ) VALUES (
          ${billData.title}, ${billData.billNumber}, ${billData.status},
          ${billData.summary}, ${billData.jurisdiction}
        )
        ON CONFLICT ("billNumber") DO UPDATE SET
          status = EXCLUDED.status,
          description = EXCLUDED.description,
          updated_at = NOW()
      `);
      
      logger.info({ 
        msg: "Stored bill", 
        billNumber: billData.billNumber, 
        title: billData.title 
      });
    } catch (error) {
      logger.error({ msg: 'Error storing bill data', error });
    }
  }

  /**
   * Comprehensive Parliament data sync
   */
  async performParliamentSync() {
    
    const [mps, bills] = await Promise.allSettled([
      this.fetchCurrentMPs(),
      this.fetchFederalBills()
    ]);
    
    return {
      mps: mps.status === 'fulfilled' ? mps.value.length : 0,
      bills: bills.status === 'fulfilled' ? bills.value.length : 0
    };
  }
}

export const parliamentAPI = new ParliamentAPIService();