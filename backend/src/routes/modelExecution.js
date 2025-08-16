import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase, EXECUTION_STATUS } from '../config/database.js';
import { authenticateToken, requireApiKey } from '../middleware/auth.js';
import ReplicateService from '../services/replicateService.js';

const router = express.Router();

// Get user's model executions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { data: executions, error } = await supabase
      .from('model_executions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch executions' });
    }

    res.json({ executions: executions || [] });
  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
});

// Get specific execution
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: execution, error } = await supabase
      .from('model_executions')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json({ execution });
  } catch (error) {
    console.error('Get execution error:', error);
    res.status(500).json({ error: 'Failed to fetch execution' });
  }
});

// Start new model execution
router.post('/', [authenticateToken, requireApiKey], [
  body('model_id').notEmpty(),
  body('model_name').notEmpty(),
  body('version_id').notEmpty(),
  body('input_data').isObject()
], async (req, res) => {
  console.log('🚀 [MODEL EXECUTION] Starting new model execution request');
  console.log('👤 [MODEL EXECUTION] User ID:', req.user.id);
  console.log('🔑 [MODEL EXECUTION] API Key provided:', req.apiKey ? 'Yes' : 'No');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [MODEL EXECUTION] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { model_id, model_name, version_id, input_data } = req.body;
    console.log('📋 [MODEL EXECUTION] Request data:');
    console.log('   - Model ID:', model_id);
    console.log('   - Model Name:', model_name);
    console.log('   - Version ID:', version_id);
    console.log('   - Input Data:', JSON.stringify(input_data, null, 2));

    // Create execution record
    console.log('💾 [MODEL EXECUTION] Creating database record...');
    const { data: execution, error } = await supabase
      .from('model_executions')
      .insert({
        user_id: req.user.id,
        model_id,
        model_name,
        input_data,
        status: EXECUTION_STATUS.PENDING
      })
      .select()
      .single();

    if (error) {
      console.log('❌ [MODEL EXECUTION] Database error:', error);
      return res.status(500).json({ error: 'Failed to create execution' });
    }
    
    console.log('✅ [MODEL EXECUTION] Database record created successfully');
    console.log('   - Execution ID:', execution.id);
    console.log('   - Status:', execution.status);
    console.log('   - Created at:', execution.created_at);

    // Start actual Replicate execution
    try {
      console.log('🔄 [MODEL EXECUTION] Starting Replicate execution...');
      console.log('   - Model ID:', model_id);
      console.log('   - Execution ID:', execution.id);
      console.log('   - Input data size:', JSON.stringify(input_data).length, 'characters');
      
      const prediction = await ReplicateService.startExecution(
        model_id,
        input_data,
        execution.id,
        version_id
      );

      console.log('✅ [MODEL EXECUTION] Replicate execution started successfully');
      console.log('   - Prediction ID:', prediction.id);
      console.log('   - Prediction status:', prediction.status);
      
      res.status(201).json({
        message: 'Execution started',
        execution: {
          id: execution.id,
          status: execution.status,
          created_at: execution.created_at,
          prediction_id: prediction.id
        }
      });
    } catch (error) {
      console.error('❌ [MODEL EXECUTION] Replicate execution error:', error);
      console.error('   - Error message:', error.message);
      console.error('   - Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to start model execution',
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Start execution error:', error);
    res.status(500).json({ error: 'Failed to start execution' });
  }
});

// Update execution status
router.patch('/:id', authenticateToken, [
  body('status').isIn(Object.values(EXECUTION_STATUS)),
  body('output_data').optional(),
  body('error_message').optional(),
  body('execution_time_ms').optional().isInt(),
  body('cost_usd').optional().isFloat()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, output_data, error_message, execution_time_ms, cost_usd } = req.body;

    const { data: execution, error } = await supabase
      .from('model_executions')
      .update({
        status,
        output_data,
        error_message,
        execution_time_ms,
        cost_usd
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update execution' });
    }

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json({
      message: 'Execution updated successfully',
      execution
    });
  } catch (error) {
    console.error('Update execution error:', error);
    res.status(500).json({ error: 'Failed to update execution' });
  }
});

// Check execution status
router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get execution record
    const { data: execution, error: getError } = await supabase
      .from('model_executions')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (getError || !execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    // If execution has external_id, check status with Replicate
    if (execution.external_id) {
      try {
        const prediction = await ReplicateService.checkStatus(
          execution.external_id,
          execution.id
        );

        res.json({
          execution: {
            ...execution,
            prediction_status: prediction.status,
            prediction_output: prediction.output
          }
        });
      } catch (error) {
        console.error('Error checking prediction status:', error);
        res.json({
          execution,
          error: 'Failed to check prediction status'
        });
      }
    } else {
      res.json({ execution });
    }
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ error: 'Failed to check execution status' });
  }
});

