# 🎬 AI Video Generation Platform

A full-stack web application that generates AI-powered videos using advanced AI models. Built with React, Node.js, and Supabase, this platform provides both text-to-video and image-to-video generation capabilities with a modern, responsive interface.

## ✨ Features

- **🎬 AI Video Generation**: Create videos from text prompts using advanced AI models
- **🖼 Image-to-Video**: Transform static images into animated videos
- **⚙️ Customizable Settings**: Adjust aspect ratios, durations, and resolutions
- **📊 Real-time Progress**: Track generation progress with live updates
- **🔐 User Authentication**: Secure user management with Supabase
- **🌙 Dark/Light Mode**: Automatic theme switching
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **💳 Payment Integration**: Stripe integration for purchasing credits
- **🔑 API Key Management**: Manage API keys for external access

## 🏗️ Architecture Overview

This is a **full-stack application** with a clear separation of concerns:

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express.js + Supabase
- **Database**: PostgreSQL (via Supabase)
- **AI Models**: Integration with Replicate API for video generation
- **Authentication**: Supabase Auth with JWT
- **File Storage**: Supabase Storage for videos and images

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive styling
- **Radix UI** components for accessible UI primitives
- **React Hook Form** for form management and validation
- **React Query** for efficient data fetching and caching
- **React Router** for client-side routing
- **Lucide React** for consistent iconography

### Backend
- **Node.js** with Express.js framework
- **Supabase** for database, authentication, and storage
- **Replicate API** for AI video generation
- **Stripe** for payment processing
- **CORS** enabled for cross-origin requests
- **JWT** for secure authentication

### Database
- **PostgreSQL** via Supabase
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates

## 📁 Project Structure

```
Peppo-AI-Intern-Technical-Challenge/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── contexts/       # React contexts (Theme, Auth)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   └── App.tsx         # Main application component
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.ts  # Tailwind CSS configuration
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic and external APIs
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   └── index.js        # Main server file
│   ├── database-schema.sql # Database schema and setup
│   └── package.json        # Backend dependencies
└── README.md               # This file
```

## 🎯 Core Functionality

### 1. Video Generation
- **Text-to-Video**: Enter descriptive prompts to generate videos
- **Image-to-Video**: Upload images and add motion/effects
- **Model Selection**: Choose between different AI models for various use cases
- **Parameter Control**: Customize frames, aspect ratios, and quality settings

### 2. User Management
- **Authentication**: Secure signup/login with email verification
- **Profile Management**: Update user information and preferences
- **API Key Management**: Create and manage API keys for external access
- **Usage Tracking**: Monitor video generation history and costs

### 3. Real-time Features
- **Progress Tracking**: Live updates during video generation
- **Status Monitoring**: Real-time status updates (pending, processing, completed, failed)
- **Notifications**: Toast notifications for important events

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm package manager
- **Git** for version control
- **Supabase account** for backend services
- **Replicate API key** for AI video generation
- **Stripe account** (optional, for payments)

### 1. Clone the Repository
```bash
git clone https://github.com/Charish53/Peppo-AI-Intern-Technical-Challenge.git
cd Peppo-AI-Intern-Technical-Challenge
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
REPLICATE_API_TOKEN=your_replicate_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_key
FRONTEND_URL=http://localhost:3001
PORT=5000

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Start development server
npm run dev
```

### 4. Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL script from `backend/database-schema.sql` in your Supabase SQL Editor
3. Update your `.env` files with the correct Supabase credentials

## 🌐 Environment Variables

### Backend (.env)
```bash
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key

# AI Model Configuration
REPLICATE_API_TOKEN=r8_your_replicate_token

# Optional: Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### Frontend (.env)
```bash
# API Configuration
VITE_API_URL=http://localhost:5000

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

## 🎮 How to Use

### 1. User Registration & Authentication
- Visit the application and click "Start Creating"
- Sign up with your email and password
- Verify your email (if required)
- Log in to access the video generation dashboard

### 2. Video Generation Process

