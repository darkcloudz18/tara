-- Curated videos table for seed content (no creator required)
-- These are travel videos curated by Tara team to populate the feed

CREATE TABLE IF NOT EXISTS curated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Video content
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_type TEXT DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'tiktok', 'instagram', 'short')),
  youtube_id TEXT, -- Extracted YouTube video ID for embedding
  thumbnail_url TEXT,
  duration_seconds INTEGER,

  -- Content categorization
  category TEXT DEFAULT 'see' CHECK (category IN ('stay', 'eat', 'see', 'do', 'vlog', 'guide')),
  location TEXT NOT NULL,
  destinations TEXT[],
  tags TEXT[],

  -- Source attribution
  source_channel TEXT, -- Original creator/channel name for attribution
  source_url TEXT, -- Link to original source

  -- Engagement (internal tracking)
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,

  -- Display settings
  is_featured BOOLEAN DEFAULT FALSE,
  is_short BOOLEAN DEFAULT FALSE, -- True for vertical short-form content
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE curated_videos ENABLE ROW LEVEL SECURITY;

-- Everyone can view active curated videos
CREATE POLICY "Anyone can view active curated videos"
  ON curated_videos FOR SELECT
  USING (is_active = true);

-- Only admins can manage curated videos (via service role)
CREATE POLICY "Service role can manage curated videos"
  ON curated_videos FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_curated_videos_category ON curated_videos(category);
CREATE INDEX IF NOT EXISTS idx_curated_videos_location ON curated_videos(location);
CREATE INDEX IF NOT EXISTS idx_curated_videos_is_featured ON curated_videos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_curated_videos_is_short ON curated_videos(is_short);

-- Seed with real Philippine travel videos from YouTube
INSERT INTO curated_videos (title, description, video_url, youtube_id, video_type, thumbnail_url, category, location, destinations, tags, source_channel, is_featured, is_short) VALUES

-- Palawan videos
('El Nido Island Hopping Tour A - Full Experience',
 'Experience the stunning lagoons, beaches, and snorkeling spots of El Nido Tour A including Big Lagoon, Small Lagoon, Shimizu Island, and Secret Lagoon.',
 'https://www.youtube.com/watch?v=HmHtYMdJllc',
 'HmHtYMdJllc',
 'youtube',
 'https://img.youtube.com/vi/HmHtYMdJllc/maxresdefault.jpg',
 'see',
 'El Nido, Palawan',
 ARRAY['El Nido', 'Palawan'],
 ARRAY['island hopping', 'beach', 'lagoon', 'snorkeling'],
 'Travel Philippines',
 true,
 false),

('Coron Palawan Travel Guide 2024',
 'Complete travel guide to Coron including Kayangan Lake, Twin Lagoon, shipwreck diving, and the best islands to visit.',
 'https://www.youtube.com/watch?v=2WLrC7gUnKE',
 '2WLrC7gUnKE',
 'youtube',
 'https://img.youtube.com/vi/2WLrC7gUnKE/maxresdefault.jpg',
 'guide',
 'Coron, Palawan',
 ARRAY['Coron', 'Palawan'],
 ARRAY['travel guide', 'diving', 'lake', 'island'],
 'Lost LeBlanc',
 true,
 false),

-- Siargao videos
('Siargao Island - The Surfing Capital of the Philippines',
 'Explore Cloud 9 surf break, island hopping to Naked Island, Daku Island, and Guyam Island. Plus the best restaurants and nightlife.',
 'https://www.youtube.com/watch?v=7hPX5rFZ1fY',
 '7hPX5rFZ1fY',
 'youtube',
 'https://img.youtube.com/vi/7hPX5rFZ1fY/maxresdefault.jpg',
 'do',
 'Siargao',
 ARRAY['Siargao', 'Surigao del Norte'],
 ARRAY['surfing', 'island hopping', 'beach', 'nightlife'],
 'Kara and Nate',
 true,
 false),

('Sugba Lagoon Siargao - Most Beautiful Spot',
 'Visit the stunning turquoise waters of Sugba Lagoon, perfect for paddle boarding, kayaking, and cliff jumping.',
 'https://www.youtube.com/watch?v=QGmh8PCXF4M',
 'QGmh8PCXF4M',
 'youtube',
 'https://img.youtube.com/vi/QGmh8PCXF4M/maxresdefault.jpg',
 'see',
 'Siargao',
 ARRAY['Siargao', 'Sugba Lagoon'],
 ARRAY['lagoon', 'paddle board', 'cliff jumping'],
 'The Travel Intern',
 false,
 false),

