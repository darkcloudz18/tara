-- Place reviews table
CREATE TABLE IF NOT EXISTS place_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(place_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_place_reviews_place ON place_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_place_reviews_user ON place_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_place_reviews_rating ON place_reviews(rating);

-- RLS policies
ALTER TABLE place_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON place_reviews;
CREATE POLICY "Anyone can view reviews" ON place_reviews
  FOR SELECT USING (true);

-- Users can create reviews
DROP POLICY IF EXISTS "Users can create reviews" ON place_reviews;
CREATE POLICY "Users can create reviews" ON place_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON place_reviews;
CREATE POLICY "Users can update own reviews" ON place_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON place_reviews;
CREATE POLICY "Users can delete own reviews" ON place_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION increment_helpful(review_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE place_reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id
  RETURNING helpful_count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;
