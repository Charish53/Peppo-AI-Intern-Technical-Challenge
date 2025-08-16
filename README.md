# VideoAI - AI Video Generation Platform

A modern, focused web application for generating AI-powered videos using advanced AI models. This platform provides both text-to-video and image-to-video generation capabilities with a beautiful, responsive interface built specifically for video creation.

## 🎯 What This App Does

This is a *video generation platform* (not a marketplace) that allows users to:
- Create videos from text descriptions using Gen-4 Alpha
- Transform static images into animated videos using Gen-4 Turbo
- Fine-tune generation parameters for professional results
- Monitor generation progress in real-time
- Download high-quality video outputs

## 🏗 How the App Works - Step by Step

### 1. *User Authentication Flow*

User visits app → Sees landing page → Clicks "Start Creating" → 
Redirected to login/signup → Creates account or logs in → 
Accesses video generation dashboard


*Authentication Methods:*
- ✅ *Email/Password* (only method available)
- ❌ Google OAuth (removed)
- ❌ GitHub OAuth (removed)

### 2. *Video Generation Process*

User inputs prompt/image → Configures parameters → Submits request → 
AI model processes → Real-time progress updates → 
Video generation complete → Download available


*Generation Types:*
- *Text-to-Video*: Enter a text description, AI creates video
- *Image-to-Video*: Upload an image, AI adds motion and effects

### 3. *AI Models Available*
- *Gen-4 Alpha*: Advanced text-to-video generation with high quality and creativity
- *Gen-4 Turbo*: Fast image-to-video transformation with motion and effects

### 4. *User Interface Flow*

Landing Page → Features → Models → Testimonials → Pricing → 
Video Generation (requires login) → Settings → API Keys


## 🚀 Features

### Core Features
- *🎬 Text-to-Video Generation*: Create videos from text prompts
- *🖼 Image-to-Video Animation*: Bring static images to life
- *⚙ Advanced Controls*: Fine-tune frames, steps, guidance scale, aspect ratios
- *📊 Real-time Monitoring*: Live progress tracking and status updates
- *💾 Result Management*: Download, store, and organize generated videos
- *🔐 Secure Authentication*: Email-based user accounts with session management

### User Experience Features
- *🌙 Dark/Light Mode*: Automatic theme switching
- *📱 Responsive Design*: Works on desktop, tablet, and mobile
- *🎨 Modern UI*: Clean, professional interface with smooth animations
- *📈 Progress Tracking*: Real-time generation status and estimated completion
- *💳 Credit System*: Pay-per-use model for video generation

## 🛠 Technical Architecture

### Frontend Stack
- *Framework*: React 18 with TypeScript
- *Build Tool*: Vite for fast development and building
- *Styling*: Tailwind CSS with custom design system
- *UI Components*: Radix UI primitives with custom styling
- *State Management*: React Context API for authentication
- *Routing*: React Router for navigation
- *Icons*: Lucide React for consistent iconography

### Backend Stack
- *Runtime*: Node.js with TypeScript
- *Database*: Supabase (PostgreSQL)
- *Authentication*: Supabase Auth with JWT
- *API*: RESTful endpoints with Express.js
- *File Storage*: Supabase Storage for videos and images
- *Real-time*: Supabase real-time subscriptions

### Database Schema
sql
-- Core tables for video generation platform
users: User accounts and profiles
video_generations: Video generation requests and results
api_keys: User API keys for external access
user_preferences: User settings and preferences


## 📋 Prerequisites

### Required Accounts
- *Supabase Account*: For database and authentication
- *AI Model API Access*: For video generation (currently placeholder)

### Development Requirements
- Node.js 18+ 
- npm or yarn package manager
- Modern web browser with ES6+ support

## 🔧 Setup Instructions

### Step 1: Clone and Install Dependencies
bash
# Clone the repository
git clone <repository-url>
cd peppo

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies (if backend exists)
cd ../backend
npm install


### Step 2: Environment Configuration

*Frontend Environment (.env file in frontend directory):*
env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Example values:
# VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...


*Backend Environment (.env file in backend directory):*
env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AI Model Configuration (placeholder for future integration)
AI_MODEL_API_KEY=your_api_key_here


### Step 3: Supabase Project Setup

1. *Create Supabase Project:*
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for project to be ready

2. *Get Credentials:*
   - Go to Settings → API
   - Copy Project URL and anon/public key
   - Add to your .env files

3. *Database Setup:*
   Run this SQL in Supabase SQL Editor:

sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video generations table
CREATE TABLE IF NOT EXISTS public.video_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL CHECK (model_type IN ('gen4_alpha', 'gen4_turbo')),
  prompt TEXT,
  image_url TEXT,
  negative_prompt TEXT,
  num_frames INTEGER DEFAULT 16 CHECK (num_frames BETWEEN 8 AND 32),
  aspect_ratio TEXT DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', '4:3', '3:4')),
  input_data JSONB NOT NULL,
  output_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  external_id TEXT,
  error_message TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  generation_time_ms INTEGER,
  cost_usd DECIMAL(10,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  default_model_id TEXT DEFAULT 'gen4_alpha',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON public.video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_status ON public.video_generations(status);
CREATE INDEX IF NOT EXISTS idx_video_generations_created_at ON public.video_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own video generations" ON public.video_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video generations" ON public.video_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video generations" ON public.video_generations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video generations" ON public.video_generations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);


