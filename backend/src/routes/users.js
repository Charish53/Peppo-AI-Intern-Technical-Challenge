import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to fetch preferences' });
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      default_model_id: null,
      theme: 'system',
      notifications_enabled: true
    };

    res.json({ preferences: preferences || defaultPreferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { default_model_id, theme, notifications_enabled } = req.body;

    // Check if preferences exist
    const { data: existingPreferences } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let preferences;
    let error;

    if (existingPreferences) {
      // Update existing preferences
      const result = await supabase
        .from('user_preferences')
        .update({
          default_model_id,
          theme,
          notifications_enabled
        })
        .eq('user_id', req.user.id)
        .select()
        .single();
      
      preferences = result.data;
      error = result.error;
    } else {
      // Create new preferences
      const result = await supabase
        .from('user_preferences')
        .insert({
          user_id: req.user.id,
          default_model_id,
          theme,
          notifications_enabled
        })
        .select()
        .single();
      
      preferences = result.data;
      error = result.error;
    }

    if (error) {
      return res.status(500).json({ error: 'Failed to update preferences' });
    }

    res.json({
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get user dashboard stats
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get execution stats
    const { data: executions } = await supabase
      .from('model_executions')
      .select('status, cost_usd, execution_time_ms, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get API key stats
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('is_active, created_at')
      .eq('user_id', req.user.id);

    // Calculate stats
    const totalExecutions = executions?.length || 0;
    const successfulExecutions = executions?.filter(e => e.status === 'completed').length || 0;
    const totalCost = executions?.reduce((sum, e) => sum + (e.cost_usd || 0), 0) || 0;
    const activeApiKeys = apiKeys?.filter(k => k.is_active).length || 0;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentExecutions = executions?.filter(e => 
      new Date(e.created_at) > sevenDaysAgo
    ).length || 0;

    const dashboardStats = {
      total_executions: totalExecutions,
      successful_executions: successfulExecutions,
      success_rate: totalExecutions > 0 ? (successfulExecutions / totalExecutions * 100).toFixed(1) : 0,
      total_cost_usd: totalCost,
      active_api_keys: activeApiKeys,
      recent_executions: recentExecutions,
      recent_executions_list: executions?.slice(0, 5) || []
    };

    res.json({ dashboardStats });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router; 