import 'dotenv/config';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Simple test of the scraping logic without database dependencies
async function testPoliticianScraping() {
  console.log('Testing politician scraping logic...');
  
  try {
    // Test Parliament of Canada website
    const response = await fetch('https://www.ourcommons.ca/members/en', {
      headers: {
        'User-Agent': 'CivicOS-DataCollector/1.0 (Government Transparency Platform)',
        'Accept': 'text/html'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const politicians = [];
      $('.member-card, .mp-profile, .member-listing').each((_, element) => {
        const $member = $(element);
        const name = $member.find('.name, .member-name, h3').first().text().trim();
        const party = $member.find('.party, .member-party').first().text().trim();
        const constituency = $member.find('.constituency, .riding').first().text().trim();
        
        if (name) {
          politicians.push({
            name,
            party,
            constituency
          });
        }
      });
      
      console.log(`Found ${politicians.length} politicians from Parliament website`);
      
      if (politicians.length > 0) {
        console.log('Sample politician:', politicians[0]);
      }
    } else {
      console.log('Parliament website failed:', response.status);
    }
  } catch (error) {
    console.error('Politician scraping test failed:', error.message);
  }
}

async function testBillScraping() {
  console.log('Testing bill scraping logic...');
  
  try {
    // Test Parliament of Canada bills page
    const response = await fetch('https://www.parl.ca/LegisInfo/en/bills', {
      headers: {
        'User-Agent': 'CivicOS-DataCollector/1.0 (Government Transparency Platform)',
        'Accept': 'text/html'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const bills = [];
      $('a[href*="/bills/"]').each((_, element) => {
        const $link = $(element);
        const title = $link.text().trim();
        const href = $link.attr('href');
        
        if (title && href) {
          bills.push({
            title,
            url: href
          });
        }
      });
      
      console.log(`Found ${bills.length} bills from Parliament bills page`);
      
      if (bills.length > 0) {
        console.log('Sample bill:', bills[0]);
      }
    } else {
      console.log('Parliament bills page failed:', response.status);
    }
  } catch (error) {
    console.error('Bill scraping test failed:', error.message);
  }
}

async function testNewsScraping() {
  console.log('Testing news scraping logic...');
  
  try {
    // Test CBC News
    const response = await fetch('https://www.cbc.ca/news/politics', {
      headers: {
        'User-Agent': 'CivicOS-DataCollector/1.0 (Government Transparency Platform)',
        'Accept': 'text/html'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const articles = [];
      $('a[href*="/news/"]').each((_, element) => {
        const $link = $(element);
        const title = $link.text().trim();
        const href = $link.attr('href');
        
        if (title && href && title.length > 20) {
          articles.push({
            title,
            url: href.startsWith('http') ? href : `https://www.cbc.ca${href}`
          });
        }
      });
      
      console.log(`Found ${articles.length} articles from CBC News`);
      
      if (articles.length > 0) {
        console.log('Sample article:', articles[0]);
      }
    } else {
      console.log('CBC News failed:', response.status);
    }
  } catch (error) {
    console.error('News scraping test failed:', error.message);
  }
}

async function runTests() {
  console.log('=== Testing Scrapers ===\n');
  
  await testPoliticianScraping();
  console.log('');
  await testBillScraping();
  console.log('');
  await testNewsScraping();
  
  console.log('\n=== Test Complete ===');
}

runTests(); 