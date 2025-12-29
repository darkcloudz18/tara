-- Posts storage and functions

-- Create storage bucket for posts if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to post images
CREATE POLICY "Public post images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- Allow authenticated users to upload post images
CREATE POLICY "Users can upload their own post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to increment creator posts count
CREATE OR REPLACE FUNCTION increment_creator_posts(creator_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE creators
  SET total_posts = total_posts + 1
  WHERE id = creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement creator posts count
CREATE OR REPLACE FUNCTION decrement_creator_posts(creator_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE creators
  SET total_posts = GREATEST(0, total_posts - 1)
  WHERE id = creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view posts
CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT
USING (true);

-- Users can create their own posts
CREATE POLICY "Users can create their own posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster post queries
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Add RLS policies for creator_videos table
ALTER TABLE creator_videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view active videos
CREATE POLICY "Active videos are viewable by everyone"
ON creator_videos FOR SELECT
USING (is_active = true);

-- Creators can create their own videos
CREATE POLICY "Creators can create their own videos"
ON creator_videos FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own videos
CREATE POLICY "Creators can update their own videos"
ON creator_videos FOR UPDATE
USING (auth.uid() = creator_id);

-- Creators can delete their own videos
CREATE POLICY "Creators can delete their own videos"
ON creator_videos FOR DELETE
USING (auth.uid() = creator_id);
