const { Client } = require('pg');

async function testDatabaseMigration() {
  // console.log removed for production
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    // console.log removed for production
    
    const testResults = {};
    
    // Test 1: Check if announcements table has expires_at column
    // console.log removed for production
    try {
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'expires_at'
      `);
      
      if (result.rows.length > 0) {
        testResults['Announcements expires_at'] = { status: '✅ Working', found: true };
        // console.log removed for production
      } else {
        testResults['Announcements expires_at'] = { status: '❌ Failed', found: false };
        // console.log removed for production
      }
    } catch (error) {
      testResults['Announcements expires_at'] = { status: '❌ Error', error: error.message };
      // console.log removed for production
    }
    
    // Test 2: Check all required social tables
    const socialTables = [
      'social_conversations', 'social_messages', 'social_notifications',
      'social_activities', 'social_bookmarks', 'social_shares'
    ];
    
    // console.log removed for production
    for (const table of socialTables) {
      try {
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rows.length > 0) {
          testResults[`Social Table: ${table}`] = { status: '✅ Working', found: true };
          // console.log removed for production
        } else {
          testResults[`Social Table: ${table}`] = { status: '❌ Failed', found: false };
          // console.log removed for production
        }
      } catch (error) {
        testResults[`Social Table: ${table}`] = { status: '❌ Error', error: error.message };
        // console.log removed for production
      }
    }
    
    // Test 3: Check system tables
    const systemTables = [
      'system_health', 'analytics_events', 'identity_verifications'
    ];
    
    // console.log removed for production
    for (const table of systemTables) {
      try {
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rows.length > 0) {
          testResults[`System Table: ${table}`] = { status: '✅ Working', found: true };
          // console.log removed for production
        } else {
          testResults[`System Table: ${table}`] = { status: '❌ Failed', found: false };
          // console.log removed for production
        }
      } catch (error) {
        testResults[`System Table: ${table}`] = { status: '❌ Error', error: error.message };
        // console.log removed for production
      }
    }
    
    // Test 4: Check permissions tables
    const permissionTables = [
      'user_permissions', 'permissions', 'user_membership_history'
    ];
    
    // console.log removed for production
    for (const table of permissionTables) {
      try {
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rows.length > 0) {
          testResults[`Permission Table: ${table}`] = { status: '✅ Working', found: true };
          // console.log removed for production
        } else {
          testResults[`Permission Table: ${table}`] = { status: '❌ Failed', found: false };
          // console.log removed for production
        }
      } catch (error) {
        testResults[`Permission Table: ${table}`] = { status: '❌ Error', error: error.message };
        // console.log removed for production
      }
    }
    
    // Test 5: Check feature tables
    const featureTables = [
      'payments', 'file_uploads', 'webhooks', 'development_logs',
      'voting_items', 'votes', 'news_articles', 'legal_documents',
      'government_integrity', 'events'
    ];
    
    // console.log removed for production
    for (const table of featureTables) {
      try {
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rows.length > 0) {
          testResults[`Feature Table: ${table}`] = { status: '✅ Working', found: true };
          // console.log removed for production
        } else {
          testResults[`Feature Table: ${table}`] = { status: '❌ Failed', found: false };
          // console.log removed for production
        }
      } catch (error) {
        testResults[`Feature Table: ${table}`] = { status: '❌ Error', error: error.message };
        // console.log removed for production
      }
    }
    
    // Test 6: Check foreign key constraints
    // console.log removed for production
    try {
      const result = await client.query(`
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN (
          'social_messages', 'social_notifications', 'social_activities',
          'social_bookmarks', 'social_shares', 'identity_verifications',
          'user_permissions', 'user_membership_history', 'payments',
          'file_uploads', 'votes'
        )
      `);
      
      if (result.rows.length > 0) {
        testResults['Foreign Key Constraints'] = { status: '✅ Working', count: result.rows.length };
        // console.log removed for production
      } else {
        testResults['Foreign Key Constraints'] = { status: '❌ Failed', count: 0 };
        // console.log removed for production
      }
    } catch (error) {
      testResults['Foreign Key Constraints'] = { status: '❌ Error', error: error.message };
      // console.log removed for production
    }
    
    // Test 7: Check indexes
    // console.log removed for production
    try {
      const result = await client.query(`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE indexname LIKE 'idx_%'
        AND tablename IN (
          'social_messages', 'social_notifications', 'social_activities',
          'social_bookmarks', 'social_shares', 'analytics_events',
          'identity_verifications', 'user_permissions', 'payments',
          'file_uploads', 'votes'
        )
      `);
      
      if (result.rows.length > 0) {
        testResults['Performance Indexes'] = { status: '✅ Working', count: result.rows.length };
        // console.log removed for production
      } else {
        testResults['Performance Indexes'] = { status: '❌ Failed', count: 0 };
        // console.log removed for production
      }
    } catch (error) {
      testResults['Performance Indexes'] = { status: '❌ Error', error: error.message };
      // console.log removed for production
    }
    
    // Test 8: Check default permissions data
    // console.log removed for production
    try {
      const result = await client.query(`
        SELECT COUNT(*) as count 
        FROM permissions 
        WHERE name IN (
          'create_announcements', 'edit_announcements', 'delete_announcements',
          'pin_announcements', 'view_analytics', 'manage_users', 'manage_system'
        )
      `);
      
      if (result.rows[0].count > 0) {
        testResults['Default Permissions'] = { status: '✅ Working', count: result.rows[0].count };
        // console.log removed for production
      } else {
        testResults['Default Permissions'] = { status: '❌ Failed', count: 0 };
        // console.log removed for production
      }
    } catch (error) {
      testResults['Default Permissions'] = { status: '❌ Error', error: error.message };
      // console.log removed for production
    }
    
    // Generate comprehensive report
    // console.log removed for production
    // console.log removed for production
    
    const workingTests = Object.keys(testResults).filter(key => testResults[key].status === '✅ Working');
    const failedTests = Object.keys(testResults).filter(key => testResults[key].status.startsWith('❌'));
    
    // console.log removed for production
    // console.log removed for production
    console.log(`📊 Total Tests: ${Object.keys(testResults).length}`);
    
    // console.log removed for production
    workingTests.forEach(test => {
      // console.log removed for production
    });
    
    // console.log removed for production
    failedTests.forEach(test => {
      // console.log removed for production
    });
    
    // console.log removed for production
    // console.log removed for production
    
    const successRate = Math.round((workingTests.length / Object.keys(testResults).length) * 100);
    
    // console.log removed for production
    
    if (successRate >= 95) {
      // console.log removed for production
    } else if (successRate >= 80) {
      // console.log removed for production
    } else if (successRate >= 60) {
      // console.log removed for production
    } else {
      // console.log removed for production
    }
    
    // console.log removed for production
    // console.log removed for production
    
    const criticalIssues = [
      'Announcements expires_at',
      'Social Table: social_messages',
      'Social Table: social_notifications',
      'System Table: system_health',
      'Permission Table: permissions'
    ];
    
    const criticalBroken = criticalIssues.filter(issue => 
      testResults[issue] && testResults[issue].status.startsWith('❌')
    );
    
    if (criticalBroken.length > 0) {
      // console.log removed for production
      criticalBroken.forEach(issue => {
        // console.log removed for production
      });
    } else {
      // console.log removed for production
    }
    
    return testResults;
    
  } catch (error) {
    // console.error removed for production
    return { error: error.message };
  } finally {
    await client.end();
  }
}

testDatabaseMigration().catch(console.error); 