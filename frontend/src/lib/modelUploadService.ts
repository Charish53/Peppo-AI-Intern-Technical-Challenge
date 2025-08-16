import { supabase } from './supabase';
import { modelService, categoryService } from './database';

export interface ModelUploadData {
  model_name: string;
  owner: string;
  name: string;
  description: string;
  cover_image_url?: string;
  total_runs: number;
  collection: string;
  latest_version_id?: string;
  is_featured: boolean;
  is_active: boolean;
  input_schema?: any;
  output_schema?: any;
}

export interface UploadValidationResult {
  isValid: boolean;
  errors: string[];
}

export const modelUploadService = {
  // Validate model upload data
  validateModelData(data: ModelUploadData): UploadValidationResult {
    const errors: string[] = [];

    // Required field validation
    if (!data.model_name?.trim()) {
      errors.push('Model name is required');
    }
    if (!data.owner?.trim()) {
      errors.push('Owner is required');
    }
    if (!data.name?.trim()) {
      errors.push('Display name is required');
    }
    if (!data.description?.trim()) {
      errors.push('Description is required');
    }
    if (!data.collection?.trim()) {
      errors.push('Category is required');
    }

    // Format validation
    if (data.model_name && !/^[a-zA-Z0-9-_]+$/.test(data.model_name)) {
      errors.push('Model name should only contain letters, numbers, hyphens, and underscores');
    }
    if (data.owner && !/^[a-zA-Z0-9-_]+$/.test(data.owner)) {
      errors.push('Owner should only contain letters, numbers, hyphens, and underscores');
    }

    // URL validation for cover image
    if (data.cover_image_url && !this.isValidUrl(data.cover_image_url)) {
      errors.push('Cover image URL must be a valid URL');
    }

    // Number validation
    if (data.total_runs < 0) {
      errors.push('Total runs cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Check if URL is valid
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Upload model to database
  async uploadModel(data: ModelUploadData): Promise<{ success: boolean; message: string; modelId?: string }> {
    try {
      // Validate the data
      const validation = this.validateModelData(data);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Check if model already exists
      const existingModel = await modelService.getModelById(`${data.owner}/${data.name}`);
      if (existingModel) {
        return {
          success: false,
          message: 'Model already exists with this owner and name combination'
        };
      }

      // Check if category exists
      const categories = await categoryService.getAllCategories();
      const categoryExists = categories.some(cat => cat.name === data.collection);
      if (!categoryExists) {
        return {
          success: false,
          message: 'Selected category does not exist'
        };
      }

      // Create the model
      const modelData = {
        ...data,
        id: `${data.owner}/${data.name}`,
        input_schema: data.input_schema || null,
        output_schema: data.output_schema || null
      };

      const newModel = await modelService.createModel(modelData);
      
      if (newModel) {
        return {
          success: true,
          message: 'Model uploaded successfully!',
          modelId: newModel.id
        };
      } else {
        return {
          success: false,
          message: 'Failed to create model in database'
        };
      }
    } catch (error) {
      console.error('Error uploading model:', error);
      return {
        success: false,
        message: 'An error occurred while uploading the model'
      };
    }
  },

  // Get all categories for dropdown
  async getCategories(): Promise<{ id: string; name: string }[]> {
    try {
      const categories = await categoryService.getAllCategories();
      return categories.map(cat => ({
        id: cat.id,
        name: cat.name
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Generate model ID from owner and name
  generateModelId(owner: string, name: string): string {
    return `${owner}/${name}`;
  },

  // Format model data for display
  formatModelData(data: ModelUploadData): ModelUploadData {
    return {
      ...data,
      model_name: data.model_name?.trim().toLowerCase(),
      owner: data.owner?.trim().toLowerCase(),
      name: data.name?.trim(),
      description: data.description?.trim(),
      collection: data.collection?.trim()
    };
  }
}; 