### Step 4: Run the Application

*Development Mode:*
bash
# Frontend (Terminal 1)
cd frontend
npm run dev

# Backend (Terminal 2, if backend exists)
cd backend
npm run dev


*Production Build:*
bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
npm start


## 🎮 How to Use the App

### 1. *First Time Setup*
- Visit the application URL
- Click "Start Creating" or "Create Account"
- Fill in your details (email, password, full name)
- Verify your email (if required)
- Log in to your account

### 2. *Video Generation Process*

#### Text-to-Video Generation:
1. Navigate to Video Generation page
2. Select "Text to Video" tab
3. Enter your video description in the prompt field
4. Configure parameters:
   - *Frames*: 8-32 (affects video length)
   - *Aspect Ratio*: 16:9, 9:16, 1:1, 4:3, 3:4
   - *Negative Prompt*: What to avoid in the video
5. Click "Generate Video"
6. Monitor progress in real-time
7. Download when complete

#### Image-to-Video Generation:
1. Select "Image to Video" tab
2. Upload an image file
3. Add optional text prompt
4. Configure parameters (same as text-to-video)
5. Click "Generate Video"
6. Watch as your image comes to life with motion

### 3. *Managing Your Videos*
- View generation history
- Download completed videos
- Check generation parameters used
- Monitor costs and usage

### 4. *Account Settings*
- Update profile information
- Manage API keys
- Change theme preferences
- View account statistics

## 🔒 Security Features

- *Authentication*: Supabase Auth with JWT tokens
- *Authorization*: Row Level Security (RLS) policies
- *Input Validation*: Client and server-side validation
- *Rate Limiting*: Prevents abuse and ensures fair usage
- *Secure Storage*: Encrypted API keys and user data
- *CORS Protection*: Configured for production security

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. *"Failed to fetch" Error*
*Cause*: Missing or incorrect Supabase credentials
*Solution*: 
- Check your .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Restart development server after adding environment variables
- Verify Supabase project is active and credentials are correct

#### 2. *Authentication Errors*
*Cause*: Database tables not created or RLS policies missing
*Solution*:
- Run the complete SQL setup script in Supabase
- Check browser console for specific error messages
- Verify user table exists and has proper structure

#### 3. *Build Errors*
*Cause*: Missing dependencies or TypeScript errors
*Solution*:
bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npm run type-check


#### 4. *Video Generation Not Working*
*Cause*: AI model API not configured or credits exhausted
*Solution*:
- Check if you have sufficient credits
- Verify API key is valid and active
- Check generation status in the dashboard

### Debug Mode
Enable detailed logging by checking browser console and network tab for:
- Authentication requests
- Database queries
- API calls
- Error messages

## 📱 Browser Compatibility

- *Chrome*: 90+ (Recommended)
- *Firefox*: 88+
- *Safari*: 14+
- *Edge*: 90+
- *Mobile*: iOS Safari 14+, Chrome Mobile 90+

## 🚀 Deployment

### Frontend Deployment
bash
# Build for production
npm run build

# Deploy to your hosting service
# (Netlify, Vercel, AWS S3, etc.)


### Backend Deployment
bash
# Set NODE_ENV=production
# Deploy to your server (Heroku, AWS, DigitalOcean, etc.)


### Environment Variables for Production
env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key


## 🔮 Future Enhancements

- [ ] *Real AI Model Integration*: Connect to actual video generation APIs
- [ ] *Batch Processing*: Generate multiple videos simultaneously
- [ ] *Video Editing*: Basic editing capabilities for generated videos
- [ ] *Templates*: Pre-built prompt templates for common video types
- [ ] *Collaboration*: Team workspaces and shared projects
- [ ] *Analytics*: Video generation insights and usage statistics
- [ ] *Mobile App*: Native mobile application
- [ ] *API Access*: Public API for developers

## 📚 API Documentation

### Authentication Endpoints
- POST /auth/signup - User registration
- POST /auth/signin - User login
- POST /auth/signout - User logout
- GET /auth/user - Get current user

### Video Generation Endpoints
- POST /api/video-generation - Start video generation
- GET /api/video-generation/:id - Get generation status
- GET /api/video-generation - List user's generations
- DELETE /api/video-generation/:id - Delete generation

### User Management Endpoints
- PUT /api/user/profile - Update user profile
- GET /api/user/preferences - Get user preferences
- PUT /api/user/preferences - Update user preferences

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use consistent code formatting
- Add proper error handling
- Include TypeScript types for all functions
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- *GitHub Issues*: Create an issue for bugs or feature requests
- *Documentation*: Check this README and code comments
- *Community*: Join our community discussions

### Reporting Issues
When reporting issues, please include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Console error messages
- Screenshots if applicable

## 📞 Contact

- *Project Maintainer*: [Your Name/Team]
- *Email*: [your-email@domain.com]
- *GitHub*: [github-username]
- *Project URL*: [project-url]

---

*Note*: This is a focused video generation platform. It's designed to be simple, efficient, and focused on creating amazing videos with AI. The platform is not a marketplace for multiple AI models - it's specifically built for video generation using the latest Gen-4 models.
