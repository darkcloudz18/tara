-- Notifications table for user alerts
-- Using DO block for idempotent operations

-- Add missing columns if table exists
DO $$
BEGIN
  -- Check if table exists, if not create it
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      data JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  ELSE
    -- Add is_read column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
      ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;

    -- Add data column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'data') THEN
      ALTER TABLE notifications ADD COLUMN data JSONB DEFAULT '{}';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'notifications' AND column_name = 'updated_at') THEN
      ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
  END IF;
END $$;

-- Indexes for performance (using IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create partial index only if is_read column exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns
             WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_notifications_user_unread') THEN
      CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
    END IF;
  END IF;
END $$;

-- Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert notifications" ON notifications;
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for notifications (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notifications_updated_at ON notifications;
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();
