-- Create bucket_list table for users to save places they want to visit
CREATE TABLE IF NOT EXISTS bucket_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  -- For places not in our database (e.g., from Google)
  external_place_id TEXT,
  place_name TEXT NOT NULL,
  place_location TEXT,
  place_category TEXT,
  place_image_url TEXT,
  place_estimated_cost DECIMAL(10,2),
  notes TEXT,
  is_visited BOOLEAN DEFAULT FALSE,
  visited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure a user can't add the same place twice
  UNIQUE(user_id, place_id),
  UNIQUE(user_id, external_place_id)
);

-- Enable RLS
ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;

-- Users can only see their own bucket list
CREATE POLICY "Users can view own bucket list"
  ON bucket_list FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their own bucket list
CREATE POLICY "Users can insert own bucket list"
  ON bucket_list FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bucket list
CREATE POLICY "Users can update own bucket list"
  ON bucket_list FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete from their own bucket list
CREATE POLICY "Users can delete own bucket list"
  ON bucket_list FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_bucket_list_user_id ON bucket_list(user_id);
CREATE INDEX idx_bucket_list_place_location ON bucket_list(place_location);
