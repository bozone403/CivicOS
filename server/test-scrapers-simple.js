import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Simple test of the scraping logic without database dependencies
async function testPoliticianScraping() {
  // console.log removed for production
  
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
      
      // console.log removed for production
      
      if (politicians.length > 0) {
        // console.log removed for production
      }
    } else {
      // console.log removed for production
    }
  } catch (error) {
    // console.error removed for production
  }
}

async function testBillScraping() {
  // console.log removed for production
  
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
      
      // console.log removed for production
      
      if (bills.length > 0) {
        // console.log removed for production
      }
    } else {
      // console.log removed for production
    }
  } catch (error) {
    // console.error removed for production
  }
}

async function testNewsScraping() {
  // console.log removed for production
  
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
      
      // console.log removed for production
      
      if (articles.length > 0) {
        // console.log removed for production
      }
    } else {
      // console.log removed for production
    }
  } catch (error) {
    // console.error removed for production
  }
}

async function runTests() {
  // console.log removed for production
  
  await testPoliticianScraping();
  // console.log removed for production
  await testBillScraping();
  // console.log removed for production
  await testNewsScraping();
  
  // console.log removed for production
}

runTests(); 