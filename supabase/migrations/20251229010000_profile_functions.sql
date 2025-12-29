-- Profile functions for follower management

-- Function to increment creator followers
CREATE OR REPLACE FUNCTION increment_creator_followers(creator_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE creators
  SET total_followers = total_followers + 1
  WHERE id = creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement creator followers
CREATE OR REPLACE FUNCTION decrement_creator_followers(creator_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE creators
  SET total_followers = GREATEST(0, total_followers - 1)
  WHERE id = creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get follower count for a user
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM follows
  WHERE following_id = user_id;
  RETURN count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get following count for a user
CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM follows
  WHERE follower_id = user_id;
  RETURN count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if a user is following another user
CREATE OR REPLACE FUNCTION is_following(follower UUID, following UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = follower AND following_id = following
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create storage bucket for profile images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to profile images
CREATE POLICY "Public profile images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add index for faster follow queries
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Add RLS policies for follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can see who follows whom
CREATE POLICY "Follows are viewable by everyone"
ON follows FOR SELECT
USING (true);

-- Authenticated users can follow others
CREATE POLICY "Authenticated users can follow others"
ON follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
USING (auth.uid() = follower_id);
