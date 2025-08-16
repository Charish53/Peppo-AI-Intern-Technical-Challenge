import { createClient } from '@supabase/supabase-js'

// Use environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [SUPABASE] Missing environment variables:')
  console.error('   - VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('   - VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Debug logging for Supabase configuration
console.log('🔧 [SUPABASE] Configuration loaded:')
console.log('   - URL:', supabaseUrl)
console.log('   - Anon Key length:', supabaseAnonKey.length)
console.log('   - Anon Key starts with:', supabaseAnonKey.substring(0, 20) + '...')

// Test Supabase connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ [SUPABASE] Connection test failed:', error)
  } else {
    console.log('✅ [SUPABASE] Connection test successful')
    console.log('   - Session exists:', !!data.session)
  }
}).catch(error => {
  console.error('❌ [SUPABASE] Connection test error:', error)
})

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          is_active: boolean
          created_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          is_active?: boolean
          created_at?: string
          last_used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          is_active?: boolean
          created_at?: string
          last_used_at?: string | null
        }
      }
      model_executions: {
        Row: {
          id: string
          user_id: string
          model_id: string
          model_name: string
          input_data: any
          output_data: any | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          replicate_prediction_id: string | null
          error_message: string | null
          execution_time_ms: number | null
          cost_usd: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model_id: string
          model_name: string
          input_data: any
          output_data?: any | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          replicate_prediction_id?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          cost_usd?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          model_id?: string
          model_name?: string
          input_data?: any
          output_data?: any | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          replicate_prediction_id?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          cost_usd?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          default_model_id: string | null
          theme: 'light' | 'dark' | 'system'
          notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_model_id?: string | null
          theme?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_model_id?: string | null
          theme?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
      }
      video_generations: {
        Row: {
          id: string
          user_id: string
          model_type: string
          prompt: string | null
          image_url: string | null
          negative_prompt: string | null
          num_frames: number | null
          aspect_ratio: string | null
          input_data: any
          output_data: any | null
          status: string
          external_id: string | null
          error_message: string | null
          video_url: string | null
          thumbnail_url: string | null
          generation_time_ms: number | null
          cost_usd: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model_type: string
          prompt?: string | null
          image_url?: string | null
          negative_prompt?: string | null
          num_frames?: number | null
          aspect_ratio?: string | null
          input_data: any
          output_data?: any | null
          status?: string
          external_id?: string | null
          error_message?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          generation_time_ms?: number | null
          cost_usd?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          model_type?: string
          prompt?: string | null
          image_url?: string | null
          negative_prompt?: string | null
          num_frames?: number | null
          aspect_ratio?: string | null
          input_data?: any
          output_data?: any | null
          status?: string
          external_id?: string | null
          error_message?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          generation_time_ms?: number | null
          cost_usd?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 