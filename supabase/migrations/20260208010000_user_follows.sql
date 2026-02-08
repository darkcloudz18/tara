-- User follows table for social following
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Add follower counts to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    -- Increment followers count for following
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    -- Decrement followers count for following
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follow count updates
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON user_follows;
CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- RLS policies for user_follows
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view follows
DROP POLICY IF EXISTS "Anyone can view follows" ON user_follows;
CREATE POLICY "Anyone can view follows" ON user_follows
  FOR SELECT USING (true);

-- Users can follow others
DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
CREATE POLICY "Users can follow others" ON user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;
CREATE POLICY "Users can unfollow" ON user_follows
  FOR DELETE USING (auth.uid() = follower_id);
