-- Create creator_videos table for video content
CREATE TABLE IF NOT EXISTS creator_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,

  -- Video content
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL, -- YouTube URL or uploaded video URL
  video_type TEXT DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'uploaded', 'tiktok', 'instagram')),
  thumbnail_url TEXT,
  duration_seconds INTEGER,

  -- Location/destination info
  location TEXT, -- Primary location featured
  destinations TEXT[], -- All destinations mentioned
  place_ids UUID[], -- Linked places from our database

  -- Engagement metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,

  -- Status
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on creator_videos
ALTER TABLE creator_videos ENABLE ROW LEVEL SECURITY;

-- Everyone can view active videos
CREATE POLICY "Anyone can view active videos"
  ON creator_videos FOR SELECT
  USING (is_active = true);

-- Creators can manage their own videos
CREATE POLICY "Creators can insert own videos"
  ON creator_videos FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own videos"
  ON creator_videos FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own videos"
  ON creator_videos FOR DELETE
  USING (auth.uid() = creator_id);

-- Add referral tracking to bucket_list
ALTER TABLE bucket_list ADD COLUMN IF NOT EXISTS referred_by_creator_id UUID REFERENCES creators(id);
ALTER TABLE bucket_list ADD COLUMN IF NOT EXISTS referred_from_video_id UUID REFERENCES creator_videos(id);
ALTER TABLE bucket_list ADD COLUMN IF NOT EXISTS referral_converted BOOLEAN DEFAULT FALSE;
ALTER TABLE bucket_list ADD COLUMN IF NOT EXISTS conversion_booking_id UUID;

-- Create creator_referrals table to track commissions
CREATE TABLE IF NOT EXISTS creator_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  video_id UUID REFERENCES creator_videos(id),
  bucket_list_id UUID REFERENCES bucket_list(id),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Referral details
  place_name TEXT NOT NULL,
  place_location TEXT,

  -- Commission tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'paid', 'expired')),
  booking_amount DECIMAL(10,2),
  commission_rate DECIMAL(4,3) DEFAULT 0.10, -- 10% default
  commission_amount DECIMAL(10,2),

  -- Timestamps
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Enable RLS on creator_referrals
ALTER TABLE creator_referrals ENABLE ROW LEVEL SECURITY;

-- Creators can view their own referrals
CREATE POLICY "Creators can view own referrals"
  ON creator_referrals FOR SELECT
  USING (auth.uid() = creator_id);

-- System can insert referrals (via service role)
CREATE POLICY "System can insert referrals"
  ON creator_referrals FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_videos_creator_id ON creator_videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_videos_location ON creator_videos(location);
CREATE INDEX IF NOT EXISTS idx_creator_videos_is_featured ON creator_videos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_bucket_list_referred_by ON bucket_list(referred_by_creator_id) WHERE referred_by_creator_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_creator_referrals_creator_id ON creator_referrals(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_referrals_status ON creator_referrals(status);

-- Seed some sample creator videos (using YouTube Philippine travel videos)
-- These are popular travel videos that can be replaced with actual creator content later
INSERT INTO creator_videos (creator_id, title, description, video_url, video_type, thumbnail_url, location, destinations, is_featured)
SELECT
  c.id,
  'Exploring the Beauty of ' ||
    CASE (random() * 4)::int
      WHEN 0 THEN 'Palawan'
      WHEN 1 THEN 'Siargao'
      WHEN 2 THEN 'Cebu'
      WHEN 3 THEN 'Boracay'
      ELSE 'Bohol'
    END,
  'Join me as I discover hidden gems and amazing experiences in the Philippines!',
  CASE (random() * 4)::int
    WHEN 0 THEN 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    WHEN 1 THEN 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    WHEN 2 THEN 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    ELSE 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  END,
  'youtube',
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800',
  CASE (random() * 4)::int
    WHEN 0 THEN 'Palawan'
    WHEN 1 THEN 'Siargao'
    WHEN 2 THEN 'Cebu'
    WHEN 3 THEN 'Boracay'
    ELSE 'Bohol'
  END,
  ARRAY[
    CASE (random() * 4)::int
      WHEN 0 THEN 'Palawan'
      WHEN 1 THEN 'Siargao'
      WHEN 2 THEN 'Cebu'
      WHEN 3 THEN 'Boracay'
      ELSE 'Bohol'
    END
  ],
  true
FROM creators c
LIMIT 5;