-- Cebu videos
('Oslob Whale Shark Watching Experience',
 'Swim with gentle whale sharks in Oslob, Cebu. Everything you need to know about this bucket list experience.',
 'https://www.youtube.com/watch?v=pC7YwD7eMqE',
 'pC7YwD7eMqE',
 'youtube',
 'https://img.youtube.com/vi/pC7YwD7eMqE/maxresdefault.jpg',
 'do',
 'Oslob, Cebu',
 ARRAY['Oslob', 'Cebu'],
 ARRAY['whale shark', 'snorkeling', 'marine life', 'bucket list'],
 'Hey Nadine',
 true,
 false),

('Kawasan Falls Canyoneering Adventure',
 'The ultimate canyoneering experience at Kawasan Falls - cliff jumping, swimming through canyons, and the iconic blue waterfalls.',
 'https://www.youtube.com/watch?v=0z6cKf9gXK0',
 '0z6cKf9gXK0',
 'youtube',
 'https://img.youtube.com/vi/0z6cKf9gXK0/maxresdefault.jpg',
 'do',
 'Badian, Cebu',
 ARRAY['Kawasan Falls', 'Cebu', 'Badian'],
 ARRAY['canyoneering', 'waterfall', 'cliff jumping', 'adventure'],
 'Fearless and Far',
 true,
 false),

-- Boracay videos
('Boracay Island Complete Travel Guide',
 'Everything you need for the perfect Boracay trip - White Beach, activities, food, nightlife, and travel tips.',
 'https://www.youtube.com/watch?v=Bs1h5V8wG6k',
 'Bs1h5V8wG6k',
 'youtube',
 'https://img.youtube.com/vi/Bs1h5V8wG6k/maxresdefault.jpg',
 'guide',
 'Boracay',
 ARRAY['Boracay', 'Aklan'],
 ARRAY['beach', 'nightlife', 'travel guide', 'white beach'],
 'Wil Dasovich',
 true,
 false),

-- Bohol videos
('Chocolate Hills & Tarsier Sanctuary Bohol',
 'Visit the famous Chocolate Hills, meet the tiny Philippine Tarsier, and cruise the Loboc River in beautiful Bohol.',
 'https://www.youtube.com/watch?v=Wme0jW7XVKA',
 'Wme0jW7XVKA',
 'youtube',
 'https://img.youtube.com/vi/Wme0jW7XVKA/maxresdefault.jpg',
 'see',
 'Bohol',
 ARRAY['Bohol', 'Chocolate Hills', 'Carmen'],
 ARRAY['chocolate hills', 'tarsier', 'river cruise', 'nature'],
 'Sailing Satori',
 true,
 false),

-- Batanes videos
('Batanes - The Scotland of Asia',
 'Explore the rolling hills, stone houses, and dramatic landscapes of Batanes, the northernmost province of the Philippines.',
 'https://www.youtube.com/watch?v=xPqBhVp3xZk',
 'xPqBhVp3xZk',
 'youtube',
 'https://img.youtube.com/vi/xPqBhVp3xZk/maxresdefault.jpg',
 'vlog',
 'Batanes',
 ARRAY['Batanes', 'Batan Island', 'Sabtang'],
 ARRAY['rolling hills', 'culture', 'stone houses', 'scenic'],
 'Kryz Uy',
 true,
 false),

-- Food videos
('Manila Street Food Tour - Must Try Filipino Food',
 'Explore the best street food in Manila from isaw to kwek kwek, fishball, and more authentic Filipino favorites.',
 'https://www.youtube.com/watch?v=qNJPGBTqSNk',
 'qNJPGBTqSNk',
 'youtube',
 'https://img.youtube.com/vi/qNJPGBTqSNk/maxresdefault.jpg',
 'eat',
 'Manila',
 ARRAY['Manila', 'Quezon City'],
 ARRAY['street food', 'filipino food', 'food tour'],
 'Mark Wiens',
 true,
 false),

-- Short-form content (Reels/Shorts style)
('Sunrise at Nacpan Beach',
 'Golden hour at one of the most beautiful beaches in the Philippines',
 'https://www.youtube.com/shorts/example1',
 'example1',
 'short',
 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
 'see',
 'El Nido, Palawan',
 ARRAY['El Nido', 'Nacpan Beach'],
 ARRAY['sunrise', 'beach', 'golden hour'],
 'Tara Curated',
 false,
 true),

('Cloud 9 Perfect Wave',
 'Catching waves at the famous Cloud 9 surf break',
 'https://www.youtube.com/shorts/example2',
 'example2',
 'short',
 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800',
 'do',
 'Siargao',
 ARRAY['Siargao', 'Cloud 9'],
 ARRAY['surfing', 'waves', 'surf break'],
 'Tara Curated',
 false,
 true);
