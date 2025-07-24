// Load environment variables from .env file
require('dotenv').config({ path: '../.env' });

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const testUsers = [
  {
    id: "test-user-1",
    email: "test1@civicos.ca",
    firstName: "John",
    lastName: "Doe",
    profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "test-user-2",
    email: "test2@civicos.ca",
    firstName: "Jane",
    lastName: "Smith",
    profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "test-user-3",
    email: "test3@civicos.ca",
    firstName: "Michael",
    lastName: "Johnson",
    profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "test-user-4",
    email: "test4@civicos.ca",
    firstName: "Sarah",
    lastName: "Williams",
    profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "test-user-5",
    email: "test5@civicos.ca",
    firstName: "David",
    lastName: "Brown",
    profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "test-user-6",
    email: "test6@civicos.ca",
    firstName: "Emily",
    lastName: "Davis",
    profileImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: "test-user-7",
    email: "test7@civicos.ca",
    firstName: "Robert",
    lastName: "Wilson",
    profileImageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face"
  }
];

const samplePetitions = [
  {
    title: "Support Universal Basic Income in Canada",
    description: "We call on the Government of Canada to implement a Universal Basic Income program to ensure all Canadians have access to basic financial security. This would help reduce poverty, improve mental health, and provide a safety net for all citizens.",
    creatorId: "test-user-1",
    targetSignatures: 1000,
    currentSignatures: 847,
    status: "active",
    deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    category: "Economy"
  },
  {
    title: "Protect Canadian Forests from Clear-Cutting",
    description: "Urgent action needed to protect Canada's boreal forests from unsustainable logging practices. We demand stronger environmental regulations and protection for old-growth forests across all provinces.",
    creatorId: "test-user-2",
    targetSignatures: 5000,
    currentSignatures: 3241,
    status: "active",
    deadlineDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    category: "Environment"
  },
  {
    title: "Implement National Pharmacare Program",
    description: "Canada is the only developed country with universal healthcare that doesn't include prescription drug coverage. We demand the implementation of a national pharmacare program to ensure all Canadians have access to affordable medications.",
    creatorId: "test-user-3",
    targetSignatures: 2000,
    currentSignatures: 1892,
    status: "active",
    deadlineDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    category: "Healthcare"
  },
  {
    title: "Reform Electoral System to Proportional Representation",
    description: "Canada's first-past-the-post electoral system is outdated and doesn't reflect the true will of voters. We call for electoral reform to implement proportional representation for fairer elections.",
    creatorId: "test-user-4",
    targetSignatures: 3000,
    currentSignatures: 2156,
    status: "active",
    deadlineDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    category: "Democracy"
  },
  {
    title: "Increase Funding for Indigenous Education",
    description: "Support increased federal funding for Indigenous education programs and schools. This includes better resources, culturally appropriate curriculum, and improved infrastructure for Indigenous communities.",
    creatorId: "test-user-5",
    targetSignatures: 1500,
    currentSignatures: 892,
    status: "active",
    deadlineDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75 days from now
    category: "Indigenous Rights"
  },
  {
    title: "Implement Rent Control Nationwide",
    description: "The housing crisis is affecting millions of Canadians. We demand nationwide rent control policies to protect tenants from excessive rent increases and ensure affordable housing for all.",
    creatorId: "test-user-6",
    targetSignatures: 4000,
    currentSignatures: 3456,
    status: "active",
    deadlineDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days from now
    category: "Housing"
  },
  {
    title: "Strengthen Anti-Corruption Laws",
    description: "Canada needs stronger anti-corruption legislation and enforcement mechanisms. We call for increased transparency in government spending, stricter lobbying regulations, and better whistleblower protections.",
    creatorId: "test-user-7",
    targetSignatures: 2500,
    currentSignatures: 1789,
    status: "active",
    deadlineDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days from now
    category: "Transparency"
  }
];

async function createTestUsers() {
  console.log('👥 Creating test users...');
  
  for (const user of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [user.id]);
      if (existingUser.rows.length > 0) {
        console.log(`⚠️  User ${user.id} already exists, skipping...`);
        continue;
      }

      const result = await pool.query(
        `INSERT INTO users
         (id, email, first_name, last_name, profile_image_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, first_name, last_name`,
        [user.id, user.email, user.firstName, user.lastName, user.profileImageUrl]
      );
      
      console.log(`✅ Created user: ${result.rows[0].first_name} ${result.rows[0].last_name} (ID: ${result.rows[0].id})`);
    } catch (error) {
      console.error(`❌ Error creating user ${user.id}:`, error.message);
    }
  }
}

async function populatePetitions() {
  try {
    console.log('🔧 Starting petitions population...');
    
    // First create test users
    await createTestUsers();
    
    // Check if petitions already exist
    const existingPetitions = await pool.query('SELECT COUNT(*) FROM petitions');
    if (parseInt(existingPetitions.rows[0].count) > 0) {
      console.log('⚠️  Petitions already exist in database. Skipping population.');
      return;
    }

    // Insert sample petitions
    for (const petition of samplePetitions) {
      const result = await pool.query(
        `INSERT INTO petitions
         (title, description, creator_id, target_signatures, current_signatures, status, deadline_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id, title`,
        [
          petition.title,
          petition.description,
          petition.creatorId,
          petition.targetSignatures,
          petition.currentSignatures,
          petition.status,
          petition.deadlineDate
        ]
      );
      
      console.log(`✅ Created petition: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
    }

    console.log('🎉 Petitions population completed successfully!');
    console.log(`📊 Created ${samplePetitions.length} sample petitions`);
    
  } catch (error) {
    console.error('❌ Error populating petitions:', error);
  } finally {
    await pool.end();
  }
}

// Run the population script
populatePetitions(); 