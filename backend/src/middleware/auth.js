import jwt from 'jsonwebtoken';
import { supabase } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    console.log('🔐 [AUTH MIDDLEWARE] Verifying Supabase JWT token...');
    console.log('   - Token length:', token.length);
    console.log('   - Token starts with:', token.substring(0, 20) + '...');
    console.log('   - Full token:', token);

    // Verify Supabase JWT token using the service role key
    console.log('🔐 [AUTH MIDDLEWARE] Calling supabase.auth.getUser...');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    console.log('🔐 [AUTH MIDDLEWARE] supabase.auth.getUser result:');
    console.log('   - User:', user ? 'exists' : 'null');
    console.log('   - Error:', error);

    if (error || !user) {
      console.log('❌ [AUTH MIDDLEWARE] Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('✅ [AUTH MIDDLEWARE] Token verified successfully');
    console.log('   - User ID:', user.id);
    console.log('   - User email:', user.email);

    // Get user profile from our users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('⚠️ [AUTH MIDDLEWARE] User profile not found, creating one...');
      // Create user profile if it doesn't exist
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name
        });

      if (createError) {
        console.error('❌ [AUTH MIDDLEWARE] Failed to create user profile:', createError);
        return res.status(500).json({ error: 'Failed to create user profile' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name
      };
    } else {
      req.user = userProfile;
    }

    console.log('✅ [AUTH MIDDLEWARE] User authenticated:', req.user.id);
    next();
  } catch (error) {
    console.error('❌ [AUTH MIDDLEWARE] Authentication error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

export const authenticateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'API key required' });
    }

    console.log('🔑 [API KEY MIDDLEWARE] Validating API key...');
    console.log('   - Token length:', token.length);
    console.log('   - Token starts with:', token.substring(0, 10) + '...');

    // Get user from API key
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('user_id, name, is_active')
      .eq('key_hash', token)
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKey) {
      console.log('❌ [API KEY MIDDLEWARE] Invalid or inactive API key');
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', apiKey.user_id)
      .single();

    if (userError || !user) {
      console.log('❌ [API KEY MIDDLEWARE] User not found');
      return res.status(401).json({ error: 'User not found' });
    }

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', token);

    req.user = user;
    req.apiKey = {
      id: apiKey.user_id,
      name: apiKey.name
    };

    console.log('✅ [API KEY MIDDLEWARE] API key validated successfully');
    console.log('   - User ID:', user.id);
    console.log('   - User email:', user.email);
    console.log('   - API Key name:', apiKey.name);

    next();
  } catch (error) {
    console.error('❌ [API KEY MIDDLEWARE] Authentication error:', error);
    res.status(500).json({ error: 'API key validation error' });
  }
};

export const requireApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith('r8_')) {
      return res.status(401).json({ error: 'Invalid API key format' });
    }

    req.apiKey = apiKey;
    next();
  } catch (error) {
    console.error('API key middleware error:', error);
    res.status(500).json({ error: 'API key validation error' });
  }
};

export const validateUserOwnership = (resourceUserId) => {
  return (req, res, next) => {
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}; 