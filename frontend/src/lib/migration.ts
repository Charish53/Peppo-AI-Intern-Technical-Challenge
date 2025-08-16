import { supabase } from './supabase';

export interface MigrationStatus {
  categoriesCount: number;
  modelsCount: number;
  needsMigration: boolean;
}

export const migrationService = {
  // Check migration status
  async checkMigrationStatus(): Promise<MigrationStatus> {
    try {
      const [categoriesCount, modelsCount] = await Promise.all([
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('models').select('*', { count: 'exact', head: true })
      ]);

      const totalCategories = categoriesCount.count || 0;
      const totalModels = modelsCount.count || 0;

      // For thousands of models, we need a higher threshold
      // Allow migration if you have less than 5000 models (should cover most cases)
      const needsMigration = totalCategories < 25 || totalModels < 5000;

      return {
        categoriesCount: totalCategories,
        modelsCount: totalModels,
        needsMigration
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        categoriesCount: 0,
        modelsCount: 0,
        needsMigration: true
      };
    }
  },

  // Run full migration
  async runMigration(): Promise<void> {
    try {
      console.log('Starting migration...');
      
      // Dynamically import the JSON data
      const modelData = await this.loadModelData();
      
      if (!modelData || !modelData.collections) {
        throw new Error('Failed to load model data');
      }
      
      // First, migrate categories
      await this.migrateCategories(modelData);
      
      // Then, migrate models
      await this.migrateModels(modelData);
      
      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  // Load model data dynamically
  async loadModelData(): Promise<any> {
    try {
      // Use dynamic import to avoid blocking the app
      const data = await import('../data/model_data.json');
      return data.default || data;
    } catch (error) {
      console.error('Failed to load model_data.json:', error);
      throw new Error('Model data file not available for migration');
    }
  },

  // Migrate categories from JSON
  async migrateCategories(modelData: any): Promise<void> {
    try {
      if (!modelData || !modelData.collections) {
        throw new Error('Model data not available');
      }

      const collections = modelData.collections;
      const categories = Object.keys(collections).map(key => ({
        id: key,
        name: collections[key].collection_name,
        description: this.getCategoryDescription(collections[key].collection_name),
        is_active: true
      }));

      console.log(`Starting to migrate ${categories.length} categories...`);

      // Insert categories with conflict handling
      for (const category of categories) {
        const { error } = await supabase
          .from('categories')
          .upsert(category, { onConflict: 'id' });

        if (error) {
          console.error(`Error inserting category ${category.id}:`, error);
        }
      }

      console.log(`✅ Migrated ${categories.length} categories`);
    } catch (error) {
      console.error('Error migrating categories:', error);
      throw error;
    }
  },

  // Migrate models from JSON
  async migrateModels(modelData: any): Promise<void> {
    try {
      if (!modelData || !modelData.collections) {
        throw new Error('Model data not available');
      }

      const collections = modelData.collections;
      let totalModels = 0;
      let processedModels = 0;

      // Count total models first
      const totalModelsInData = Object.values(collections).reduce((total: number, collection: any) => {
        return total + (collection.models?.length || 0);
      }, 0);

      console.log(`Starting to migrate ${totalModelsInData} models...`);

      for (const [collectionKey, collection] of Object.entries(collections)) {
        const models = collection.models || [];
        
        console.log(`Processing collection: ${collection.collection_name} (${models.length} models)`);
        
        for (const model of models) {
          const modelData = {
            id: `${model.owner}/${model.name}`,
            model_name: model.model_name || model.name,
            owner: model.owner,
            name: model.name,
            description: model.description || '',
            cover_image_url: model.cover_image_url || '',
            total_runs: model.total_runs || 0,
            input_schema: model.input_schema || null,
            output_schema: model.output_schema || null,
            collection: collection.collection_name,
            latest_version_id: model.latest_version_id || null,
            is_featured: model.is_featured || false,
            is_active: true
          };

          const { error } = await supabase
            .from('models')
            .upsert(modelData, { onConflict: 'id' });

          if (error) {
            console.error(`Error inserting model ${modelData.id}:`, error);
          } else {
            totalModels++;
          }

          processedModels++;
          
          // Log progress every 100 models
          if (processedModels % 100 === 0) {
            console.log(`Progress: ${processedModels}/${totalModelsInData} models processed (${totalModels} inserted)`);
          }
        }
      }

      console.log(`✅ Migration completed! Total models inserted: ${totalModels}`);
    } catch (error) {
      console.error('Error migrating models:', error);
      throw error;
    }
  },

  // Get category description
  getCategoryDescription(categoryName: string): string {
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
  }
}; 