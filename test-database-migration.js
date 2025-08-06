const { Client } = require('pg');

async function testDatabaseMigration() {
  console.log('🔍 TESTING DATABASE MIGRATION - VERIFYING ALL FIXES\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database successfully\n');
    
    const testResults = {};
    
    // Test 1: Check if announcements table has expires_at column
    console.log('🔍 Testing Announcements Table...');
    try {
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'expires_at'
      `);
      
      if (result.rows.length > 0) {
        testResults['Announcements expires_at'] = { status: '✅ Working', found: true };
        console.log('✅ Announcements table has expires_at column');
      } else {
        testResults['Announcements expires_at'] = { status: '❌ Failed', found: false };
        console.log('❌ Announcements table missing expires_at column');
      }
    } catch (error) {
      testResults['Announcements expires_at'] = { status: '❌ Error', error: error.message };
      console.log(`❌ Announcements test error: ${error.message}`);
    }
    
    // Test 2: Check all required social tables
    const socialTables = [
      'social_conversations', 'social_messages', 'social_notifications',
      'social_activities', 'social_bookmarks', 'social_shares'
    ];
    
    console.log('\n🔍 Testing Social Tables...');
    for (const table of socialTables) {
      try {
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rows.length > 0) {
          testResults[`Social Table: ${table}`] = { status: '✅ Working', found: true };
          console.log(`✅ ${table} table exists`);
        } else {
          testResults[`Social Table: ${table}`] = { status: '❌ Failed', found: false };
          console.log(`❌ ${table} table missing`);
        }
      } catch (error) {
        testResults[`Social Table: ${table}`] = { status: '❌ Error', error: error.message };
        console.log(`❌ ${table} test error: ${error.message}`);
      }
    }
    
    // Test 3: Check system tables
    const systemTables = [
      'system_health', 'analytics_events', 'identity_verifications'
    ];
    
    console.log('\n🔍 Testing System Tables...');
    for (const table of systemTables) {
      try {
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rows.length > 0) {
          testResults[`System Table: ${table}`] = { status: '✅ Working', found: true };
          console.log(`✅ ${table} table exists`);
        } else {
          testResults[`System Table: ${table}`] = { status: '❌ Failed', found: false };
          console.log(`❌ ${table} table missing`);
        }
      } catch (error) {
        testResults[`System Table: ${table}`] = { status: '❌ Error', error: error.message };
        console.log(`❌ ${table} test error: ${error.message}`);
      }
    }
    
    // Test 4: Check permissions tables
    const permissionTables = [
      'user_permissions', 'permissions', 'user_membership_history'
    ];
    
    console.log('\n🔍 Testing Permission Tables...');
    for (const table of permissionTables) {
      try {
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rows.length > 0) {
          testResults[`Permission Table: ${table}`] = { status: '✅ Working', found: true };
          console.log(`✅ ${table} table exists`);
        } else {
          testResults[`Permission Table: ${table}`] = { status: '❌ Failed', found: false };
          console.log(`❌ ${table} table missing`);
        }
      } catch (error) {
        testResults[`Permission Table: ${table}`] = { status: '❌ Error', error: error.message };
        console.log(`❌ ${table} test error: ${error.message}`);
      }
    }
    
    // Test 5: Check feature tables
    const featureTables = [
      'payments', 'file_uploads', 'webhooks', 'development_logs',
      'voting_items', 'votes', 'news_articles', 'legal_documents',
      'government_integrity', 'events'
    ];
    
    console.log('\n🔍 Testing Feature Tables...');
    for (const table of featureTables) {
      try {
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rows.length > 0) {
          testResults[`Feature Table: ${table}`] = { status: '✅ Working', found: true };
          console.log(`✅ ${table} table exists`);
        } else {
          testResults[`Feature Table: ${table}`] = { status: '❌ Failed', found: false };
          console.log(`❌ ${table} table missing`);
        }
      } catch (error) {
        testResults[`Feature Table: ${table}`] = { status: '❌ Error', error: error.message };
        console.log(`❌ ${table} test error: ${error.message}`);
      }
    }
    
    // Test 6: Check foreign key constraints
    console.log('\n🔍 Testing Foreign Key Constraints...');
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
        console.log(`✅ Found ${result.rows.length} foreign key constraints`);
      } else {
        testResults['Foreign Key Constraints'] = { status: '❌ Failed', count: 0 };
        console.log('❌ No foreign key constraints found');
      }
    } catch (error) {
      testResults['Foreign Key Constraints'] = { status: '❌ Error', error: error.message };
      console.log(`❌ Foreign key test error: ${error.message}`);
    }
    
    // Test 7: Check indexes
    console.log('\n🔍 Testing Indexes...');
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
        console.log(`✅ Found ${result.rows.length} performance indexes`);
      } else {
        testResults['Performance Indexes'] = { status: '❌ Failed', count: 0 };
        console.log('❌ No performance indexes found');
      }
    } catch (error) {
      testResults['Performance Indexes'] = { status: '❌ Error', error: error.message };
      console.log(`❌ Index test error: ${error.message}`);
    }
    
    // Test 8: Check default permissions data
    console.log('\n🔍 Testing Default Permissions Data...');
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
        console.log(`✅ Found ${result.rows[0].count} default permissions`);
      } else {
        testResults['Default Permissions'] = { status: '❌ Failed', count: 0 };
        console.log('❌ No default permissions found');
      }
    } catch (error) {
      testResults['Default Permissions'] = { status: '❌ Error', error: error.message };
      console.log(`❌ Permissions test error: ${error.message}`);
    }
    
    // Generate comprehensive report
    console.log('\n📊 DATABASE MIGRATION TEST RESULTS:');
    console.log('=====================================');
    
    const workingTests = Object.keys(testResults).filter(key => testResults[key].status === '✅ Working');
    const failedTests = Object.keys(testResults).filter(key => testResults[key].status.startsWith('❌'));
    
    console.log(`✅ Working Tests: ${workingTests.length}`);
    console.log(`❌ Failed Tests: ${failedTests.length}`);
    console.log(`📊 Total Tests: ${Object.keys(testResults).length}`);
    
    console.log('\n🎯 WORKING TESTS:');
    workingTests.forEach(test => {
      console.log(`✅ ${test}`);
    });
    
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`❌ ${test}: ${testResults[test].error || 'Not found'}`);
    });
    
    console.log('\n📈 MIGRATION SUCCESS ASSESSMENT:');
    console.log('=====================================');
    
    const successRate = Math.round((workingTests.length / Object.keys(testResults).length) * 100);
    
    console.log(`Migration Success Rate: ${successRate}%`);
    
    if (successRate >= 95) {
      console.log('🟢 EXCELLENT - Database migration successful');
    } else if (successRate >= 80) {
      console.log('🟡 GOOD - Database migration mostly successful');
    } else if (successRate >= 60) {
      console.log('🟠 FAIR - Database migration needs work');
    } else {
      console.log('🔴 POOR - Database migration failed');
    }
    
    console.log('\n🎯 CRITICAL ISSUES TO FIX:');
    console.log('==========================');
    
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
      console.log('🔴 CRITICAL DATABASE ISSUES:');
      criticalBroken.forEach(issue => {
        console.log(`❌ ${issue}: ${testResults[issue].error || 'Not found'}`);
      });
    } else {
      console.log('✅ All critical database issues resolved');
    }
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return { error: error.message };
  } finally {
    await client.end();
  }
}

testDatabaseMigration().catch(console.error); 