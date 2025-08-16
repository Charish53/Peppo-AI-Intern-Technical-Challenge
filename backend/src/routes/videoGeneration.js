import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase, VIDEO_STATUS, SUPPORTED_ASPECT_RATIOS, SUPPORTED_DURATIONS } from '../config/database.js';
import ReplicateService from '../services/replicateService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Remove authentication middleware - allow direct access
// router.use(authenticateApiKey);

// Validation middleware
const validateVideoGeneration = [
  body('prompt')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Prompt must be between 1 and 1000 characters'),
  body('duration')
    .optional()
    .isIn(SUPPORTED_DURATIONS)
    .withMessage(`Duration must be one of: ${SUPPORTED_DURATIONS.join(', ')}`),
  body('aspect_ratio')
    .optional()
    .isIn(SUPPORTED_ASPECT_RATIOS)
    .withMessage(`Aspect ratio must be one of: ${SUPPORTED_ASPECT_RATIOS.join(', ')}`),
  body('resolution')
    .optional()
    .isIn(['480p', '720p', '1080p'])
    .withMessage('Resolution must be 480p, 720p, or 1080p'),
  body('image')
    .optional()
    .isString()
    .withMessage('Image must be a valid URL or base64 string')
];

// Check Replicate credits
router.get('/credits', async (req, res) => {
  try {
    const credits = await ReplicateService.checkAccount();
    res.json(credits);
  } catch (error) {
    console.error('Error checking credits:', error);
    res.status(500).json({
      error: 'Failed to check credits',
      message: error.message
    });
  }
});

