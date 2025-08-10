import { db } from './db.ts';
import { politicians } from '../shared/schema.ts';

const samplePoliticians = [
  {
    name: 'Justin Trudeau',
    position: 'Prime Minister of Canada',
    party: 'Liberal Party of Canada',
    constituency: 'Papineau',
    level: 'Federal',
    jurisdiction: 'Federal',
    biography: 'Prime Minister of Canada since 2015. Leader of the Liberal Party of Canada.',
    contactInfo: {
      email: 'justin.trudeau@parl.gc.ca',
      phone: '+1-613-992-4211',
      website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E'
    },
    socialMedia: {
      twitter: '@JustinTrudeau',
      facebook: 'JustinTrudeau',
      instagram: 'justintrudeau'
    },
    votingRecord: {},
    trustScore: '75.00'
  },
  {
    name: 'Pierre Poilievre',
    position: 'Leader of the Opposition',
    party: 'Conservative Party of Canada',
    constituency: 'Carleton',
    level: 'Federal',
    jurisdiction: 'Federal',
    biography: 'Leader of the Conservative Party of Canada and Leader of the Opposition.',
    contactInfo: {
      email: 'pierre.poilievre@parl.gc.ca',
      phone: '+1-613-992-6771',
      website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E'
    },
    socialMedia: {
      twitter: '@PierrePoilievre',
      facebook: 'PierrePoilievre',
      instagram: 'pierrepoilievre'
    },
    votingRecord: {},
    trustScore: '70.00'
  },
  {
    name: 'Jagmeet Singh',
    position: 'Leader of the New Democratic Party',
    party: 'New Democratic Party',
    constituency: 'Burnaby South',
    level: 'Federal',
    jurisdiction: 'Federal',
    biography: 'Leader of the New Democratic Party of Canada.',
    contactInfo: {
      email: 'jagmeet.singh@parl.gc.ca',
      phone: '+1-613-992-6771',
      website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E'
    },
    socialMedia: {
      twitter: '@theJagmeetSingh',
      facebook: 'JagmeetSingh',
      instagram: 'jagmeetsingh'
    },
    votingRecord: {},
    trustScore: '65.00'
  },
  {
    name: 'Yves-François Blanchet',
    position: 'Leader of the Bloc Québécois',
    party: 'Bloc Québécois',
    constituency: 'Beloeil—Chambly',
    level: 'Federal',
    jurisdiction: 'Federal',
    biography: 'Leader of the Bloc Québécois.',
    contactInfo: {
      email: 'yves-francois.blanchet@parl.gc.ca',
      phone: '+1-613-992-6771',
      website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E'
    },
    socialMedia: {
      twitter: '@yfblanchet',
      facebook: 'YvesFrancoisBlanchet',
      instagram: 'yfblanchet'
    },
    votingRecord: {},
    trustScore: '60.00'
  },
  {
    name: 'Elizabeth May',
    position: 'Leader of the Green Party',
    party: 'Green Party of Canada',
    constituency: 'Saanich—Gulf Islands',
    level: 'Federal',
    jurisdiction: 'Federal',
    biography: 'Leader of the Green Party of Canada.',
    contactInfo: {
      email: 'elizabeth.may@parl.gc.ca',
      phone: '+1-613-992-6771',
      website: 'https://www.parl.gc.ca/MembersOfParliament/ProfileMP.aspx?Key=215829&Language=E'
    },
    socialMedia: {
      twitter: '@ElizabethMay',
      facebook: 'ElizabethMay',
      instagram: 'elizabethmay'
    },
    votingRecord: {},
    trustScore: '80.00'
  }
];

async function populatePoliticians() {
  try {
    // console.log removed for production
    
    // Clear existing data
    await db.delete(politicians);
    // console.log removed for production
    
    // Insert sample politicians
    const insertedPoliticians = await db.insert(politicians).values(samplePoliticians).returning();
    // console.log removed for production
    
    // console.log removed for production
  } catch (error) {
    // console.error removed for production
  }
}

// Run the population
populatePoliticians(); 