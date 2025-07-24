import { scrapeCurrentMPs, scrapeFederalBills } from '../dist/server/scrapers.js';

async function testScrapers() {
  // console.log removed for production
  
  try {
    // console.log removed for production
    const mps = await scrapeCurrentMPs();
    console.log(`Found ${mps.length} politicians:`, mps.slice(0, 3));
    
    // console.log removed for production
    const bills = await scrapeFederalBills();
    console.log(`Found ${bills.length} bills:`, bills.slice(0, 3));
    
  } catch (error) {
    // console.error removed for production
  }
}

testScrapers(); 