// Start a new video generation
router.post('/generate', validateVideoGeneration, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      prompt,
      image,
      duration,
      aspect_ratio,
      resolution
    } = req.body;

    // Generate a proper UUID for the user
    const tempUserId = uuidv4();

    // Create a temporary user first to satisfy foreign key constraint
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: tempUserId,
        email: `temp_${Date.now()}@example.com`,
        name: 'Temporary User'
      }, {
        onConflict: 'id'
      });

    if (userError) {
      console.error('Error creating temporary user:', userError);
      return res.status(500).json({
        error: 'Failed to create temporary user',
        details: userError.message
      });
    }

    // Create video generation record
    const { data: generation, error: createError } = await supabase
      .from('video_generations')
      .insert({
        user_id: tempUserId,
        prompt,
        image_url: image,
        duration: duration || 5,
        aspect_ratio: aspect_ratio || '16:9',
        resolution: resolution || '720p',
        status: VIDEO_STATUS.PENDING
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating video generation record:', createError);
      return res.status(500).json({
        error: 'Failed to create video generation record',
        details: createError.message
      });
    }

    // Start the video generation
    const inputData = {
      prompt,
      image,
      duration: duration || 5,
      aspect_ratio: aspect_ratio || '16:9',
      resolution: resolution || '720p'
    };

    try {
      await ReplicateService.startVideoGeneration(inputData, generation.id, 'seedance-1-lite');
      
      res.status(201).json({
        message: 'Video generation started successfully',
        generation_id: generation.id,
        status: VIDEO_STATUS.PROCESSING
      });
    } catch (generationError) {
      console.error('Error starting video generation:', generationError);
      
      // Update status to failed
      await supabase
        .from('video_generations')
        .update({ 
          status: VIDEO_STATUS.FAILED,
          error_message: generationError.message
        })
        .eq('id', generation.id);

      res.status(500).json({
        error: 'Failed to start video generation',
        details: generationError.message
      });
    }

  } catch (error) {
    console.error('Error in video generation endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get video generation status
router.get('/status/:generationId', async (req, res) => {
  try {
    const { generationId } = req.params;

    // Get generation record (no user ID check since we're not authenticating)
    const { data: generation, error: fetchError } = await supabase
      .from('video_generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (fetchError || !generation) {
      return res.status(404).json({
        error: 'Video generation not found'
      });
    }

    // If generation is still processing, check with Replicate
    if (generation.status === VIDEO_STATUS.PROCESSING && generation.external_id) {
      try {
        const replicateStatus = await ReplicateService.checkGenerationStatus(generation.external_id);
        
        if (replicateStatus.status === 'succeeded') {
          // Get the video URL
          const videoUrl = await ReplicateService.getGeneratedVideo(generation.external_id);
          
          // Update database
          await supabase
            .from('video_generations')
            .update({
              status: VIDEO_STATUS.COMPLETED,
              video_url: videoUrl,
              output_data: replicateStatus
            })
            .eq('id', generationId);
          
          generation.status = VIDEO_STATUS.COMPLETED;
          generation.video_url = videoUrl;
        } else if (replicateStatus.status === 'failed') {
          await supabase
            .from('video_generations')
            .update({
              status: VIDEO_STATUS.FAILED,
              error_message: replicateStatus.error || 'Generation failed'
            })
            .eq('id', generationId);
          
          generation.status = VIDEO_STATUS.FAILED;
        }
      } catch (statusError) {
        console.error('Error checking Replicate status:', statusError);
        // Continue with current status if we can't check
      }
    }

    res.json({
      generation_id: generation.id,
      status: generation.status,
      video_url: generation.video_url,
      thumbnail_url: generation.thumbnail_url,
      error_message: generation.error_message,
      created_at: generation.created_at,
      updated_at: generation.updated_at
    });

  } catch (error) {
    console.error('Error getting video generation status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get user's video generations
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get all generations (no user ID filter since we're not authenticating)
    const { data: generations, error: fetchError, count } = await supabase
      .from('video_generations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('Error fetching video generations:', fetchError);
      return res.status(500).json({
        error: 'Failed to fetch video generations'
      });
    }

    res.json({
      generations: generations || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error listing video generations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Cancel a video generation
router.post('/cancel/:generationId', async (req, res) => {
  try {
    const { generationId } = req.params;

    // Get generation record (no user ID check since we're not authenticating)
    const { data: generation, error: fetchError } = await supabase
      .from('video_generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (fetchError || !generation) {
      return res.status(404).json({
        error: 'Video generation not found'
      });
    }

    if (generation.status !== VIDEO_STATUS.PROCESSING) {
      return res.status(400).json({
        error: 'Can only cancel processing generations'
      });
    }

    // Cancel with Replicate if external_id exists
    if (generation.external_id) {
      try {
        await ReplicateService.cancelGeneration(generation.external_id);
      } catch (cancelError) {
        console.error('Error cancelling with Replicate:', cancelError);
        // Continue with local cancellation
      }
    }

    // Update local status
    const { error: updateError } = await supabase
      .from('video_generations')
      .update({ status: VIDEO_STATUS.CANCELLED })
      .eq('id', generationId);

    if (updateError) {
      console.error('Error updating generation status:', updateError);
      return res.status(500).json({
        error: 'Failed to cancel generation'
      });
    }

    res.json({
      message: 'Video generation cancelled successfully',
      generation_id: generationId,
      status: VIDEO_STATUS.CANCELLED
    });

  } catch (error) {
    console.error('Error cancelling video generation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Delete a video generation
router.delete('/:generationId', async (req, res) => {
  try {
    const { generationId } = req.params;

    // Check if generation exists (no user ID check since we're not authenticating)
    const { data: generation, error: fetchError } = await supabase
      .from('video_generations')
      .select('id')
      .eq('id', generationId)
      .single();

    if (fetchError || !generation) {
      return res.status(404).json({
        error: 'Video generation not found'
      });
    }

    // Delete the generation
    const { error: deleteError } = await supabase
      .from('video_generations')
      .delete()
      .eq('id', generationId);

    if (deleteError) {
      console.error('Error deleting video generation:', deleteError);
      return res.status(500).json({
        error: 'Failed to delete video generation'
      });
    }

    res.json({
      message: 'Video generation deleted successfully',
      generation_id: generationId
    });

  } catch (error) {
    console.error('Error deleting video generation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router; 