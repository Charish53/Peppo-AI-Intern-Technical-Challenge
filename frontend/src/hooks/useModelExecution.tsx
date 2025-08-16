import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { modelExecutionService, type ExecutionResult } from '../lib/modelExecutionService'
import { apiKeyService } from '../lib/apiKeyService'
import type { Database } from '../lib/supabase'

type ModelExecution = Database['public']['Tables']['model_executions']['Row']

export function useModelExecution() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startExecution = useCallback(async (
    modelId: string,
    modelName: string,
    inputData: any,
    apiKey: string
  ): Promise<{ executionId: string | null; error: string | null }> => {
    if (!user) {
      return { executionId: null, error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      // Initialize Replicate with user's API key
      const { error: initError } = await apiKeyService.initializeReplicateForUser(user.id, apiKey)
      if (initError) {
        return { executionId: null, error: initError }
      }

      // Start the execution
      const { executionId, error: execError } = await modelExecutionService.startExecution(
        user.id,
        modelId,
        modelName,
        inputData,
        apiKey
      )

      if (execError) {
        return { executionId: null, error: execError }
      }

      return { executionId, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { executionId: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const getExecution = useCallback(async (executionId: string): Promise<{ execution: ModelExecution | null; error: string | null }> => {
    if (!user) {
      return { execution: null, error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await modelExecutionService.getExecution(executionId)
      
      // Check if the execution belongs to the current user
      if (result.execution && result.execution.user_id !== user.id) {
        return { execution: null, error: 'Access denied' }
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { execution: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const getUserExecutions = useCallback(async (
    limit: number = 50,
    offset: number = 0
  ): Promise<{ executions: ModelExecution[]; error: string | null }> => {
    if (!user) {
      return { executions: [], error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await modelExecutionService.getUserExecutions(user.id, limit, offset)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { executions: [], error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const cancelExecution = useCallback(async (executionId: string): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'User not authenticated' }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await modelExecutionService.cancelExecution(executionId, user.id)
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

  const getUserStats = useCallback(async (): Promise<{
    total_executions: number
    successful_executions: number
    failed_executions: number
    total_cost_usd: number
    average_execution_time_ms: number
    error: string | null
  }> => {
    if (!user) {
      return {
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        total_cost_usd: 0,
        average_execution_time_ms: 0,
        error: 'User not authenticated'
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await modelExecutionService.getUserStats(user.id)
      if (result.error) {
        setError(result.error)
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return {
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        total_cost_usd: 0,
        average_execution_time_ms: 0,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    loading,
    error,
    startExecution,
    getExecution,
    getUserExecutions,
    cancelExecution,
    getUserStats
  }
} 