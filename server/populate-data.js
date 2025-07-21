import { storage } from '../dist/server/storage.js';
import { scrapeCurrentMPs, scrapeFederalBills } from '../dist/server/scrapers.js';

async function populatePoliticians() {
  console.log('Populating politicians...');
  
  try {
    // Try to scrape real data
    const scrapedMPs = await scrapeCurrentMPs();
    console.log(`Scraped ${scrapedMPs.length} politicians`);
    
    // Add fallback data if scraping didn't work well
    const fallbackPoliticians = [
      {
        name: "Justin Trudeau",
        party: "Liberal",
        constituency: "Papineau",
        province: "Quebec",
        email: "justin.trudeau@parl.gc.ca",
        website: "https://www.ourcommons.ca/members/en/justin-trudeau",
        position: "Prime Minister",
        trustScore: 85.5
      },
      {
        name: "Pierre Poilievre",
        party: "Conservative",
        constituency: "Carleton",
        province: "Ontario",
        email: "pierre.poilievre@parl.gc.ca",
        website: "https://www.ourcommons.ca/members/en/pierre-poilievre",
        position: "Leader of the Opposition",
        trustScore: 78.2
      },
      {
        name: "Jagmeet Singh",
        party: "NDP",
        constituency: "Burnaby South",
        province: "British Columbia",
        email: "jagmeet.singh@parl.gc.ca",
        website: "https://www.ourcommons.ca/members/en/jagmeet-singh",
        position: "NDP Leader",
        trustScore: 72.8
      },
      {
        name: "Yves-François Blanchet",
        party: "Bloc Québécois",
        constituency: "Beloeil—Chambly",
        province: "Quebec",
        email: "yves-francois.blanchet@parl.gc.ca",
        website: "https://www.ourcommons.ca/members/en/yves-francois-blanchet",
        position: "Bloc Québécois Leader",
        trustScore: 81.3
      },
      {
        name: "Chrystia Freeland",
        party: "Liberal",
        constituency: "University—Rosedale",
        province: "Ontario",
        email: "chrystia.freeland@parl.gc.ca",
        website: "https://www.ourcommons.ca/members/en/chrystia-freeland",
        position: "Deputy Prime Minister",
        trustScore: 79.1
      }
    ];
    
    // Combine scraped and fallback data
    const allPoliticians = [...scrapedMPs, ...fallbackPoliticians];
    
    // Store in database
    for (const politician of allPoliticians) {
      try {
        await storage.createPolitician({
          name: politician.name,
          position: politician.position || "Member of Parliament",
          party: politician.party,
          constituency: politician.constituency,
          jurisdiction: politician.province,
          trustScore: politician.trustScore?.toString() || "75.0"
        });
        console.log(`Stored politician: ${politician.name}`);
      } catch (error) {
        // Ignore duplicates
        if (!error.message?.includes('duplicate')) {
          console.error(`Error storing ${politician.name}:`, error.message);
        }
      }
    }
    
    console.log(`Successfully populated ${allPoliticians.length} politicians`);
  } catch (error) {
    console.error('Error populating politicians:', error);
  }
}

async function populateBills() {
  console.log('Populating bills...');
  
  try {
    // Try to scrape real data
    const scrapedBills = await scrapeFederalBills();
    console.log(`Scraped ${scrapedBills.length} bills`);
    
    // Add fallback data
    const fallbackBills = [
      {
        number: "C-11",
        title: "Online Streaming Act",
        summary: "An Act to amend the Broadcasting Act and to make related and consequential amendments to other Acts",
        status: "Active",
        sponsor: "Justin Trudeau",
        lastAction: "2024-01-15"
      },
      {
        number: "C-18",
        title: "Online News Act",
        summary: "An Act respecting online communications platforms that make news content available to persons in Canada",
        status: "Active",
        sponsor: "Chrystia Freeland",
        lastAction: "2024-01-20"
      },
      {
        number: "C-13",
        title: "Official Languages Act",
        summary: "An Act to amend the Official Languages Act, to enact the Use of French in Federally Regulated Private Businesses Act and to make related amendments to other Acts",
        status: "Pending",
        sponsor: "Mélanie Joly",
        lastAction: "2024-01-25"
      },
      {
        number: "C-15",
        title: "United Nations Declaration on the Rights of Indigenous Peoples Act",
        summary: "An Act respecting the United Nations Declaration on the Rights of Indigenous Peoples and to make related and consequential amendments to other Acts",
        status: "Passed",
        sponsor: "Justin Trudeau",
        lastAction: "2024-01-30"
      }
    ];
    
    // Combine scraped and fallback data
    const allBills = [...scrapedBills, ...fallbackBills];
    
    // Store in database
    for (const bill of allBills) {
      try {
        await storage.createBill({
          billNumber: bill.number,
          title: bill.title,
          description: bill.summary,
          fullText: "",
          category: inferCategory(bill.title),
          jurisdiction: "Federal",
          status: bill.status,
          votingDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        console.log(`Stored bill: ${bill.number} - ${bill.title}`);
      } catch (error) {
        // Ignore duplicates
        if (!error.message?.includes('duplicate')) {
          console.error(`Error storing bill ${bill.number}:`, error.message);
        }
      }
    }
    
    console.log(`Successfully populated ${allBills.length} bills`);
  } catch (error) {
    console.error('Error populating bills:', error);
  }
}

function inferCategory(title) {
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

async function populateAllData() {
  console.log('=== Starting Data Population ===\n');
  
  await populatePoliticians();
  console.log('');
  await populateBills();
  
  console.log('\n=== Data Population Complete ===');
}

populateAllData().catch(console.error); 