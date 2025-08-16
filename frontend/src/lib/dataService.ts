import { supabase } from './supabase';

export interface Model {
  model_name: string;
  owner: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  total_runs?: number;
  input_schema?: any;
  output_schema?: any;
  collection: string; // Added by our service
  latest_version_id?: string;
  id: string; // Added by our service
}

export interface Collection {
  collection_name: string;
  total_models: number;
  models_with_data: number;
  models_missing_data: number;
  data_coverage: string;
  total_runs_in_collection: number;
  top_model_by_runs: string;
  models: Model[];
}

export interface Category {
  name: string;
  description: string;
  modelCount: number;
  totalRuns: number;
}

// Get all collections from database
export const getCollections = async (): Promise<Collection[]> => {
  try {
    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return [];
    }

    // Get all models
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*')
      .eq('is_active', true)
      .order('total_runs', { ascending: false });

    if (modelsError) {
      console.error('Error fetching models:', modelsError);
      return [];
    }

    // Group models by collection
    const collectionsMap = new Map<string, Model[]>();
    models?.forEach(model => {
      const collection = model.collection;
      if (!collectionsMap.has(collection)) {
        collectionsMap.set(collection, []);
      }
      collectionsMap.get(collection)!.push({
        ...model,
        collection: model.collection,
        id: model.id
      });
    });

    // Create collection objects
    const collections: Collection[] = [];
    for (const [collectionName, models] of collectionsMap) {
      const totalRuns = models.reduce((sum, model) => sum + (model.total_runs || 0), 0);
      const topModel = models.reduce((top, model) => 
        (model.total_runs || 0) > (top.total_runs || 0) ? model : top
      , models[0]);

      collections.push({
        collection_name: collectionName,
        total_models: models.length,
        models_with_data: models.filter(m => m.description && m.description.trim() !== '').length,
        models_missing_data: models.filter(m => !m.description || m.description.trim() === '').length,
        data_coverage: `${Math.round((models.filter(m => m.description && m.description.trim() !== '').length / models.length) * 100)}%`,
        total_runs_in_collection: totalRuns,
        top_model_by_runs: topModel?.name || '',
        models: models
      });
    }

    return collections;
  } catch (error) {
    console.error('Error getting collections:', error);
    return [];
  }
};

// Get all categories with model counts
export const getCategories = async (): Promise<Category[]> => {
  try {
    const collections = await getCollections();

    return collections.map(collection => ({
      name: collection.collection_name,
      description: getCategoryDescription(collection.collection_name),
      modelCount: collection.total_models,
      totalRuns: collection.total_runs_in_collection
    }));
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
};

// Get all models
export const getAllModels = async (): Promise<Model[]> => {
  try {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('is_active', true)
      .order('total_runs', { ascending: false });

    if (error) {
      console.error('Error fetching models:', error);
      return [];
    }

    return data?.map(model => ({
      ...model,
      collection: model.collection,
      id: model.id
    })) || [];
  } catch (error) {
    console.error('Error getting all models:', error);
    return [];
  }
};

// Get models by category
export const getModelsByCategory = async (categoryName: string): Promise<Model[]> => {
  try {
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

    return data?.map(model => ({
      ...model,
      collection: model.collection,
      id: model.id
    })) || [];
  } catch (error) {
    console.error('Error getting models by category:', error);
    return [];
  }
};

// Get model by ID
export const getModelById = async (id: string): Promise<Model | null> => {
  try {
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

    return data ? {
      ...data,
      collection: data.collection,
      id: data.id
    } : null;
  } catch (error) {
    console.error('Error getting model by ID:', error);
    return null;
  }
};

// Search models
export const searchModels = async (query: string): Promise<Model[]> => {
  try {
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

    return data?.map(model => ({
      ...model,
      collection: model.collection,
      id: model.id
    })) || [];
  } catch (error) {
    console.error('Error searching models:', error);
    return [];
  }
};

// Get category description
const getCategoryDescription = (categoryName: string): string => {
  const descriptions: { [key: string]: string } = {
    'Generate images': 'Create stunning images from text descriptions',
    'Generate videos': 'Transform text into dynamic video content',
    'Edit images': 'Enhance and modify existing images',
    'Use LLMs': 'Large language models for text generation',
    'Upscale images': 'Increase image resolution and quality',
    'Generate music': 'Create original music and audio content',
    'Use a face to make images': 'Generate images using facial features',
    'Caption images': 'Generate descriptions for images',
    'Generate speech': 'Convert text to natural speech',
    'Remove backgrounds': 'Extract subjects from image backgrounds',
    'Classify images': 'Identify objects and scenes in images',
    'Generate 3D': 'Create 3D models and scenes',
    'Use FLUX fine-tunes': 'Custom fine-tuned models for specific tasks',
    'Use official models': 'Official and verified AI models',
    'Edit videos': 'Modify and enhance video content',
    'Generate audio': 'Create various types of audio content',
    'Transcribe audio': 'Convert speech to text',
    'Translate text': 'Translate between different languages',
    'Summarize text': 'Create concise summaries of text content',
    'Generate code': 'Generate code snippets and programs',
    'Analyze sentiment': 'Analyze emotional tone in text',
    'Extract text': 'Extract text from images and documents',
    'Generate embeddings': 'Create vector representations of data',
    'Detect objects': 'Identify objects in images',
    'Segment images': 'Separate image regions by content',
    'Generate masks': 'Create masks for image editing',
    'Restore images': 'Repair and enhance damaged images',
    'Animate images': 'Add motion to static images',
    'Generate avatars': 'Create personalized avatar images',
    'Make 3D stuff': 'Create 3D models, scenes, and assets'
  };
  
  return descriptions[categoryName] || 'AI models for various tasks';
};

// Get total model count
export const getTotalModelCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('models')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error getting model count:', error);
      return 0;
    }
    return count || 0;
  } catch (error) {
    console.error('Error getting total model count:', error);
    return 0;
  }
};

// Get total collection count
export const getTotalCollectionCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error getting category count:', error);
      return 0;
    }
    return count || 0;
  } catch (error) {
    console.error('Error getting total collection count:', error);
    return 0;
  }
};

// Get summary statistics
export const getSummaryStats = async () => {
  try {
    const [totalModels, totalCategories] = await Promise.all([
      getTotalModelCount(),
      getTotalCollectionCount()
    ]);

    const { data: models } = await supabase
      .from('models')
      .select('total_runs')
      .eq('is_active', true);

    const totalRuns = models?.reduce((sum, model) => sum + (model.total_runs || 0), 0) || 0;
    const averageRuns = totalModels > 0 ? Math.round(totalRuns / totalModels) : 0;

    return {
      total_collections: totalCategories,
      total_models: totalModels,
      models_with_detailed_data: models?.filter(m => m.total_runs && m.total_runs > 0).length || 0,
      models_missing_data: models?.filter(m => !m.total_runs || m.total_runs === 0).length || 0,
      overall_data_coverage: `${Math.round(((models?.filter(m => m.total_runs && m.total_runs > 0).length || 0) / totalModels) * 100)}%`,
      total_runs_across_all_collections: totalRuns,
      average_runs_per_model: averageRuns
    };
  } catch (error) {
    console.error('Error getting summary stats:', error);
    return {};
  }
}; 