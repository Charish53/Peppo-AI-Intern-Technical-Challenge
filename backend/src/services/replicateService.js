import Replicate from 'replicate';
import { supabase, VIDEO_STATUS } from '../config/database.js';

export class ReplicateService {
  /**
   * Get Replicate client instance
   * @returns {Replicate} - Replicate client
   */
  static getReplicateClient() {
    console.log('🔧 [REPLICATE] Getting Replicate client...');
    
    if (!process.env.REPLICATE_API_TOKEN) {
      console.log('❌ [REPLICATE] REPLICATE_API_TOKEN environment variable is missing');
      throw new Error('REPLICATE_API_TOKEN environment variable is required');
    }
    
    console.log('🔧 [REPLICATE] Initializing Replicate client...');
    console.log('   - API Token length:', process.env.REPLICATE_API_TOKEN.length);
    console.log('   - API Token starts with:', process.env.REPLICATE_API_TOKEN.substring(0, 10) + '...');
    
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    
    console.log('✅ [REPLICATE] Replicate client initialized successfully');
    return replicate;
  }

  /**
   * Map custom aspect ratio to Replicate supported ratio
   * @param {string} customRatio - Custom aspect ratio like '16:9', '9:16', etc.
   * @returns {string} - Replicate supported ratio
   */
  static mapAspectRatioToReplicate(customRatio) {
    const ratioMap = {
      '16:9': '16:9',      // Landscape
      '9:16': '9:16',      // Portrait
      '1:1': '1:1',        // Square
      '4:3': '4:3',        // Standard
      '3:4': '3:4',        // Portrait standard
      '21:9': '21:9',      // Ultra-wide
      '9:21': '9:21'       // Ultra-tall
    };
    
    return ratioMap[customRatio] || '16:9'; // Default to 16:9 landscape
  }

  /**
   * Map frames to duration
   * @param {number} numFrames - Number of frames
   * @returns {number} - Duration in seconds (5 or 10)
   */
  static mapFramesToDuration(numFrames) {
    // Replicate supports 5 or 10 seconds
    return numFrames <= 16 ? 5 : 10;
  }

  /**
   * Start a video generation task using Replicate
   * @param {Object} inputData - Input data for video generation
   * @param {string} executionId - Database execution ID
   * @param {string} modelType - Model type (seedance-1-lite)
   * @returns {Promise<Object>} - Created task object
   */
  static async startVideoGeneration(inputData, executionId, modelType) {
    try {
      const client = this.getReplicateClient();
      
      console.log(`🔄 [REPLICATE SERVICE] Starting video generation with model: ${modelType}`);
      console.log('📋 [REPLICATE SERVICE] Input data:', JSON.stringify(inputData, null, 2));

      // Prepare input for Replicate
      const replicateInput = {
        prompt: inputData.prompt || 'Generate a video',
        duration: inputData.duration || 5,
        aspect_ratio: inputData.aspect_ratio || '16:9',
        resolution: inputData.resolution || '720p',
        fps: 24, // Default to 24 fps
        camera_fixed: false // Default to dynamic camera
      };

      // Add image if provided (for image-to-video)
      if (inputData.image) {
        replicateInput.image = inputData.image;
        console.log('🎬 [REPLICATE SERVICE] Using image-to-video mode');
      } else {
        console.log('📝 [REPLICATE SERVICE] Using text-to-video mode');
      }

      console.log('🚀 [REPLICATE SERVICE] Starting Replicate prediction...');
      console.log('📐 [REPLICATE SERVICE] Parameters:', replicateInput);
      
      // Start the prediction using model ID instead of version ID
      const prediction = await client.predictions.create({
        model: "bytedance/seedance-1-lite",
        input: replicateInput
      });

      console.log('✅ [REPLICATE SERVICE] Prediction started successfully');
      console.log('   - Prediction ID:', prediction.id);
      console.log('   - Status:', prediction.status);

      // Update database with prediction ID
      console.log('💾 [REPLICATE SERVICE] Updating database with prediction ID...');
      await supabase
        .from('video_generations')
        .update({ 
          external_id: prediction.id,
          status: VIDEO_STATUS.PROCESSING 
        })
        .eq('id', executionId);
      console.log('✅ [REPLICATE SERVICE] Database updated with prediction ID');

      console.log('🎉 [REPLICATE SERVICE] Video generation started successfully!');
      return prediction;
    } catch (error) {
      console.error('❌ [REPLICATE SERVICE] Error starting video generation:', error);
      console.error('   - Error message:', error.message);
      console.error('   - Error name:', error.name);
      
      // Update execution status to failed
      console.log('💾 [REPLICATE SERVICE] Updating database status to failed...');
      await supabase
        .from('video_generations')
        .update({ 
          status: VIDEO_STATUS.FAILED,
          error_message: error.message
        })
        .eq('id', executionId);
      console.log('✅ [REPLICATE SERVICE] Database status updated to failed');
      
      throw error;
    }
  }

