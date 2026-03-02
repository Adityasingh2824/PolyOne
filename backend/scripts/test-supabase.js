#!/usr/bin/env node

/**
 * Test Supabase connection and configuration
 * Run with: node scripts/test-supabase.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();

console.log('🔍 Testing Supabase Configuration...\n');

// Check if variables are set
if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is not set in .env file');
  console.log('💡 Add SUPABASE_URL=https://your-project.supabase.co to backend/.env');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is not set in .env file');
  console.log('💡 Add SUPABASE_SERVICE_ROLE_KEY=your-key-here to backend/.env');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log('📋 Supabase URL:', supabaseUrl.substring(0, 30) + '...');
console.log('📋 Key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon Key');
console.log('');

// Test connection
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('🔌 Testing connection to Supabase...');
    
    // Test by querying chains table
    const { data, error } = await supabase
      .from('chains')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠️  Connection successful but chains table does not exist');
        console.log('💡 You need to run database migrations');
        console.log('💡 See doc/SUPABASE_SETUP.md for instructions');
        console.log('💡 Or run the SQL in supabase/schema.sql in your Supabase SQL Editor');
        return false;
      }
      console.error('❌ Connection test failed:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('✅ Chains table exists');
    
    // Count chains
    const { count } = await supabase
      .from('chains')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total chains in database: ${count || 0}`);
    
    return true;
  } catch (err) {
    console.error('❌ Error testing connection:', err.message);
    console.error('❌ Stack:', err.stack);
    return false;
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ All tests passed! Supabase is properly configured.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Connection test completed with warnings. Check the messages above.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  });















