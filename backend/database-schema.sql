-- Simple Video Generation Database Schema for Replicate Integration
-- This creates a clean, focused database for video generation only

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (simple, no complex auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video generations table (main table)
CREATE TABLE IF NOT EXISTS video_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Generation details
    prompt TEXT NOT NULL,
    model_type TEXT DEFAULT 'seedance-1-lite',
    
    -- Video parameters
    duration INTEGER DEFAULT 5, -- 5 or 10 seconds
    aspect_ratio TEXT DEFAULT '16:9',
    resolution TEXT DEFAULT '720p',
    
    -- Input/output
    image_url TEXT, -- for image-to-video
    video_url TEXT, -- generated video URL
    thumbnail_url TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    external_id TEXT, -- Replicate prediction ID
    
    -- Metadata
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_generations_user_id ON video_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_status ON video_generations(status);
CREATE INDEX IF NOT EXISTS idx_video_generations_created_at ON video_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_video_generations_external_id ON video_generations(external_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at column
CREATE TRIGGER update_video_generations_updated_at 
    BEFORE UPDATE ON video_generations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (email, name) VALUES 
    ('demo@example.com', 'Demo User')
ON CONFLICT (email) DO NOTHING;

-- Sample video generation (optional)
INSERT INTO video_generations (user_id, prompt, status) 
SELECT u.id, 'A cat walking in the rain', 'completed'
FROM users u 
WHERE u.email = 'demo@example.com'
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust based on your Supabase setup)
-- These are typically handled automatically by Supabase

-- Enable Row Level Security (RLS) - Supabase best practice
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can see all data (since we're not using complex auth)
CREATE POLICY "Allow all access" ON users FOR ALL USING (true);
CREATE POLICY "Allow all access" ON video_generations FOR ALL USING (true);

-- Comments for documentation
COMMENT ON TABLE users IS 'Simple user accounts for video generation';
COMMENT ON TABLE video_generations IS 'Video generation records using Replicate API';
COMMENT ON COLUMN video_generations.model_type IS 'AI model used (default: seedance-1-lite)';
COMMENT ON COLUMN video_generations.status IS 'Generation status: pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN video_generations.external_id IS 'Replicate prediction ID for tracking';
COMMENT ON COLUMN video_generations.video_url IS 'URL to the generated video file'; 