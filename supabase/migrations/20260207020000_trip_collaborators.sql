-- Trip collaborators table for shared editing
CREATE TABLE IF NOT EXISTS trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate collaborators
  UNIQUE(itinerary_id, user_id)
);

-- Indexes (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_itinerary ON trip_collaborators(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_user ON trip_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_status ON trip_collaborators(status);

-- Row Level Security
ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "Users can view their collaborations" ON trip_collaborators;
CREATE POLICY "Users can view their collaborations"
  ON trip_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = invited_by
    OR auth.uid() IN (
      SELECT user_id FROM trip_collaborators tc2
      WHERE tc2.itinerary_id = trip_collaborators.itinerary_id AND tc2.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Owners can invite collaborators" ON trip_collaborators;
CREATE POLICY "Owners can invite collaborators"
  ON trip_collaborators FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM itineraries WHERE id = itinerary_id
    )
    OR auth.uid() = invited_by
  );

DROP POLICY IF EXISTS "Users can update own collaboration" ON trip_collaborators;
CREATE POLICY "Users can update own collaboration"
  ON trip_collaborators FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = invited_by);

DROP POLICY IF EXISTS "Owners can remove collaborators" ON trip_collaborators;
CREATE POLICY "Owners can remove collaborators"
  ON trip_collaborators FOR DELETE
  USING (
    auth.uid() = invited_by
    OR auth.uid() IN (
      SELECT user_id FROM itineraries WHERE id = itinerary_id
    )
  );

-- Enable realtime for presence (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE trip_collaborators;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS trip_collaborators_updated_at ON trip_collaborators;
CREATE TRIGGER trip_collaborators_updated_at
  BEFORE UPDATE ON trip_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Function to notify when collaborator is added
CREATE OR REPLACE FUNCTION notify_collaborator_invited()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'trip_shared',
    'Trip Invitation',
    'You''ve been invited to collaborate on a trip',
    jsonb_build_object(
      'trip_id', NEW.itinerary_id,
      'from_user_id', NEW.invited_by,
      'action_url', '/planner/' || NEW.itinerary_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collaborator_invited ON trip_collaborators;
CREATE TRIGGER on_collaborator_invited
  AFTER INSERT ON trip_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION notify_collaborator_invited();
