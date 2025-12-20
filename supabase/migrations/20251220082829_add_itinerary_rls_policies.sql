-- Enable RLS on itinerary tables
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Public itineraries viewable by everyone" ON itineraries;
DROP POLICY IF EXISTS "Users can manage own itinerary days" ON itinerary_days;
DROP POLICY IF EXISTS "Users can manage own activities" ON itinerary_activities;

-- Itineraries: users can do everything with their own itineraries
CREATE POLICY "Users can manage own itineraries" ON itineraries
  FOR ALL USING (auth.uid() = user_id);

-- Itineraries: public ones are viewable by everyone
CREATE POLICY "Public itineraries viewable by everyone" ON itineraries
  FOR SELECT USING (is_public = true);

-- Days: users can manage days of their own itineraries
CREATE POLICY "Users can manage own itinerary days" ON itinerary_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM itineraries
      WHERE itineraries.id = itinerary_days.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Activities: users can manage activities of their own itineraries
CREATE POLICY "Users can manage own activities" ON itinerary_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM itinerary_days
      JOIN itineraries ON itineraries.id = itinerary_days.itinerary_id
      WHERE itinerary_days.id = itinerary_activities.day_id
      AND itineraries.user_id = auth.uid()
    )
  );