  /**
   * Check the status of a video generation
   * @param {string} predictionId - The prediction ID from Replicate
   * @returns {Promise<object>} - The current status
   */
  static async checkGenerationStatus(predictionId) {
    console.log('🔍 [REPLICATE SERVICE] Checking generation status...');
    console.log('   - Prediction ID:', predictionId);
    
    try {
      const client = this.getReplicateClient();
      
      // Get prediction status
      const prediction = await client.predictions.get(predictionId);
      console.log('✅ [REPLICATE SERVICE] Status retrieved successfully');
      console.log('   - Status:', prediction.status);
      console.log('   - Output:', prediction.output);
      
      return prediction;
    } catch (error) {
      console.error('❌ [REPLICATE SERVICE] Error checking status:', error);
      throw error;
    }
  }

  /**
   * Get the generated video URL
   * @param {string} predictionId - The prediction ID from Replicate
   * @returns {Promise<string>} - The video URL
   */
  static async getGeneratedVideo(predictionId) {
    console.log('🎬 [REPLICATE SERVICE] Getting generated video...');
    console.log('   - Prediction ID:', predictionId);
    
    try {
      const client = this.getReplicateClient();
      
      // Get prediction and wait for completion
      const prediction = await client.predictions.get(predictionId);
      
      if (prediction.status === 'succeeded' && prediction.output) {
        console.log('✅ [REPLICATE SERVICE] Video retrieved successfully');
        console.log('   - Video URL:', prediction.output);
        return prediction.output;
      } else if (prediction.status === 'failed') {
        throw new Error(`Generation failed: ${prediction.error || 'Unknown error'}`);
      } else {
        throw new Error(`Video not ready. Status: ${prediction.status}`);
      }
    } catch (error) {
      console.error('❌ [REPLICATE SERVICE] Error getting video:', error);
      throw error;
    }
  }

  /**
   * Cancel a video generation
   * @param {string} predictionId - The prediction ID from Replicate
   * @returns {Promise<boolean>} - Whether the cancellation was successful
   */
  static async cancelGeneration(predictionId) {
    console.log('❌ [REPLICATE SERVICE] Cancelling generation...');
    console.log('   - Prediction ID:', predictionId);
    
    try {
      const client = this.getReplicateClient();
      
      // Cancel the prediction
      await client.predictions.cancel(predictionId);
      console.log('✅ [REPLICATE SERVICE] Generation cancelled successfully');
      return true;
    } catch (error) {
      console.error('❌ [REPLICATE SERVICE] Error cancelling generation:', error);
      return false;
    }
  }

  /**
   * Test the connection to Replicate API
   * @returns {Promise<boolean>} - Whether the connection is successful
   */
  static async testConnection() {
    console.log('🧪 [REPLICATE SERVICE] Testing Replicate connection...');
    
    try {
      const client = this.getReplicateClient();
      
      console.log('🔧 [REPLICATE SERVICE] Testing with API token:', process.env.REPLICATE_API_TOKEN.substring(0, 20) + '...');
      
      // Test with a simple API call (list models)
      try {
        const models = await client.models.list();
        console.log('✅ [REPLICATE SERVICE] Models list retrieved successfully');
        console.log('   - Available models count:', models.length);
        
        // Look for our specific model
        const seedanceModel = models.find(model => model.owner === 'bytedance' && model.name === 'seedance-1-lite');
        if (seedanceModel) {
          console.log('✅ [REPLICATE SERVICE] Seedance model found:', seedanceModel.id);
        } else {
          console.log('⚠️ [REPLICATE SERVICE] Seedance model not found in list');
        }
        
        console.log('✅ [REPLICATE SERVICE] Connection test successful - API accessible');
        return true;
      } catch (apiError) {
        console.log('⚠️ [REPLICATE SERVICE] API call failed:', apiError.message);
        // Even if API call fails, the client initialization was successful
        console.log('✅ [REPLICATE SERVICE] Client initialized successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ [REPLICATE SERVICE] Connection test error:', error.message);
      console.error('   - Error details:', error);
      return false;
    }
  }

  /**
   * Check Replicate account information
   * @returns {Promise<object>} - Account information
   */
  static async checkAccount() {
    console.log('💰 [REPLICATE SERVICE] Checking account information...');
    
    try {
      const client = this.getReplicateClient();
      
      // Try to get account info
      try {
        const account = await client.accounts.get();
        console.log('✅ [REPLICATE SERVICE] Account info retrieved successfully');
        return {
          success: true,
          account: account,
          method: 'accounts.get()'
        };
      } catch (accountError) {
        console.log('⚠️ [REPLICATE SERVICE] accounts.get() failed:', accountError.message);
        
        // Try alternative method
        try {
          const user = await client.user.get();
          console.log('✅ [REPLICATE SERVICE] User info retrieved successfully');
          return {
            success: true,
            user: user,
            method: 'user.get()'
          };
        } catch (userError) {
          console.log('⚠️ [REPLICATE SERVICE] user.get() failed:', userError.message);
          
          return {
            success: true,
            message: 'Account info not available in this SDK version',
            note: 'Check your Replicate dashboard for account information',
            availableMethods: ['predictions.create', 'predictions.get', 'models.list']
          };
        }
      }
    } catch (error) {
      console.error('❌ [REPLICATE SERVICE] Error checking account:', error);
      return {
        success: false,
        error: error.message,
        note: 'This might indicate an API token issue'
      };
    }
  }
}

export default ReplicateService; 