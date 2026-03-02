const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend directory
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Validate required environment variables
// Support both naming conventions for flexibility
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();

// Check if Supabase is configured (non-empty values)
const isSupabaseConfigured = supabaseUrl && supabaseKey && supabaseUrl.length > 0 && supabaseKey.length > 0;

if (!isSupabaseConfigured) {
  // Only show warning if user might have intended to use Supabase
  // If all values are explicitly empty, assume intentional use of in-memory storage
  const hasAnyValue = supabaseUrl || supabaseKey;
  if (hasAnyValue) {
    console.warn('⚠️  Supabase configuration incomplete. Some values are missing or empty.');
    console.warn('⚠️  Using fallback in-memory storage.');
  } else {
    // All values are empty - assume intentional, don't show warnings
    // This is the default for development/testing
  }
}

// Create Supabase client (will be null if env vars are missing or empty)
const supabase = isSupabaseConfigured
  ? createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

// Export function to check if Supabase is configured
const isSupabaseConfiguredFn = () => {
  return isSupabaseConfigured;
};

// Test Supabase connection on startup
async function testSupabaseConnection() {
  if (!isSupabaseConfigured) {
    console.log('📝 Supabase not configured - using in-memory storage');
    return false;
  }

  try {
    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from('chains')
      .select('id')
      .limit(1);
    
    if (error) {
      // If table doesn't exist, that's okay - it means we need to run migrations
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠️  Supabase connected but chains table does not exist. Please run database migrations.');
        console.warn('⚠️  See doc/SUPABASE_SETUP.md for migration instructions.');
        return true; // Connection works, just need migrations
      }
      console.error('❌ Supabase connection test failed:', error.message);
      console.error('❌ Error code:', error.code);
      return false;
    }
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (err) {
    console.error('❌ Error testing Supabase connection:', err.message);
    return false;
  }
}

// Test connection on module load (async, won't block)
if (isSupabaseConfigured) {
  testSupabaseConnection().catch(err => {
    console.error('❌ Failed to test Supabase connection:', err);
  });
}

module.exports = {
  supabase,
  isSupabaseConfigured: isSupabaseConfiguredFn,
  testSupabaseConnection
};

