import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ [DATABASE] Missing Supabase environment variables');
  console.error('   - SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test database connection
export async function testDatabaseConnection() {
  try {
    console.log('🔌 [DATABASE] Testing connection...');
    
    // Simple query to test connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ [DATABASE] Connection successful');
    return true;
  } catch (error) {
    console.error('❌ [DATABASE] Connection failed:', error.message);
    return false;
  }
}

// Video generation status constants
export const VIDEO_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Model types (for future expansion)
export const VIDEO_MODEL_TYPES = {
  SEEDANCE_LITE: 'seedance-1-lite'
};

// Aspect ratios supported by Replicate
export const SUPPORTED_ASPECT_RATIOS = [
  '16:9',   // Landscape
  '9:16',   // Portrait
  '1:1',    // Square
  '4:3',    // Standard
  '3:4',    // Portrait standard
  '21:9',   // Ultra-wide
  '9:21'    // Ultra-tall
];

// Resolutions supported by Replicate
export const SUPPORTED_RESOLUTIONS = [
  '480p',
  '720p',
  '1080p'
];

// Durations supported by Replicate
export const SUPPORTED_DURATIONS = [5, 10];

console.log('📊 [DATABASE] Configuration loaded successfully');
console.log('   - Supabase URL:', supabaseUrl);
console.log('   - Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing'); 