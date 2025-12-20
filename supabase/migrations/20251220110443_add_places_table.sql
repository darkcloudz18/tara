-- Places table for our own database of destinations and activities
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL, -- City/Province
    address TEXT,
    coordinates POINT,
    place_type TEXT NOT NULL, -- restaurant, hotel, attraction, beach, shopping, activity, transport
    category TEXT, -- sub-category like 'island-hopping', 'diving', 'local-food'
    photos TEXT[],
    average_rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    price_range TEXT, -- 'budget', 'moderate', 'luxury'
    estimated_cost DECIMAL(10,2),
    opening_hours TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    website TEXT,
    tags TEXT[], -- searchable tags
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Everyone can view active places
CREATE POLICY "Anyone can view active places" ON places
  FOR SELECT USING (is_active = true);

-- Only admins can manage places (for now, we'll use service role)
CREATE POLICY "Admins can manage places" ON places
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for faster searches
CREATE INDEX idx_places_location ON places(location);
CREATE INDEX idx_places_type ON places(place_type);
CREATE INDEX idx_places_featured ON places(is_featured) WHERE is_featured = true;
CREATE INDEX idx_places_tags ON places USING GIN(tags);

-- Seed with popular Philippine destinations and activities
INSERT INTO places (name, description, location, address, coordinates, place_type, category, price_range, estimated_cost, tags, is_featured) VALUES

-- BORACAY
('White Beach', 'Famous 4km stretch of white sand beach, perfect for swimming and sunset watching', 'Boracay', 'White Beach, Malay, Aklan', POINT(11.9674, 121.9248), 'beach', 'beach', 'budget', 0, ARRAY['beach', 'swimming', 'sunset', 'boracay', 'white-sand'], true),
('D''Mall Boracay', 'Main shopping and dining hub with restaurants, bars, and souvenir shops', 'Boracay', 'Station 2, Boracay', POINT(11.9631, 121.9244), 'shopping', 'mall', 'moderate', 500, ARRAY['shopping', 'food', 'nightlife', 'boracay'], true),
('Ariel''s Point', 'Cliff diving, snorkeling, and party spot with unlimited drinks', 'Boracay', 'Buruanga, Aklan', POINT(11.8833, 121.9167), 'activity', 'cliff-diving', 'moderate', 2500, ARRAY['cliff-diving', 'snorkeling', 'party', 'boracay', 'adventure'], true),
('Puka Shell Beach', 'Quieter beach known for puka shells, less crowded than White Beach', 'Boracay', 'Yapak, Boracay', POINT(11.9892, 121.9297), 'beach', 'beach', 'budget', 0, ARRAY['beach', 'quiet', 'shells', 'boracay'], false),
('Island Hopping Boracay', 'Visit Crystal Cove, Crocodile Island, and snorkeling spots', 'Boracay', 'Boracay Island', POINT(11.9674, 121.9248), 'activity', 'island-hopping', 'moderate', 1500, ARRAY['island-hopping', 'snorkeling', 'boat-tour', 'boracay'], true),

-- PALAWAN - EL NIDO
('Big Lagoon', 'Stunning lagoon with towering limestone cliffs, part of Tour A', 'El Nido', 'Miniloc Island, El Nido', POINT(11.1833, 119.3667), 'attraction', 'lagoon', 'moderate', 1400, ARRAY['lagoon', 'kayaking', 'el-nido', 'tour-a', 'limestone'], true),
('Small Lagoon', 'Crystal clear lagoon accessible by kayak through a small opening', 'El Nido', 'Miniloc Island, El Nido', POINT(11.1750, 119.3583), 'attraction', 'lagoon', 'moderate', 1400, ARRAY['lagoon', 'kayaking', 'el-nido', 'tour-a'], true),
('Nacpan Beach', 'Long stretch of golden sand beach, one of the best in the Philippines', 'El Nido', 'Nacpan, El Nido', POINT(11.3167, 119.4333), 'beach', 'beach', 'budget', 0, ARRAY['beach', 'golden-sand', 'el-nido', 'swimming'], true),
('Secret Lagoon', 'Hidden lagoon inside a rock formation, magical swimming spot', 'El Nido', 'Miniloc Island, El Nido', POINT(11.1833, 119.3583), 'attraction', 'lagoon', 'moderate', 1400, ARRAY['lagoon', 'secret', 'el-nido', 'tour-a', 'swimming'], false),
('El Nido Tour A', 'Big Lagoon, Small Lagoon, Secret Lagoon, Shimizu Island', 'El Nido', 'El Nido, Palawan', POINT(11.1833, 119.3917), 'activity', 'island-hopping', 'moderate', 1400, ARRAY['island-hopping', 'el-nido', 'tour-a', 'lagoons'], true),
('El Nido Tour C', 'Hidden Beach, Secret Beach, Matinloc Shrine, Helicopter Island', 'El Nido', 'El Nido, Palawan', POINT(11.1833, 119.3917), 'activity', 'island-hopping', 'moderate', 1500, ARRAY['island-hopping', 'el-nido', 'tour-c', 'beaches'], true),

-- PALAWAN - CORON
('Kayangan Lake', 'Crystal clear lake often called the cleanest lake in the Philippines', 'Coron', 'Coron Island, Palawan', POINT(11.9833, 120.2333), 'attraction', 'lake', 'moderate', 1500, ARRAY['lake', 'swimming', 'coron', 'cleanest-lake', 'viewpoint'], true),
('Twin Lagoon', 'Two lagoons connected by a small gap in the rock, hot and cold water', 'Coron', 'Coron Island, Palawan', POINT(11.9750, 120.2167), 'attraction', 'lagoon', 'moderate', 1500, ARRAY['lagoon', 'swimming', 'coron', 'hot-spring'], true),
('Barracuda Lake', 'Unique diving spot with hot and cold thermoclines', 'Coron', 'Coron Island, Palawan', POINT(11.9833, 120.2250), 'activity', 'diving', 'moderate', 1500, ARRAY['diving', 'lake', 'coron', 'thermocline'], false),
('Japanese Shipwreck', 'WWII shipwreck diving site, one of the best in Asia', 'Coron', 'Coron Bay, Palawan', POINT(11.9917, 120.2083), 'activity', 'diving', 'moderate', 2500, ARRAY['diving', 'wreck', 'coron', 'wwii', 'scuba'], true),
('Mt. Tapyas', 'Climb 724 steps for panoramic sunset views of Coron town', 'Coron', 'Coron Town, Palawan', POINT(11.9917, 120.2083), 'attraction', 'viewpoint', 'budget', 0, ARRAY['hiking', 'viewpoint', 'sunset', 'coron', 'free'], true),

-- CEBU
('Kawasan Falls', 'Three-tiered waterfall famous for canyoneering adventures', 'Cebu', 'Badian, Cebu', POINT(9.8167, 123.3833), 'attraction', 'waterfall', 'moderate', 1000, ARRAY['waterfall', 'canyoneering', 'cebu', 'swimming', 'adventure'], true),
('Oslob Whale Sharks', 'Swim with gentle whale sharks (controversial but popular)', 'Cebu', 'Oslob, Cebu', POINT(9.4667, 123.3833), 'activity', 'wildlife', 'moderate', 1500, ARRAY['whale-sharks', 'swimming', 'cebu', 'wildlife'], true),
('Moalboal Sardine Run', 'Snorkel with millions of sardines in a massive bait ball', 'Cebu', 'Moalboal, Cebu', POINT(9.9500, 123.4000), 'activity', 'snorkeling', 'budget', 500, ARRAY['snorkeling', 'sardines', 'cebu', 'diving', 'moalboal'], true),
('Temple of Leah', 'Roman-inspired temple with panoramic views of Cebu City', 'Cebu', 'Cebu City', POINT(10.3500, 123.8667), 'attraction', 'temple', 'budget', 100, ARRAY['temple', 'viewpoint', 'cebu-city', 'architecture'], false),
('Magellan''s Cross', 'Historic cross planted by Ferdinand Magellan in 1521', 'Cebu', 'Cebu City', POINT(10.2933, 123.9022), 'attraction', 'historical', 'budget', 0, ARRAY['historical', 'cebu-city', 'landmark', 'free'], true),

-- SIARGAO
('Cloud 9', 'World-famous surfing spot with powerful reef breaks', 'Siargao', 'General Luna, Siargao', POINT(9.8500, 126.1167), 'beach', 'surfing', 'budget', 50, ARRAY['surfing', 'siargao', 'cloud-9', 'waves', 'pro-surfers'], true),
('Sugba Lagoon', 'Stunning turquoise lagoon perfect for paddleboarding and swimming', 'Siargao', 'Del Carmen, Siargao', POINT(9.8833, 125.9833), 'attraction', 'lagoon', 'moderate', 1000, ARRAY['lagoon', 'paddleboard', 'siargao', 'swimming'], true),
('Magpupungko Rock Pools', 'Natural tidal pools with crystal clear water', 'Siargao', 'Pilar, Siargao', POINT(9.9333, 126.0833), 'attraction', 'rock-pools', 'budget', 50, ARRAY['rock-pools', 'swimming', 'siargao', 'low-tide'], true),
('Naked Island', 'Small sandbar island with no shade, pure white sand', 'Siargao', 'General Luna, Siargao', POINT(9.8167, 126.1500), 'beach', 'island', 'moderate', 1500, ARRAY['island', 'sandbar', 'siargao', 'island-hopping'], false),
('Sohoton Cove', 'Enchanting lagoon with stingless jellyfish and caves', 'Siargao', 'Del Carmen, Siargao', POINT(9.9000, 125.9667), 'attraction', 'lagoon', 'moderate', 1500, ARRAY['lagoon', 'jellyfish', 'caves', 'siargao', 'sohoton'], true),

-- BOHOL
('Chocolate Hills', 'Over 1,200 cone-shaped hills that turn brown in dry season', 'Bohol', 'Carmen, Bohol', POINT(9.8000, 124.1333), 'attraction', 'geological', 'budget', 50, ARRAY['chocolate-hills', 'bohol', 'viewpoint', 'landmark'], true),
('Tarsier Sanctuary', 'See the world''s smallest primates in their natural habitat', 'Bohol', 'Loboc, Bohol', POINT(9.6333, 124.0167), 'attraction', 'wildlife', 'budget', 100, ARRAY['tarsier', 'wildlife', 'bohol', 'sanctuary'], true),
('Loboc River Cruise', 'Floating restaurant cruise along the scenic Loboc River', 'Bohol', 'Loboc, Bohol', POINT(9.6333, 124.0167), 'activity', 'cruise', 'moderate', 600, ARRAY['river-cruise', 'lunch', 'bohol', 'loboc'], true),
('Panglao Beach', 'White sand beach with great diving and snorkeling', 'Bohol', 'Panglao Island, Bohol', POINT(9.5667, 123.7667), 'beach', 'beach', 'budget', 0, ARRAY['beach', 'diving', 'panglao', 'bohol', 'white-sand'], true),
('Balicasag Island', 'Marine sanctuary with excellent diving and dolphin watching', 'Bohol', 'Panglao, Bohol', POINT(9.5167, 123.6833), 'activity', 'diving', 'moderate', 2000, ARRAY['diving', 'dolphins', 'marine-sanctuary', 'bohol', 'island-hopping'], true),

-- MANILA
('Intramuros', 'Historic walled city from Spanish colonial era', 'Manila', 'Intramuros, Manila', POINT(14.5889, 120.9750), 'attraction', 'historical', 'budget', 100, ARRAY['historical', 'manila', 'spanish', 'walled-city', 'walking-tour'], true),
('Rizal Park', 'Large urban park with monuments, gardens, and the National Museum', 'Manila', 'Ermita, Manila', POINT(14.5833, 120.9833), 'attraction', 'park', 'budget', 0, ARRAY['park', 'manila', 'rizal', 'national-museum', 'free'], true),
('BGC (Bonifacio Global City)', 'Modern district with restaurants, shops, and nightlife', 'Manila', 'Taguig, Metro Manila', POINT(14.5500, 121.0500), 'shopping', 'district', 'moderate', 1000, ARRAY['shopping', 'dining', 'nightlife', 'manila', 'modern'], false),
('Binondo Chinatown', 'World''s oldest Chinatown with amazing street food', 'Manila', 'Binondo, Manila', POINT(14.5997, 120.9736), 'attraction', 'food-district', 'budget', 500, ARRAY['chinatown', 'food', 'manila', 'street-food', 'oldest'], true),
('San Agustin Church', 'UNESCO World Heritage baroque church from 1607', 'Manila', 'Intramuros, Manila', POINT(14.5878, 120.9753), 'attraction', 'church', 'budget', 0, ARRAY['church', 'unesco', 'manila', 'baroque', 'historical'], true),

-- BAGUIO
('Burnham Park', 'Iconic park with boat rides, gardens, and the famous orchidarium', 'Baguio', 'Baguio City', POINT(16.4119, 120.5967), 'attraction', 'park', 'budget', 100, ARRAY['park', 'baguio', 'boat-rides', 'gardens'], true),
('Mines View Park', 'Viewpoint overlooking abandoned mining town and mountains', 'Baguio', 'Baguio City', POINT(16.4167, 120.6167), 'attraction', 'viewpoint', 'budget', 0, ARRAY['viewpoint', 'baguio', 'mountains', 'souvenir-shopping'], true),
('Strawberry Farm', 'Pick your own strawberries at La Trinidad farms', 'Baguio', 'La Trinidad, Benguet', POINT(16.4500, 120.5833), 'activity', 'farm', 'budget', 300, ARRAY['strawberry', 'farm', 'baguio', 'pick-your-own'], true),
('Session Road', 'Main commercial street with shops, cafes, and restaurants', 'Baguio', 'Baguio City', POINT(16.4117, 120.5958), 'shopping', 'street', 'moderate', 500, ARRAY['shopping', 'baguio', 'food', 'cafes'], false),

-- VIGAN
('Calle Crisologo', 'UNESCO heritage cobblestone street with Spanish colonial houses', 'Vigan', 'Vigan City, Ilocos Sur', POINT(17.5747, 120.3869), 'attraction', 'heritage-street', 'budget', 0, ARRAY['heritage', 'vigan', 'unesco', 'spanish-colonial', 'cobblestone'], true),
('Vigan Empanada', 'Famous orange empanada with egg, try at Plaza Burgos', 'Vigan', 'Plaza Burgos, Vigan', POINT(17.5750, 120.3867), 'restaurant', 'local-food', 'budget', 50, ARRAY['empanada', 'food', 'vigan', 'local-delicacy'], true),
('Kalesa Ride Vigan', 'Horse-drawn carriage tour around the heritage city', 'Vigan', 'Vigan City', POINT(17.5747, 120.3869), 'activity', 'tour', 'budget', 150, ARRAY['kalesa', 'tour', 'vigan', 'heritage'], true),

-- BATANES
('Basco Lighthouse', 'Iconic lighthouse with stunning ocean views', 'Batanes', 'Basco, Batanes', POINT(20.4500, 121.9667), 'attraction', 'lighthouse', 'budget', 0, ARRAY['lighthouse', 'batanes', 'viewpoint', 'ocean'], true),
('Marlboro Country', 'Rolling green hills that look like scenes from Marlboro ads', 'Batanes', 'Mahatao, Batanes', POINT(20.4000, 121.9500), 'attraction', 'landscape', 'budget', 0, ARRAY['hills', 'batanes', 'scenery', 'instagram'], true),
('Valugan Boulder Beach', 'Unique beach covered in large volcanic boulders', 'Batanes', 'Basco, Batanes', POINT(20.4667, 121.9833), 'beach', 'beach', 'budget', 0, ARRAY['beach', 'boulders', 'batanes', 'volcanic'], true),
('Honesty Coffee Shop', 'Unmanned store based on the honor system', 'Batanes', 'Ivana, Batanes', POINT(20.3667, 121.9167), 'attraction', 'unique', 'budget', 100, ARRAY['honesty', 'coffee', 'batanes', 'unique'], true);
