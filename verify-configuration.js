#!/usr/bin/env node

/**
 * CivicOS Configuration Verification Script
 * 
 * This script verifies that all routing, environment variables, and configuration
 * are properly set up and cohesive with each other.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 CivicOS Configuration Verification');
console.log('=====================================\n');

// Check 1: Environment Variables
console.log('1. Environment Variables Check:');
const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'NODE_ENV'
];

const optionalEnvVars = [
  'CORS_ORIGIN',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'PORT'
];

let envIssues = 0;

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`   ❌ Missing required: ${varName}`);
    envIssues++;
  } else {
    console.log(`   ✅ ${varName}: ${varName.includes('SECRET') ? '[HIDDEN]' : 'Set'}`);
  }
});

optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}: Set`);
  } else {
    console.log(`   ⚠️  ${varName}: Not set (optional)`);
  }
});

// Check 2: Route Files Exist
console.log('\n2. Route Files Check:');
const routeFiles = [
  'server/routes/auth.ts',
  'server/routes/users.ts',
  'server/routes/politicians.ts',
  'server/routes/bills.ts',
  'server/routes/news.ts',
  'server/routes/finance.ts',
  'server/routes/contacts.ts',
  'server/routes/legal.ts',
  'server/routes/maps.ts',
  'server/routes/procurement.ts',
  'server/routes/lobbyists.ts',
  'server/routes/memory.ts',
  'server/routes/ledger.ts',
  'server/routes/cases.ts',
  'server/routes/leaks.ts',
  'server/routes/trust.ts',
  'server/routes/corruption.ts',
  'server/routes/elections.ts',
  'server/routes/rights.ts',
  'server/routes/social.ts',
  'server/routes/friends.ts',
  'server/routes/petitions.ts',
  'server/routes/messages.ts',
  'server/routes/api.ts',
  'server/routes/dashboard.ts',
  'server/routes/voting.ts',
  'server/routes/search.ts',
  'server/routes/ai.ts'
];

let routeIssues = 0;
routeFiles.forEach(routeFile => {
  const fullPath = path.join(__dirname, routeFile);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${routeFile}`);
  } else {
    console.log(`   ❌ Missing: ${routeFile}`);
    routeIssues++;
  }
});

// Check 3: App Routes Registration
console.log('\n3. App Routes Registration Check:');
const appRoutesPath = path.join(__dirname, 'server/appRoutes.ts');
let registrationIssues = 0;

if (fs.existsSync(appRoutesPath)) {
  const appRoutesContent = fs.readFileSync(appRoutesPath, 'utf8');
  
  // Check if all route registrations are present
  const routeRegistrations = [
    'registerAuthRoutes',
    'registerUserRoutes',
    'registerPoliticiansRoutes',
    'registerBillsRoutes',
    'registerNewsRoutes',
    'registerFinanceRoutes',
    'registerContactsRoutes',
    'registerLegalRoutes',
    'registerMapsRoutes',
    'registerProcurementRoutes',
    'registerLobbyistsRoutes',
    'registerMemoryRoutes',
    'registerLedgerRoutes',
    'registerCasesRoutes',
    'registerLeaksRoutes',
    'registerTrustRoutes',
    'registerCorruptionRoutes',
    'registerElectionsRoutes',
    'registerRightsRoutes',
    'registerSocialRoutes',
    'registerFriendRoutes',
    'registerPetitionRoutes',
    'registerMessageRoutes',
    'registerApiRoutes'
  ];
  
  routeRegistrations.forEach(registration => {
    if (appRoutesContent.includes(registration)) {
      console.log(`   ✅ ${registration}`);
    } else {
      console.log(`   ❌ Missing: ${registration}`);
      registrationIssues++;
    }
  });
  
  if (registrationIssues === 0) {
    console.log('   ✅ All route registrations found');
  }
} else {
  console.log('   ❌ appRoutes.ts not found');
  registrationIssues = 1;
}

// Check 4: Database Schema
console.log('\n4. Database Schema Check:');
const schemaPath = path.join(__dirname, 'shared/schema.ts');
let schemaIssues = 0;

if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  const requiredTables = [
    'users',
    'politicians',
    'bills',
    'newsArticles',
    'campaignFinance',
    'governmentServices', // instead of contacts
    'legalActs',
    'votes',
    'petitions',
    'userMessages' // instead of messages
  ];
  
  requiredTables.forEach(table => {
    if (schemaContent.includes(`export const ${table}`)) {
      console.log(`   ✅ Table: ${table}`);
    } else {
      console.log(`   ❌ Missing table: ${table}`);
      schemaIssues++;
    }
  });
  
  if (schemaIssues === 0) {
    console.log('   ✅ All required tables defined');
  }
} else {
  console.log('   ❌ schema.ts not found');
  schemaIssues = 1;
}

// Check 5: Frontend Configuration
console.log('\n5. Frontend Configuration Check:');
const configPath = path.join(__dirname, 'client/src/lib/config.ts');
if (fs.existsSync(configPath)) {
  console.log('   ✅ config.ts exists');
  const configContent = fs.readFileSync(configPath, 'utf8');
  if (configContent.includes('civicos.onrender.com')) {
    console.log('   ✅ Production API URL configured');
  } else {
    console.log('   ⚠️  Production API URL not found');
  }
} else {
  console.log('   ❌ config.ts not found');
}

// Check 6: Build Output
console.log('\n6. Build Output Check:');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('   ✅ dist/ directory exists');
  
  const publicPath = path.join(distPath, 'public');
  if (fs.existsSync(publicPath)) {
    console.log('   ✅ dist/public/ directory exists');
    
    const indexHtmlPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      console.log('   ✅ index.html exists');
    } else {
      console.log('   ❌ index.html missing');
    }
  } else {
    console.log('   ❌ dist/public/ directory missing');
  }
} else {
  console.log('   ❌ dist/ directory missing - run npm run build:full');
}

// Check 7: Package.json Scripts
console.log('\n7. Package.json Scripts Check:');
const packagePath = path.join(__dirname, 'package.json');
let scriptIssues = 0;

if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredScripts = ['dev', 'build', 'build:client', 'build:full', 'start'];
  
  requiredScripts.forEach(script => {
    if (packageContent.scripts && packageContent.scripts[script]) {
      console.log(`   ✅ Script: ${script}`);
    } else {
      console.log(`   ❌ Missing script: ${script}`);
      scriptIssues++;
    }
  });
  
  if (scriptIssues === 0) {
    console.log('   ✅ All required scripts present');
  }
} else {
  console.log('   ❌ package.json not found');
  scriptIssues = 1;
}

// Summary
console.log('\n📊 Summary:');
const totalIssues = envIssues + routeIssues + registrationIssues + schemaIssues + scriptIssues;

if (totalIssues === 0) {
  console.log('   🎉 All configuration checks passed!');
  console.log('   ✅ CivicOS is properly configured and ready for deployment.');
} else {
  console.log(`   ⚠️  Found ${totalIssues} configuration issues that need to be addressed.`);
  console.log('   🔧 Please fix the issues above before deploying.');
}

console.log('\n🚀 Configuration verification complete!'); 