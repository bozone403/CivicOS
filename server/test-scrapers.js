import 'dotenv/config';
import { scrapeCurrentMPs, scrapeFederalBills } from '../dist/server/scrapers.js';

async function testScrapers() {
  console.log('Testing scrapers...');
  
  try {
    console.log('Testing politician scraper...');
    const mps = await scrapeCurrentMPs();
    console.log(`Found ${mps.length} politicians:`, mps.slice(0, 3));
    
    console.log('Testing bill scraper...');
    const bills = await scrapeFederalBills();
    console.log(`Found ${bills.length} bills:`, bills.slice(0, 3));
    
  } catch (error) {
    console.error('Scraper test failed:', error);
  }
}

testScrapers(); 