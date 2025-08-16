import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { apiKeyService, type ApiKeyInfo } from '../lib/apiKeyService'

export function useApiKeys() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addApiKey = useCallback(async (
    name: string,
    apiKey: string
  ): Promise<{ apiKeyId: string | null; error: string | null }> => {
    if (!user) {
      return { apiKeyId: null, error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await apiKeyService.addApiKey(user.id, name, apiKey)
      if (result.error) {
        setError(result.error)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { apiKeyId: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const getUserApiKeys = useCallback(async (): Promise<{ apiKeys: ApiKeyInfo[]; error: string | null }> => {
    if (!user) {
      return { apiKeys: [], error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await apiKeyService.getUserApiKeys(user.id)
      if (result.error) {
        setError(result.error)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { apiKeys: [], error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const validateApiKey = useCallback(async (
    apiKey: string
  ): Promise<{ isValid: boolean; apiKeyId: string | null; error: string | null }> => {
    if (!user) {
      return { isValid: false, apiKeyId: null, error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await apiKeyService.validateApiKey(user.id, apiKey)
      if (result.error) {
        setError(result.error)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { isValid: false, apiKeyId: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const deactivateApiKey = useCallback(async (apiKeyId: string): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await apiKeyService.deactivateApiKey(apiKeyId, user.id)
      if (result.error) {
        setError(result.error)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const reactivateApiKey = useCallback(async (apiKeyId: string): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await apiKeyService.reactivateApiKey(apiKeyId, user.id)
      if (result.error) {
        setError(result.error)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const deleteApiKey = useCallback(async (apiKeyId: string): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await apiKeyService.deleteApiKey(apiKeyId, user.id)
      if (result.error) {
        setError(result.error)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const initializeReplicateForUser = useCallback(async (
    apiKey: string
  ): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await apiKeyService.initializeReplicateForUser(user.id, apiKey)
      if (result.error) {
        setError(result.error)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    loading,
    error,
    addApiKey,
    getUserApiKeys,
    validateApiKey,
    deactivateApiKey,
    reactivateApiKey,
    deleteApiKey,
    initializeReplicateForUser
  }
} 