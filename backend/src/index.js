import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import essential routes only
import videoGenerationRoutes from './routes/videoGeneration.js';

// Import Replicate service for testing
import ReplicateService from './services/replicateService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes - only video generation for now
app.use('/api/video-generation', videoGenerationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test Replicate connection
  try {
    const isConnected = await ReplicateService.testConnection();
    if (isConnected) {
      console.log('✅ Replicate connection successful');
    } else {
      console.log('❌ Replicate connection failed');
    }
  } catch (error) {
    console.log('❌ Replicate connection test error:', error.message);
  }
});

export default app; 