#### Text-to-Video:
1. Navigate to the Video Generation page
2. Select "Text to Video" tab
3. Enter a detailed description of your desired video
4. Configure parameters:
   - **Duration**: 5-16 seconds
   - **Aspect Ratio**: 16:9, 9:16, 1:1, 4:3, 3:4
   - **Resolution**: 480p, 720p, 1080p
5. Click "Generate Video"
6. Monitor real-time progress
7. Download when complete

#### Image-to-Video:
1. Select "Image to Video" tab
2. Upload an image file (JPG, PNG, WebP)
3. Add a prompt describing the desired motion
4. Configure other settings as needed
5. Click "Generate Video"

### 3. Managing Your Account
- **Profile Settings**: Update personal information
- **API Keys**: Create and manage API keys for external access
- **Generation History**: View all your video generations
- **Theme Preferences**: Switch between light and dark modes

## 🔧 API Endpoints

### Video Generation
- `POST /api/video-generation/generate` - Start video generation
- `GET /api/video-generation/status/:id` - Check generation status
- `POST /api/video-generation/cancel/:id` - Cancel ongoing generation
- `GET /api/video-generation/history` - Get user's generation history

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/api-keys` - Get user's API keys
- `POST /api/users/api-keys` - Create new API key

### Health & Status
- `GET /health` - Server health check

## 🗄️ Database Schema

The application uses a clean, focused database schema:

### Core Tables
- **users**: User accounts and profiles
- **video_generations**: Video generation requests and results
- **api_keys**: User API keys for external access

### Key Features
- **UUID primary keys** for security
- **Row Level Security (RLS)** for data protection
- **Automatic timestamps** for tracking
- **Status tracking** for video generation lifecycle
- **External ID mapping** for AI model integration

## 🚀 Deployment

### Frontend Deployment (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set the root directory to `frontend/`
4. Configure environment variables
5. Deploy

### Backend Deployment (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the root directory to `backend/`
4. Configure environment variables
5. Deploy

### Production Environment Variables
- Update `FRONTEND_URL` to your production domain
- Use production API keys for Replicate and Stripe
- Ensure CORS is properly configured for production

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify `FRONTEND_URL` is set correctly in backend
   - Check that frontend and backend URLs match

2. **Video Generation Fails**
   - Verify Replicate API key is valid
   - Check credit balance (if applicable)
   - Ensure prompt meets content guidelines

3. **Authentication Issues**
   - Verify Supabase credentials are correct
   - Check database tables and RLS policies
   - Ensure user table exists with proper structure

4. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check TypeScript configuration
   - Verify all dependencies are compatible

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in your backend environment variables.

## 🔒 Security Features

- **JWT Authentication** with Supabase
- **Row Level Security (RLS)** for database protection
- **Input Validation** on both client and server
- **CORS Protection** for cross-origin requests
- **Secure API Key Storage** with hashing
- **Rate Limiting** to prevent abuse

## 📱 Browser Compatibility

- **Chrome**: 90+ (Recommended)
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

## 🔮 Future Enhancements

- [ ] **Real AI Model Integration**: Connect to actual video generation APIs
- [ ] **Batch Processing**: Generate multiple videos simultaneously
- [ ] **Video Editing**: Basic editing capabilities for generated videos
- [ ] **Templates**: Pre-built prompt templates for common video types
- [ ] **Collaboration**: Team workspaces and shared projects
- [ ] **Analytics**: Video generation insights and usage statistics
- [ ] **Mobile App**: Native mobile application
- [ ] **API Access**: Public API for developers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
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
- **GitHub Issues**: Create an issue for bugs or feature requests
- **Documentation**: Check this README and code comments
- **Community**: Join our community discussions

### Reporting Issues
When reporting issues, please include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Console error messages
- Screenshots if applicable

## 📞 Contact

- **Project Maintainer**: [Your Name/Team]
- **Email**: [charish230@gmail.com]
- **GitHub**: [https://github.com/Charish53]
- **Project URL**: [https://peppo-ai-intern-technical-challenge.vercel.app/]

---

**Note**: This is a focused video generation platform designed to be simple, efficient, and focused on creating amazing videos with AI. The platform is specifically built for video generation using advanced AI models with a modern, user-friendly interface.

**Happy Video Generating! 🎬✨**
