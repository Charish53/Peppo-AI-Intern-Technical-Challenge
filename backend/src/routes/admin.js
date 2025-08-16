import express from 'express';
import { authenticateToken as auth } from '../middleware/auth.js';
import { supabase } from '../config/database.js';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(req.user.id);
    
    if (error || !user || user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Get all models (admin only)
router.get('/models', auth, requireAdmin, async (req, res) => {
  try {
    const { data: models, error } = await supabase
      .from('models')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching models:', error);
      return res.status(500).json({ error: 'Failed to fetch models' });
    }

    res.json({ models: models || [] });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({ error: 'Failed to get models' });
  }
});

// Create new model (admin only)
router.post('/models', auth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      modelUrl,
      author,
      tags,
      imageUrl,
      price,
      isActive
    } = req.body;

    // Validate required fields
    if (!name || !description || !category || !modelUrl || !author) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: model, error } = await supabase
      .from('models')
      .insert({
        name,
        description,
        category,
        model_url: modelUrl,
        author,
        tags: tags || [],
        image_url: imageUrl,
        price: price || 1,
        is_active: isActive !== undefined ? isActive : true,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating model:', error);
      return res.status(500).json({ error: 'Failed to create model' });
    }

    res.status(201).json({ model });
  } catch (error) {
    console.error('Error creating model:', error);
    res.status(500).json({ error: 'Failed to create model' });
  }
});

// Update model (admin only)
router.patch('/models/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;

    // Transform field names to match database
    if (updateData.modelUrl) {
      updateData.model_url = updateData.modelUrl;
      delete updateData.modelUrl;
    }
    if (updateData.imageUrl) {
      updateData.image_url = updateData.imageUrl;
      delete updateData.imageUrl;
    }
    if (updateData.isActive !== undefined) {
      updateData.is_active = updateData.isActive;
      delete updateData.isActive;
    }

    const { data: model, error } = await supabase
      .from('models')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating model:', error);
      return res.status(500).json({ error: 'Failed to update model' });
    }

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json({ model });
  } catch (error) {
    console.error('Error updating model:', error);
    res.status(500).json({ error: 'Failed to update model' });
  }
});

// Delete model (admin only)
router.delete('/models/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting model:', error);
      return res.status(500).json({ error: 'Failed to delete model' });
    }

    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

// Get system statistics (admin only)
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('Error counting users:', usersError);
    }

    // Get total credits across all users
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('amount, type');

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    }

    let totalCredits = 0;
    let totalTransactions = 0;

    if (transactions) {
      totalTransactions = transactions.length;
      totalCredits = transactions.reduce((total, transaction) => {
        if (transaction.type === 'purchase' || transaction.type === 'refund') {
          return total + transaction.amount;
        } else {
          return total - transaction.amount;
        }
      }, 0);
    }

    // Get total models
    const { count: totalModels, error: modelsError } = await supabase
      .from('models')
      .select('*', { count: 'exact', head: true });

    if (modelsError) {
      console.error('Error counting models:', modelsError);
    }

    res.json({
      totalUsers: totalUsers || 0,
      activeUsers: totalUsers || 0, // You can add logic to count active users
      totalCredits: Math.max(0, totalCredits),
      totalTransactions: totalTransactions,
      totalModels: totalModels || 0
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get public models (for non-admin users)
router.get('/public/models', async (req, res) => {
  try {
    const { data: models, error } = await supabase
      .from('models')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public models:', error);
      return res.status(500).json({ error: 'Failed to fetch models' });
    }

    res.json({ models: models || [] });
  } catch (error) {
    console.error('Error getting public models:', error);
    res.status(500).json({ error: 'Failed to get models' });
  }
});

export default router; 