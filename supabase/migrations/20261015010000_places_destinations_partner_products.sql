-- Task 15 — Places + destinations schema and editor role.
-- Spec: docs/places-spec.md
--
-- Shape:
--   1. profiles.is_editor BOOLEAN (matches existing is_admin/is_moderator pattern)
--   2. destinations table (new) — folds in Task 16's min_viable_days + travel_times
--      so Smart Build has one place to rank on.
--   3. places gets 20 new columns from the spec. Existing columns (description,
--      category, photos, is_active, ...) are left alone. slug is nullable because
--      253 existing rows have no slug; a partial unique index enforces uniqueness
--      among non-null values. The admin UI will enforce slug + the thin-page bar
--      on save.
--   4. partner_products table (new).
--   5. updated_at triggers on destinations + partner_products.
--   6. RLS: public reads published destinations + active partner_products;
--      the existing "Anyone can view active places" places policy is left as-is
--      so the Discover feed keeps working. Editors (is_admin OR is_editor) get
--      INSERT / UPDATE on all three tables. Only admins can DELETE.

-- ---------------------------------------------------------------------------
-- 1. profiles.is_editor
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_editor BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_is_editor ON profiles(is_editor) WHERE is_editor = true;

-- Server-side helper used by the editor policies below. SECURITY DEFINER
-- so RLS on profiles doesn't re-evaluate inside the policy check.
CREATE OR REPLACE FUNCTION current_user_can_edit_content() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT is_admin OR is_editor FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION current_user_is_admin() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- 2. destinations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS destinations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  region          TEXT,
  summary         TEXT,
  description     TEXT,
  getting_there   TEXT,
  best_months     INT[],
  typical_days    INT,
  budget_low      NUMERIC,
  budget_mid      NUMERIC,
  budget_high     NUMERIC,
  min_viable_days INT,                     -- Task 16: Smart Build hard filter
  travel_times    JSONB,                   -- Task 16: {"manila": 240, "cebu": 90} door-to-door minutes
  tips            TEXT[],
  source_urls     TEXT[],
  verified_at     TIMESTAMPTZ,
  verified_by     TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'needs_review')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destinations_status ON destinations(status);
CREATE INDEX IF NOT EXISTS idx_destinations_verified_at ON destinations(verified_at);

-- ---------------------------------------------------------------------------
-- 3. places: additive columns
-- ---------------------------------------------------------------------------

ALTER TABLE places
  ADD COLUMN IF NOT EXISTS slug             TEXT,
  ADD COLUMN IF NOT EXISTS destination_id   UUID REFERENCES destinations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS summary          TEXT,
  ADD COLUMN IF NOT EXISTS entrance_fee     NUMERIC,
  ADD COLUMN IF NOT EXISTS fee_notes        TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INT,
  ADD COLUMN IF NOT EXISTS getting_there    TEXT,
  ADD COLUMN IF NOT EXISTS nearest_hub      TEXT,
  ADD COLUMN IF NOT EXISTS best_time_of_day TEXT,
  ADD COLUMN IF NOT EXISTS best_months      INT[],
  ADD COLUMN IF NOT EXISTS booking_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_notes    TEXT,
  ADD COLUMN IF NOT EXISTS part_of_tour     TEXT,
  ADD COLUMN IF NOT EXISTS pairs_with       UUID[],
  ADD COLUMN IF NOT EXISTS not_same_day_as  UUID[],
  ADD COLUMN IF NOT EXISTS tips             TEXT[],
  ADD COLUMN IF NOT EXISTS source_urls      TEXT[],
  ADD COLUMN IF NOT EXISTS verified_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by      TEXT,
  ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'draft';

