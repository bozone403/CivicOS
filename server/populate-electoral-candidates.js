import { db } from './db.ts';
import { electoralCandidates } from '../shared/schema.ts';

// Current Canadian Party Leaders and Key Political Figures
const CURRENT_CANADIAN_LEADERS = [
  {
    name: "Justin Trudeau",
    party: "Liberal Party of Canada",
    position: "Prime Minister",
    jurisdiction: "Federal",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Justin_Trudeau_2019.jpg/220px-Justin_Trudeau_2019.jpg",
    bio: "Justin Trudeau is the 23rd Prime Minister of Canada, serving since 2015. He leads the Liberal Party of Canada and has focused on climate action, reconciliation with Indigenous peoples, and social progress.",
    keyPolicies: [
      "Climate action and carbon pricing",
      "Reconciliation with Indigenous peoples",
      "Universal pharmacare",
      "Child care support",
      "Immigration and diversity"
    ],
    trustScore: "45.2"
  },
  {
    name: "Pierre Poilievre",
    party: "Conservative Party of Canada",
    position: "Leader of the Opposition",
    jurisdiction: "Federal",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Pierre_Poilievre_2022.jpg/220px-Pierre_Poilievre_2022.jpg",
    bio: "Pierre Poilievre is the Leader of the Opposition and Conservative Party leader since 2022. He focuses on economic issues, reducing government spending, and addressing inflation.",
    keyPolicies: [
      "Fiscal responsibility and debt reduction",
      "Lower taxes and deregulation",
      "Energy sector support",
      "Law and order",
      "Housing affordability"
    ],
    trustScore: "52.8"
  },
  {
    name: "Jagmeet Singh",
    party: "New Democratic Party",
    position: "NDP Leader",
    jurisdiction: "Federal",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Jagmeet_Singh_2019.jpg/220px-Jagmeet_Singh_2019.jpg",
    bio: "Jagmeet Singh leads the New Democratic Party and has been a Member of Parliament since 2019. He advocates for social justice, universal healthcare, and workers' rights.",
    keyPolicies: [
      "Universal pharmacare and dental care",
      "Climate justice and green jobs",
      "Affordable housing",
      "Workers' rights and unions",
      "Racial and social justice"
    ],
    trustScore: "48.7"
  },
  {
    name: "Yves-François Blanchet",
    party: "Bloc Québécois",
    position: "Bloc Leader",
    jurisdiction: "Federal",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Yves-Fran%C3%A7ois_Blanchet_2019.jpg/220px-Yves-Fran%C3%A7ois_Blanchet_2019.jpg",
    bio: "Yves-François Blanchet leads the Bloc Québécois, advocating for Quebec's interests and autonomy within the Canadian federation.",
    keyPolicies: [
      "Quebec autonomy and interests",
      "French language protection",
      "Quebec cultural identity",
      "Provincial jurisdiction respect",
      "Quebec-specific policies"
    ],
    trustScore: "41.3"
  },
  {
    name: "Elizabeth May",
    party: "Green Party of Canada",
    position: "Green Party Co-Leader",
    jurisdiction: "Federal",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Elizabeth_May_2019.jpg/220px-Elizabeth_May_2019.jpg",
    bio: "Elizabeth May is a co-leader of the Green Party of Canada and has been a strong advocate for environmental protection and climate action.",
    keyPolicies: [
      "Climate emergency action",
      "Renewable energy transition",
      "Environmental protection",
      "Social justice",
      "Sustainable economy"
    ],
    trustScore: "55.1"
  },
  {
    name: "Maxime Bernier",
    party: "People's Party of Canada",
    position: "PPC Leader",
    jurisdiction: "Federal",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Maxime_Bernier_2019.jpg/220px-Maxime_Bernier_2019.jpg",
    bio: "Maxime Bernier founded and leads the People's Party of Canada, advocating for smaller government, free markets, and Canadian sovereignty.",
    keyPolicies: [
      "Smaller government",
      "Free market economics",
      "Canadian sovereignty",
      "Immigration reform",
      "Fiscal conservatism"
    ],
    trustScore: "38.9"
  }
];

async function populateElectoralCandidates() {
  try {
    // console.log removed for production
    
    // Check if candidates already exist
    const existingCandidates = await db.select().from(electoralCandidates);
    
    if (existingCandidates.length > 0) {
      // console.log removed for production
      // console.log removed for production
      return existingCandidates;
    }

    // console.log removed for production

    // Insert current leaders
    const insertedCandidates = await Promise.all(
      CURRENT_CANADIAN_LEADERS.map(async (leader) => {
        console.log(`Adding candidate: ${leader.name} (${leader.party})`);
        
        const [candidate] = await db.insert(electoralCandidates).values({
          name: leader.name,
          party: leader.party,
          position: leader.position,
          jurisdiction: leader.jurisdiction,
          imageUrl: leader.imageUrl,
          bio: leader.bio,
          keyPolicies: leader.keyPolicies,
          trustScore: leader.trustScore
        }).returning();
        
        console.log(`✅ Added: ${candidate.name} (ID: ${candidate.id})`);
        return candidate;
      })
    );

    // console.log removed for production
    return insertedCandidates;
  } catch (error) {
    // console.error removed for production
    throw error;
  }
}

// Run the population script
populateElectoralCandidates()
  .then(() => {
    // console.log removed for production
    process.exit(0);
  })
  .catch((error) => {
    // console.error removed for production
    process.exit(1);
  }); 