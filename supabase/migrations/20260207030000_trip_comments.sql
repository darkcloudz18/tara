-- Trip comments table
CREATE TABLE IF NOT EXISTS trip_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES trip_comments(id) ON DELETE CASCADE, -- For replies
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_trip_comments_itinerary ON trip_comments(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_trip_comments_user ON trip_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_comments_parent ON trip_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_trip_comments_created ON trip_comments(created_at DESC);

-- Row Level Security
ALTER TABLE trip_comments ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "Anyone can view comments on public trips" ON trip_comments;
CREATE POLICY "Anyone can view comments on public trips"
  ON trip_comments FOR SELECT
  USING (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE is_public = true
    )
    OR auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM itineraries WHERE id = itinerary_id
    )
  );

DROP POLICY IF EXISTS "Authenticated users can comment" ON trip_comments;
CREATE POLICY "Authenticated users can comment"
  ON trip_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can edit own comments" ON trip_comments;
CREATE POLICY "Users can edit own comments"
  ON trip_comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete comments" ON trip_comments;
CREATE POLICY "Users can delete comments"
  ON trip_comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM itineraries WHERE id = itinerary_id
    )
  );

-- Enable realtime (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE trip_comments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Trigger to update updated_at and mark as edited
CREATE OR REPLACE FUNCTION update_trip_comment()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF OLD.content <> NEW.content THEN
    NEW.is_edited = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trip_comments_updated ON trip_comments;
CREATE TRIGGER trip_comments_updated
  BEFORE UPDATE ON trip_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_comment();

-- Notify trip owner of new comments
CREATE OR REPLACE FUNCTION notify_trip_comment()
RETURNS TRIGGER AS $$
DECLARE
  trip_owner_id UUID;
  trip_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Get trip owner
  SELECT user_id, title INTO trip_owner_id, trip_title
  FROM itineraries WHERE id = NEW.itinerary_id;

  -- Don't notify if commenting on own trip
  IF trip_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get commenter name
  SELECT COALESCE(first_name, username, 'Someone') INTO commenter_name
  FROM profiles WHERE id = NEW.user_id;

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    trip_owner_id,
    'trip_comment',
    'New Comment',
    commenter_name || ' commented on your trip "' || trip_title || '"',
    jsonb_build_object(
      'trip_id', NEW.itinerary_id,
      'comment_id', NEW.id,
      'from_user_id', NEW.user_id,
      'action_url', '/trip/' || NEW.itinerary_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trip_comment ON trip_comments;
CREATE TRIGGER on_trip_comment
  AFTER INSERT ON trip_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_trip_comment();