ALTER TABLE places DROP CONSTRAINT IF EXISTS places_status_check;
ALTER TABLE places ADD CONSTRAINT places_status_check
  CHECK (status IN ('draft', 'published', 'needs_review'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_places_slug ON places(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_places_destination ON places(destination_id);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_places_verified_at ON places(verified_at);

-- ---------------------------------------------------------------------------
-- 4. partner_products
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partner_products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id       UUID REFERENCES places(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
  partner        TEXT NOT NULL,
  product_name   TEXT,
  product_type   TEXT NOT NULL CHECK (product_type IN ('activity', 'stay', 'transfer', 'addon')),
  price_from     NUMERIC,
  includes       TEXT,
  deeplink       TEXT NOT NULL,
  priority       INT DEFAULT 0,
  active         BOOLEAN DEFAULT true,
  verified_at    TIMESTAMPTZ,
  verified_by    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT partner_products_attachment
    CHECK (place_id IS NOT NULL OR destination_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_partner_products_place ON partner_products(place_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_destination ON partner_products(destination_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_active ON partner_products(active) WHERE active = true;

-- ---------------------------------------------------------------------------
-- 5. updated_at triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION places_schema_touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS destinations_touch_updated_at ON destinations;
CREATE TRIGGER destinations_touch_updated_at
  BEFORE UPDATE ON destinations
  FOR EACH ROW EXECUTE FUNCTION places_schema_touch_updated_at();

DROP TRIGGER IF EXISTS partner_products_touch_updated_at ON partner_products;
CREATE TRIGGER partner_products_touch_updated_at
  BEFORE UPDATE ON partner_products
  FOR EACH ROW EXECUTE FUNCTION places_schema_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------

-- --- destinations ---------------------------------------------------------
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "destinations: public reads published" ON destinations;
CREATE POLICY "destinations: public reads published" ON destinations
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "destinations: editors read all" ON destinations;
CREATE POLICY "destinations: editors read all" ON destinations
  FOR SELECT USING (current_user_can_edit_content());

DROP POLICY IF EXISTS "destinations: editors insert" ON destinations;
CREATE POLICY "destinations: editors insert" ON destinations
  FOR INSERT WITH CHECK (current_user_can_edit_content());

DROP POLICY IF EXISTS "destinations: editors update" ON destinations;
CREATE POLICY "destinations: editors update" ON destinations
  FOR UPDATE USING (current_user_can_edit_content());

DROP POLICY IF EXISTS "destinations: admins delete" ON destinations;
CREATE POLICY "destinations: admins delete" ON destinations
  FOR DELETE USING (current_user_is_admin());

-- --- places ---------------------------------------------------------------
-- "Anyone can view active places" (is_active = true) is kept untouched —
-- Discover feed and existing read paths depend on it. Editor policies are
-- additive: they can read inactive/draft rows and write.

DROP POLICY IF EXISTS "places: editors read all" ON places;
CREATE POLICY "places: editors read all" ON places
  FOR SELECT USING (current_user_can_edit_content());

DROP POLICY IF EXISTS "places: editors insert" ON places;
CREATE POLICY "places: editors insert" ON places
  FOR INSERT WITH CHECK (current_user_can_edit_content());

DROP POLICY IF EXISTS "places: editors update" ON places;
CREATE POLICY "places: editors update" ON places
  FOR UPDATE USING (current_user_can_edit_content());

DROP POLICY IF EXISTS "places: admins delete" ON places;
CREATE POLICY "places: admins delete" ON places
  FOR DELETE USING (current_user_is_admin());

-- --- partner_products -----------------------------------------------------
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_products: public reads active" ON partner_products;
CREATE POLICY "partner_products: public reads active" ON partner_products
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "partner_products: editors read all" ON partner_products;
CREATE POLICY "partner_products: editors read all" ON partner_products
  FOR SELECT USING (current_user_can_edit_content());

DROP POLICY IF EXISTS "partner_products: editors insert" ON partner_products;
CREATE POLICY "partner_products: editors insert" ON partner_products
  FOR INSERT WITH CHECK (current_user_can_edit_content());

DROP POLICY IF EXISTS "partner_products: editors update" ON partner_products;
CREATE POLICY "partner_products: editors update" ON partner_products
  FOR UPDATE USING (current_user_can_edit_content());

DROP POLICY IF EXISTS "partner_products: admins delete" ON partner_products;
CREATE POLICY "partner_products: admins delete" ON partner_products
  FOR DELETE USING (current_user_is_admin());
