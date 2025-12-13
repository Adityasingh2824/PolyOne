const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

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

module.exports = {
  supabase,
  isSupabaseConfigured: isSupabaseConfiguredFn
};

