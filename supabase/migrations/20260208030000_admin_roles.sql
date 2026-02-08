-- Admin roles and permissions

-- Add is_admin column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- Content reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('trip', 'comment', 'review', 'user')),
  content_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'misleading', 'harassment', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_type ON content_reports(content_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- RLS policies for content_reports
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Only admins can view all reports
DROP POLICY IF EXISTS "Admins can view reports" ON content_reports;
CREATE POLICY "Admins can view reports" ON content_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_moderator = true))
  );

-- Only admins can update reports
DROP POLICY IF EXISTS "Admins can update reports" ON content_reports;
CREATE POLICY "Admins can update reports" ON content_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_moderator = true))
  );

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin log
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created ON admin_activity_log(created_at DESC);

-- RLS for admin log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view log" ON admin_activity_log;
CREATE POLICY "Admins can view log" ON admin_activity_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can insert log" ON admin_activity_log;
CREATE POLICY "Admins can insert log" ON admin_activity_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_moderator = true))
  );
