import { supabase } from './supabase';

export interface ModelData {
  id: string;
  name: string;
  description: string;
  category: string;
  model_url: string;
  author: string;
  tags: string[];
  image_url?: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalCredits: number;
  totalTransactions: number;
  totalModels: number;
}

export const adminService = {
  // Get all models (admin only)
  async getModels(): Promise<ModelData[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/admin/models', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  },

  // Create new model (admin only)
  async createModel(modelData: Omit<ModelData, 'id' | 'created_at' | 'updated_at'>): Promise<ModelData | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(modelData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create model');
      }

      const data = await response.json();
      return data.model;
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  },

  // Update model (admin only)
  async updateModel(id: string, updateData: Partial<ModelData>): Promise<ModelData | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/admin/models/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update model');
      }

      const data = await response.json();
      return data.model;
    } catch (error) {
      console.error('Error updating model:', error);
      throw error;
    }
  },

  // Delete model (admin only)
  async deleteModel(id: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/admin/models/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting model:', error);
      return false;
    }
  },

  // Get system statistics (admin only)
  async getStats(): Promise<UserStats | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  },

  // Get public models (for non-admin users)
  async getPublicModels(): Promise<ModelData[]> {
    try {
      const response = await fetch('/api/admin/public/models');

      if (!response.ok) {
        throw new Error('Failed to fetch public models');
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching public models:', error);
      return [];
    }
  }
}; 