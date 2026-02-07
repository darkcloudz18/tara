-- Trip likes/saves table
CREATE TABLE IF NOT EXISTS trip_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- One like per user per trip
  UNIQUE(itinerary_id, user_id)
);

-- Indexes
CREATE INDEX idx_trip_likes_itinerary ON trip_likes(itinerary_id);
CREATE INDEX idx_trip_likes_user ON trip_likes(user_id);

-- Row Level Security
ALTER TABLE trip_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can see like counts (handled in app)
CREATE POLICY "Anyone can view likes"
  ON trip_likes FOR SELECT
  USING (true);

-- Authenticated users can like
CREATE POLICY "Authenticated users can like"
  ON trip_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete their own likes)
CREATE POLICY "Users can unlike"
  ON trip_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update itinerary like count
CREATE OR REPLACE FUNCTION update_itinerary_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE itineraries
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.itinerary_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE itineraries
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.itinerary_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_trip_like_change
  AFTER INSERT OR DELETE ON trip_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_itinerary_like_count();

-- Add likes_count column to itineraries if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itineraries' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE itineraries ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Saved trips table (bookmarks)
CREATE TABLE IF NOT EXISTS saved_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT, -- Personal notes about why they saved it
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(itinerary_id, user_id)
);

-- Indexes
CREATE INDEX idx_saved_trips_user ON saved_trips(user_id);
CREATE INDEX idx_saved_trips_itinerary ON saved_trips(itinerary_id);

-- Row Level Security
ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved trips
CREATE POLICY "Users can view own saved trips"
  ON saved_trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save trips"
  ON saved_trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave trips"
  ON saved_trips FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update saved trip notes"
  ON saved_trips FOR UPDATE
  USING (auth.uid() = user_id);
