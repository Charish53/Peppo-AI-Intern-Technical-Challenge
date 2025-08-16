import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Get user's API keys
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, is_active, created_at, last_used_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch API keys' });
    }

    res.json({ apiKeys: apiKeys || [] });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Add new API key
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('api_key').isLength({ min: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, api_key } = req.body;

    // Hash the API key
    const keyHash = crypto.createHash('sha256').update(api_key).digest('hex');

    // Check if API key already exists
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('key_hash', keyHash)
      .single();

    if (existingKey) {
      return res.status(400).json({ error: 'API key already exists' });
    }

    // Store the hashed API key
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: req.user.id,
        name,
        key_hash: keyHash,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to add API key' });
    }

    res.status(201).json({
      message: 'API key added successfully',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        is_active: apiKey.is_active,
        created_at: apiKey.created_at
      }
    });
  } catch (error) {
    console.error('Add API key error:', error);
    res.status(500).json({ error: 'Failed to add API key' });
  }
});

// Update API key status
router.patch('/:id', authenticateToken, [
  body('is_active').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .update({ is_active })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update API key' });
    }

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      message: 'API key updated successfully',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        is_active: apiKey.is_active
      }
    });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Delete API key
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete API key' });
    }

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Validate API key
router.post('/validate', authenticateToken, [
  body('api_key').isLength({ min: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { api_key } = req.body;

    // Hash the API key
    const keyHash = crypto.createHash('sha256').update(api_key).digest('hex');

    // Check if API key exists and is active
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('id, is_active')
      .eq('user_id', req.user.id)
      .eq('key_hash', keyHash)
      .single();

    if (error || !apiKey) {
      return res.status(400).json({ error: 'Invalid API key' });
    }

    if (!apiKey.is_active) {
      return res.status(400).json({ error: 'API key is inactive' });
    }

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id);

    res.json({ 
      message: 'API key is valid',
      apiKeyId: apiKey.id
    });
  } catch (error) {
    console.error('Validate API key error:', error);
    res.status(500).json({ error: 'Failed to validate API key' });
  }
});

export default router; 