// Cancel execution
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get execution to check status
    const { data: execution, error: getError } = await supabase
      .from('model_executions')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (getError || !execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    if (execution.status === EXECUTION_STATUS.COMPLETED || 
        execution.status === EXECUTION_STATUS.FAILED) {
      return res.status(400).json({ error: 'Cannot cancel completed or failed execution' });
    }

    // Cancel with Replicate if external_id exists
    if (execution.external_id) {
      try {
        await ReplicateService.cancelExecution(execution.external_id, execution.id);
        res.json({ message: 'Execution canceled successfully' });
      } catch (error) {
        console.error('Error canceling with Replicate:', error);
        // Fallback to just updating status
        const { error: updateError } = await supabase
          .from('model_executions')
          .update({
            status: EXECUTION_STATUS.FAILED,
            error_message: 'Execution canceled by user'
          })
          .eq('id', id)
          .eq('user_id', req.user.id);

        if (updateError) {
          return res.status(500).json({ error: 'Failed to cancel execution' });
        }

        res.json({ message: 'Execution canceled successfully' });
      }
    } else {
      // Update status to failed with cancellation message
      const { error: updateError } = await supabase
        .from('model_executions')
        .update({
          status: EXECUTION_STATUS.FAILED,
          error_message: 'Execution canceled by user'
        })
        .eq('id', id)
        .eq('user_id', req.user.id);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to cancel execution' });
      }

      res.json({ message: 'Execution canceled successfully' });
    }
  } catch (error) {
    console.error('Cancel execution error:', error);
    res.status(500).json({ error: 'Failed to cancel execution' });
  }
});

// Test Replicate service
router.get('/test-service', async (req, res) => {
  console.log('🧪 [TEST] Testing Replicate service...');
  try {
    const result = await ReplicateService.testService();
    console.log('✅ [TEST] Replicate service test successful:', result);
    res.json({ 
      status: 'success', 
      message: result 
    });
  } catch (error) {
    console.error('❌ [TEST] Replicate service test failed:', error);
    console.error('   - Error message:', error.message);
    console.error('   - Error stack:', error.stack);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to test Replicate service',
      error: error.message 
    });
  }
});

// Test Supabase connection
router.get('/test-supabase', async (req, res) => {
  console.log('🧪 [TEST] Testing Supabase connection...');
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getUser('test-token');
    
    if (error) {
      console.log('❌ [TEST] Supabase connection test failed:', error.message);
      res.json({ 
        status: 'error', 
        message: 'Supabase connection failed',
        error: error.message 
      });
    } else {
      console.log('✅ [TEST] Supabase connection test successful');
      res.json({ 
        status: 'success', 
        message: 'Supabase connection working' 
      });
    }
  } catch (error) {
    console.error('❌ [TEST] Supabase test error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Supabase test failed',
      error: error.message 
    });
  }
});

// Test JWT token verification
router.get('/test-jwt', authenticateToken, async (req, res) => {
  console.log('🔐 [JWT TEST] JWT token verified successfully');
  console.log('   - User ID:', req.user.id);
  console.log('   - User email:', req.user.email);
  
  res.json({
    status: 'success',
    message: 'JWT token is working correctly',
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

// Test Replicate connection
router.get('/test-connection', async (req, res) => {
  console.log('🌐 [TEST] Testing Replicate connection...');
  try {
    const isConnected = await ReplicateService.testConnection();
    
    if (isConnected) {
      console.log('✅ [TEST] Replicate connection test successful');
      res.json({ 
        status: 'success', 
        message: 'Replicate connection successful' 
      });
    } else {
      console.log('❌ [TEST] Replicate connection test failed');
      res.status(500).json({ 
        status: 'error', 
        message: 'Replicate connection failed' 
      });
    }
  } catch (error) {
    console.error('❌ [TEST] Replicate connection test error:', error);
    console.error('   - Error message:', error.message);
    console.error('   - Error stack:', error.stack);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to test Replicate connection',
      error: error.message 
    });
  }
});

// Get model information
router.get('/model/:modelId', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;

    const modelInfo = await ReplicateService.getModelInfo(modelId);
    
    res.json({ model: modelInfo });
  } catch (error) {
    console.error('Get model info error:', error);
    res.status(500).json({ error: 'Failed to get model information' });
  }
});

// Get execution statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { data: executions, error } = await supabase
      .from('model_executions')
      .select('status, cost_usd, execution_time_ms')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    const stats = {
      total_executions: executions.length,
      successful_executions: executions.filter(e => e.status === EXECUTION_STATUS.COMPLETED).length,
      failed_executions: executions.filter(e => e.status === EXECUTION_STATUS.FAILED).length,
      total_cost_usd: executions.reduce((sum, e) => sum + (e.cost_usd || 0), 0),
      average_execution_time_ms: executions.length > 0 
        ? executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / executions.length 
        : 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router; 