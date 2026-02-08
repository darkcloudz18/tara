-- Trip expenses table for budget tracking
CREATE TABLE IF NOT EXISTS trip_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES itinerary_activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('transport', 'food', 'accommodation', 'activities', 'shopping', 'other')),
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trip_expenses_itinerary ON trip_expenses(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_date ON trip_expenses(date);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_category ON trip_expenses(category);

-- Row Level Security
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;

-- Users can view expenses on their own trips or trips they collaborate on
DROP POLICY IF EXISTS "Users can view trip expenses" ON trip_expenses;
CREATE POLICY "Users can view trip expenses"
  ON trip_expenses FOR SELECT
  USING (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    )
    OR itinerary_id IN (
      SELECT itinerary_id FROM trip_collaborators
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Users can add expenses to their own trips or trips they can edit
DROP POLICY IF EXISTS "Users can add expenses" ON trip_expenses;
CREATE POLICY "Users can add expenses"
  ON trip_expenses FOR INSERT
  WITH CHECK (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    )
    OR itinerary_id IN (
      SELECT itinerary_id FROM trip_collaborators
      WHERE user_id = auth.uid() AND status = 'accepted' AND role IN ('owner', 'editor')
    )
  );

-- Users can update their own expenses
DROP POLICY IF EXISTS "Users can update expenses" ON trip_expenses;
CREATE POLICY "Users can update expenses"
  ON trip_expenses FOR UPDATE
  USING (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    )
    OR itinerary_id IN (
      SELECT itinerary_id FROM trip_collaborators
      WHERE user_id = auth.uid() AND status = 'accepted' AND role IN ('owner', 'editor')
    )
  );

-- Users can delete expenses on their trips
DROP POLICY IF EXISTS "Users can delete expenses" ON trip_expenses;
CREATE POLICY "Users can delete expenses"
  ON trip_expenses FOR DELETE
  USING (
    itinerary_id IN (
      SELECT id FROM itineraries WHERE user_id = auth.uid()
    )
    OR itinerary_id IN (
      SELECT itinerary_id FROM trip_collaborators
      WHERE user_id = auth.uid() AND status = 'accepted' AND role IN ('owner', 'editor')
    )
  );
