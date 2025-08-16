import { supabase } from './supabase'
import type { Database } from './supabase'
import { initializeReplicateService } from './replicateService'

type ApiKey = Database['public']['Tables']['api_keys']['Row']
type ApiKeyInsert = Database['public']['Tables']['api_keys']['Insert']

export interface ApiKeyInfo {
  id: string
  name: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

export class ApiKeyService {
  // Generate a secure hash for API key storage
  private async hashApiKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Add a new API key for a user
  async addApiKey(
    userId: string,
    name: string,
    apiKey: string
  ): Promise<{ apiKeyId: string; error: string | null }> {
    try {
      // Hash the API key for secure storage
      const keyHash = await this.hashApiKey(apiKey)

      // Check if API key already exists
      const { data: existingKey, error: checkError } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', userId)
        .eq('key_hash', keyHash)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        return { apiKeyId: '', error: checkError.message }
      }

      if (existingKey) {
        return { apiKeyId: '', error: 'API key already exists' }
      }

      // Store the hashed API key
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          name,
          key_hash: keyHash,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        return { apiKeyId: '', error: error.message }
      }

      return { apiKeyId: data.id, error: null }
    } catch (error) {
      console.error('Error adding API key:', error)
      return { apiKeyId: '', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Get user's API keys (without the actual keys)
  async getUserApiKeys(userId: string): Promise<{ apiKeys: ApiKeyInfo[]; error: string | null }> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, is_active, created_at, last_used_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return { apiKeys: [], error: error.message }
    }

    return { apiKeys: data || [], error: null }
  }

  // Validate API key for a user
  async validateApiKey(userId: string, apiKey: string): Promise<{ isValid: boolean; apiKeyId: string | null; error: string | null }> {
    try {
      const keyHash = await this.hashApiKey(apiKey)

      const { data, error } = await supabase
        .from('api_keys')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('key_hash', keyHash)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { isValid: false, apiKeyId: null, error: null }
        }
        return { isValid: false, apiKeyId: null, error: error.message }
      }

      if (!data.is_active) {
        return { isValid: false, apiKeyId: data.id, error: 'API key is inactive' }
      }

      // Update last used timestamp
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id)

      return { isValid: true, apiKeyId: data.id, error: null }
    } catch (error) {
      console.error('Error validating API key:', error)
      return { isValid: false, apiKeyId: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Deactivate an API key
  async deactivateApiKey(apiKeyId: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', apiKeyId)
      .eq('user_id', userId)

    return { error: error?.message || null }
  }

  // Reactivate an API key
  async reactivateApiKey(apiKeyId: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: true })
      .eq('id', apiKeyId)
      .eq('user_id', userId)

    return { error: error?.message || null }
  }

  // Delete an API key
  async deleteApiKey(apiKeyId: string, userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', apiKeyId)
      .eq('user_id', userId)

    return { error: error?.message || null }
  }

  // Get default API key for user (first active key)
  async getDefaultApiKey(userId: string): Promise<{ apiKey: string | null; error: string | null }> {
    // This would typically be stored securely and retrieved from a secure source
    // For now, we'll return null and let the user provide their key
    return { apiKey: null, error: null }
  }

  // Initialize Replicate service with user's API key
  async initializeReplicateForUser(userId: string, apiKey: string): Promise<{ error: string | null }> {
    try {
      // Validate the API key first
      const { isValid, error } = await this.validateApiKey(userId, apiKey)
      
      if (error) {
        return { error }
      }

      if (!isValid) {
        return { error: 'Invalid or inactive API key' }
      }

      // Initialize Replicate service with the validated key
      initializeReplicateService(apiKey)
      
      return { error: null }
    } catch (error) {
      console.error('Error initializing Replicate for user:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Create singleton instance
export const apiKeyService = new ApiKeyService() 