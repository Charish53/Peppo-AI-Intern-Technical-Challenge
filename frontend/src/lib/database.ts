import { supabase } from './supabase';

export interface Model {
  id: string;
  model_name: string;
  owner: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  total_runs?: number;
  input_schema?: any;
  output_schema?: any;
  collection: string;
  latest_version_id?: string;
  is_featured?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Database operations for Models
export const modelService = {
  // Get all models
  async getAllModels(): Promise<Model[]> {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('is_active', true)
      .order('total_runs', { ascending: false });

    if (error) {
      console.error('Error fetching models:', error);
      return [];
    }
    return data || [];
  },

  // Get models by category
  async getModelsByCategory(categoryName: string): Promise<Model[]> {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('collection', categoryName)
      .eq('is_active', true)
      .order('total_runs', { ascending: false });

    if (error) {
      console.error('Error fetching models by category:', error);
      return [];
    }
    return data || [];
  },

  // Get model by ID
  async getModelById(id: string): Promise<Model | null> {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching model by ID:', error);
      return null;
    }
    return data;
  },

  // Search models
  async searchModels(query: string): Promise<Model[]> {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,collection.ilike.%${query}%,owner.ilike.%${query}%`)
      .order('total_runs', { ascending: false });

    if (error) {
      console.error('Error searching models:', error);
      return [];
    }
    return data || [];
  },

  // Get featured models
  async getFeaturedModels(limit: number = 6): Promise<Model[]> {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('total_runs', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured models:', error);
      return [];
    }
    return data || [];
  },

  // Create new model (Admin only)
  async createModel(model: Omit<Model, 'id' | 'created_at' | 'updated_at'>): Promise<Model | null> {
    const { data, error } = await supabase
      .from('models')
      .insert([model])
      .select()
      .single();

    if (error) {
      console.error('Error creating model:', error);
      return null;
    }
    return data;
  },

  // Update model (Admin only)
  async updateModel(id: string, updates: Partial<Model>): Promise<Model | null> {
    const { data, error } = await supabase
      .from('models')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating model:', error);
      return null;
    }
    return data;
  },

  // Delete model (Admin only)
  async deleteModel(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting model:', error);
      return false;
    }
    return true;
  },

  // Soft delete model (Admin only)
  async softDeleteModel(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('models')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error soft deleting model:', error);
      return false;
    }
    return true;
  }
};

// Database operations for Categories
export const categoryService = {
  // Get all categories
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return data || [];
  },

  // Get category by ID
  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching category by ID:', error);
      return null;
    }
    return data;
  },

  // Create new category (Admin only)
  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return null;
    }
    return data;
  },

  // Update category (Admin only)
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return null;
    }
    return data;
  },

  // Delete category (Admin only)
  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return false;
    }
    return true;
  }
};

// Statistics service
export const statsService = {
  // Get total model count
  async getTotalModelCount(): Promise<number> {
    const { count, error } = await supabase
      .from('models')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error getting model count:', error);
      return 0;
    }
    return count || 0;
  },

  // Get total category count
  async getTotalCategoryCount(): Promise<number> {
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error getting category count:', error);
      return 0;
    }
    return count || 0;
  },

  // Get models by collection with counts
  async getCategoriesWithCounts(): Promise<Array<Category & { modelCount: number; totalRuns: number }>> {
    const { data, error } = await supabase
      .from('models')
      .select('collection, total_runs')
      .eq('is_active', true);

    if (error) {
      console.error('Error getting categories with counts:', error);
      return [];
    }

    const categoryStats = data?.reduce((acc, model) => {
      const collection = model.collection;
      if (!acc[collection]) {
        acc[collection] = { modelCount: 0, totalRuns: 0 };
      }
      acc[collection].modelCount++;
      acc[collection].totalRuns += model.total_runs || 0;
      return acc;
    }, {} as Record<string, { modelCount: number; totalRuns: number }>);

    const categories = await this.getAllCategories();
    return categories.map(category => ({
      ...category,
      modelCount: categoryStats[category.name]?.modelCount || 0,
      totalRuns: categoryStats[category.name]?.totalRuns || 0
    }));
  }
}; 