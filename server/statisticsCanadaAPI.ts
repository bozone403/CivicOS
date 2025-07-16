import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Statistics Canada API Integration
 * Official API: https://www.statcan.gc.ca/en/developers
 */
export class StatisticsCanadaAPI {
  private baseURL = 'https://www150.statcan.gc.ca/t1/wds/rest';

  /**
   * Fetch population demographics by electoral district
   */
  async fetchPopulationData() {
    try {
      // Population estimates by electoral district
      const response = await fetch(`${this.baseURL}/getDataFromVectorsAndLatestNPeriods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vectorIds: ['17100005'], // Population estimates
          latestN: 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`Statistics Canada API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      return data;
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch electoral district demographic data
   */
  async fetchElectoralDemographics() {
    try {
      const response = await fetch(`${this.baseURL}/getSeriesInfoFromVector`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vectorId: '17100005'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch government expenditure data
   */
  async fetchGovernmentSpending() {
    try {
      const response = await fetch(`${this.baseURL}/getDataFromVectorsAndLatestNPeriods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vectorIds: ['10100001'], // Government expenditure
          latestN: 5
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Store demographic data for electoral analysis
   */
  private async storeDemographicData(data: any) {
    try {
      for (const item of data) {
        await db.execute(sql`
          INSERT INTO demographics (
            electoral_district, population, data_source, reference_date
          ) VALUES (
            ${item.geoLevel}, ${item.value}, 'Statistics Canada', ${item.refPer}
          )
          ON CONFLICT (electoral_district, reference_date) DO UPDATE SET
            population = EXCLUDED.population,
            updated_at = NOW()
        `);
      }
    } catch (error) {
      // console.error("Error storing demographic data:", error);
    }
  }

  /**
   * Comprehensive Statistics Canada data sync
   */
  async performStatCanSync() {
    
    const [population, demographics, spending] = await Promise.allSettled([
      this.fetchPopulationData(),
      this.fetchElectoralDemographics(),
      this.fetchGovernmentSpending()
    ]);
    
    // Store population data if available
    if (population.status === 'fulfilled' && population.value.length > 0) {
      await this.storeDemographicData(population.value);
    }
    
    return {
      population: population.status === 'fulfilled' ? population.value.length : 0,
      demographics: demographics.status === 'fulfilled' ? 1 : 0,
      spending: spending.status === 'fulfilled' ? spending.value.length : 0
    };
  }
}

export const statisticsCanadaAPI = new StatisticsCanadaAPI();