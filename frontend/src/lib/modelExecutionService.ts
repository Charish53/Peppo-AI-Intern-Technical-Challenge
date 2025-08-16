import { supabase } from './supabase'
import { getReplicateService, type ReplicatePrediction } from './replicateService'
import type { Database } from './supabase'

type ModelExecution = Database['public']['Tables']['model_executions']['Row']
type ModelExecutionInsert = Database['public']['Tables']['model_executions']['Insert']
type ModelExecutionUpdate = Database['public']['Tables']['model_executions']['Update']

export interface ExecutionResult {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  output_data?: any
  error_message?: string
  execution_time_ms?: number
  cost_usd?: number
}

export class ModelExecutionService {
  // Start a new model execution
  async startExecution(
    userId: string,
    modelId: string,
    modelName: string,
    inputData: any,
    replicateApiKey: string
  ): Promise<{ executionId: string; error: string | null }> {
    try {
      // Initialize Replicate service with user's API key
      const replicateService = getReplicateService()
      
      // Create execution record in database
      const { data: execution, error: dbError } = await supabase
        .from('model_executions')
        .insert({
          user_id: userId,
          model_id: modelId,
          model_name: modelName,
          input_data: inputData,
          status: 'pending'
        })
        .select()
        .single()

      if (dbError) {
        return { executionId: '', error: dbError.message }
      }

      // Start Replicate prediction
      const prediction = await replicateService.startPrediction(modelId, inputData)

      // Update execution with Replicate prediction ID
      await supabase
        .from('model_executions')
        .update({
          status: 'processing',
          replicate_prediction_id: prediction.id
        })
        .eq('id', execution.id)

      // Start polling for results
      this.pollExecutionResult(execution.id, prediction.id, replicateService)

      return { executionId: execution.id, error: null }
    } catch (error) {
      console.error('Error starting execution:', error)
      return { executionId: '', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Poll for execution results
  private async pollExecutionResult(
    executionId: string,
    predictionId: string,
    replicateService: any
  ) {
    try {
      const prediction = await replicateService.pollPrediction(
        predictionId,
        async (prediction: ReplicatePrediction) => {
          // Update status in database
          await supabase
            .from('model_executions')
            .update({
              status: prediction.status === 'succeeded' ? 'completed' : 
                     prediction.status === 'failed' ? 'failed' : 'processing'
            })
            .eq('id', executionId)
        }
      )

      // Update final result
      const executionTime = prediction.completed_at && prediction.started_at
        ? new Date(prediction.completed_at).getTime() - new Date(prediction.started_at).getTime()
        : null

      await supabase
        .from('model_executions')
        .update({
          status: prediction.status === 'succeeded' ? 'completed' : 'failed',
          output_data: prediction.output || null,
          error_message: prediction.error || null,
          execution_time_ms: executionTime,
          cost_usd: prediction.metrics?.cost || null
        })
        .eq('id', executionId)

    } catch (error) {
      console.error('Error polling execution result:', error)
      
      // Update execution as failed
      await supabase
        .from('model_executions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', executionId)
    }
  }

  // Get execution by ID
  async getExecution(executionId: string): Promise<{ execution: ModelExecution | null; error: string | null }> {
    const { data, error } = await supabase
      .from('model_executions')
      .select('*')
      .eq('id', executionId)
      .single()

    if (error) {
      return { execution: null, error: error.message }
    }

    return { execution: data, error: null }
  }

  // Get user's executions
  async getUserExecutions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ executions: ModelExecution[]; error: string | null }> {
    const { data, error } = await supabase
      .from('model_executions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return { executions: [], error: error.message }
    }

    return { executions: data || [], error: null }
  }

  // Cancel execution
  async cancelExecution(executionId: string, userId: string): Promise<{ error: string | null }> {
    // Get execution to check ownership and get Replicate prediction ID
    const { data: execution, error: getError } = await supabase
      .from('model_executions')
      .select('*')
      .eq('id', executionId)
      .eq('user_id', userId)
      .single()

    if (getError) {
      return { error: getError.message }
    }

    if (!execution) {
      return { error: 'Execution not found or access denied' }
    }

    if (execution.status === 'completed' || execution.status === 'failed') {
      return { error: 'Cannot cancel completed or failed execution' }
    }

    // Cancel in Replicate if we have a prediction ID
    if (execution.replicate_prediction_id) {
      try {
        const replicateService = getReplicateService()
        await replicateService.cancelPrediction(execution.replicate_prediction_id)
      } catch (error) {
        console.error('Error canceling Replicate prediction:', error)
      }
    }

    // Update status in database
    const { error: updateError } = await supabase
      .from('model_executions')
      .update({
        status: 'failed',
        error_message: 'Execution canceled by user'
      })
      .eq('id', executionId)

    return { error: updateError?.message || null }
  }

  // Get execution statistics for user
  async getUserStats(userId: string): Promise<{
    total_executions: number
    successful_executions: number
    failed_executions: number
    total_cost_usd: number
    average_execution_time_ms: number
    error: string | null
  }> {
    const { data, error } = await supabase
      .from('model_executions')
      .select('status, cost_usd, execution_time_ms')
      .eq('user_id', userId)

    if (error) {
      return {
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        total_cost_usd: 0,
        average_execution_time_ms: 0,
        error: error.message
      }
    }

    const executions = data || []
    const total = executions.length
    const successful = executions.filter(e => e.status === 'completed').length
    const failed = executions.filter(e => e.status === 'failed').length
    const totalCost = executions.reduce((sum, e) => sum + (e.cost_usd || 0), 0)
    const avgTime = executions.length > 0
      ? executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / executions.length
      : 0

    return {
      total_executions: total,
      successful_executions: successful,
      failed_executions: failed,
      total_cost_usd: totalCost,
      average_execution_time_ms: avgTime,
      error: null
    }
  }
}

// Create singleton instance
export const modelExecutionService = new ModelExecutionService() 