import { db } from './db.ts';
import { politicians } from '../shared/schema.ts';

const samplePoliticians = [
  {
    id: 'politician_1',
    name: 'Justin Trudeau',
    position: 'Prime Minister',
    party: 'Liberal Party of Canada',
    jurisdiction: 'Canada',
    email: 'justin.trudeau@parl.gc.ca',
    phone: '+1-613-992-4211',
    website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E',
    socialMedia: {
      twitter: '@JustinTrudeau',
      facebook: 'JustinTrudeau',
      instagram: 'justintrudeau'
    },
    bio: 'Prime Minister of Canada since 2015. Leader of the Liberal Party of Canada.',
    imageUrl: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'politician_2',
    name: 'Pierre Poilievre',
    position: 'Leader of the Opposition',
    party: 'Conservative Party of Canada',
    jurisdiction: 'Canada',
    email: 'pierre.poilievre@parl.gc.ca',
    phone: '+1-613-992-6771',
    website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E',
    socialMedia: {
      twitter: '@PierrePoilievre',
      facebook: 'PierrePoilievre',
      instagram: 'pierrepoilievre'
    },
    bio: 'Leader of the Conservative Party of Canada and Leader of the Opposition.',
    imageUrl: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'politician_3',
    name: 'Jagmeet Singh',
    position: 'Leader of the New Democratic Party',
    party: 'New Democratic Party',
    jurisdiction: 'Canada',
    email: 'jagmeet.singh@parl.gc.ca',
    phone: '+1-613-992-6771',
    website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E',
    socialMedia: {
      twitter: '@theJagmeetSingh',
      facebook: 'JagmeetSingh',
      instagram: 'jagmeetsingh'
    },
    bio: 'Leader of the New Democratic Party of Canada.',
    imageUrl: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'politician_4',
    name: 'Yves-François Blanchet',
    position: 'Leader of the Bloc Québécois',
    party: 'Bloc Québécois',
    jurisdiction: 'Canada',
    email: 'yves-francois.blanchet@parl.gc.ca',
    phone: '+1-613-992-6771',
    website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E',
    socialMedia: {
      twitter: '@yfblanchet',
      facebook: 'YvesFrancoisBlanchet',
      instagram: 'yfblanchet'
    },
    bio: 'Leader of the Bloc Québécois.',
    imageUrl: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'politician_5',
    name: 'Elizabeth May',
    position: 'Leader of the Green Party',
    party: 'Green Party of Canada',
    jurisdiction: 'Canada',
    email: 'elizabeth.may@parl.gc.ca',
    phone: '+1-613-992-6771',
    website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E',
    socialMedia: {
      twitter: '@ElizabethMay',
      facebook: 'ElizabethMay',
      instagram: 'elizabethmay'
    },
    bio: 'Leader of the Green Party of Canada.',
    imageUrl: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function populatePoliticians() {
  try {
    console.log('Starting politician population...');
    
    // Clear existing data
    await db.delete(politicians);
    console.log('Cleared existing politicians data');
    
    // Insert sample politicians
    const insertedPoliticians = await db.insert(politicians).values(samplePoliticians).returning();
    console.log(`Successfully inserted ${insertedPoliticians.length} politicians`);
    
    console.log('Politician population completed successfully');
  } catch (error) {
    console.error('Error populating politicians:', error);
  }
}

// Run the population
populatePoliticians(); 