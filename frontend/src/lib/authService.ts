import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

export class AuthService {
  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        return null
      }
      
      if (!session?.access_token) {
        console.log('No valid session found')
        return null
      }
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        console.error('User error:', error)
        return null
      }

      console.log('🔐 [AUTH SERVICE] Current user found:', user.id)
      return {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, fullName?: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        return { user: null, error: error.message }
      }

      if (data.user) {
        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
        }

        // Check if email confirmation is required
        if (data.session) {
          // User is immediately signed in (no email confirmation required)
          console.log('🔐 [AUTH SERVICE] Sign up successful - immediate sign in');
          return {
            user: {
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName
            },
            error: null
          }
        } else {
          // Email confirmation is required
          console.log('📧 [AUTH SERVICE] Email confirmation required');
          return {
            user: null,
            error: `Account created! Please check your email (${email}) to confirm your account before signing in.`
          }
        }
      }

      return { user: null, error: 'Sign up failed' }
    } catch (error) {
      console.error('Sign up exception:', error)
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          return { user: null, error: 'Network error: Unable to connect to the server. Please check your internet connection.' }
        }
        return { user: null, error: error.message }
      }
      return { user: null, error: 'An unexpected error occurred during sign up' }
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        return { user: null, error: error.message }
      }

      if (data.user && data.session) {
        // Ensure we have a valid session
        console.log('🔐 [AUTH SERVICE] Sign in successful');
        console.log('   - User ID:', data.user.id);
        console.log('   - Session exists:', !!data.session);
        console.log('   - Access token exists:', !!data.session.access_token);
        
        return {
          user: {
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name,
            avatar_url: data.user.user_metadata?.avatar_url
          },
          error: null
        }
      }

      return { user: null, error: 'Sign in failed' }
    } catch (error) {
      console.error('Sign in exception:', error)
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          return { user: null, error: 'Network error: Unable to connect to the server. Please check your internet connection.' }
        }
        return { user: null, error: error.message }
      }
      return { user: null, error: 'An unexpected error occurred during sign in' }
    }
  }

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      return { error: error.message }
    }
    console.log('🔐 [AUTH SERVICE] Sign out successful')
    return { error: null }
  }

  // Reset password
  async resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    
    if (error) {
      console.error('Error resetting password:', error)
      return { error: error.message }
    }
    
    console.log('📧 [AUTH SERVICE] Password reset email sent to:', email)
    return { error: null }
  }

  // Update user profile
  async updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string }): Promise<{ error: string | null }> {
    try {
      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: updates
      })

      if (authError) {
        console.error('Error updating auth user:', authError)
        return { error: authError.message }
      }

      // Update user profile in our users table
      const { error: profileError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (profileError) {
        console.error('Error updating user profile:', profileError)
        return { error: profileError.message }
      }

      console.log('👤 [AUTH SERVICE] Profile updated successfully')
      return { error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error: 'Failed to update profile' }
    }
  }

  // Listen for auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AUTH SERVICE] Auth state change:', event)
      
      if (event === 'SIGNED_IN' && session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url
        }
        callback(user)
      } else if (event === 'SIGNED_OUT') {
        callback(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url
        }
        callback(user)
      }
    })
  }
}

export const authService = new AuthService() 