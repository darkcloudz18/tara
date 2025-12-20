-- Enable RLS on listings table
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active listings (for suggestions)
DROP POLICY IF EXISTS "Anyone can view active listings" ON listings;
CREATE POLICY "Anyone can view active listings" ON listings
  FOR SELECT USING (is_active = true);

-- Suppliers can manage their own listings
DROP POLICY IF EXISTS "Suppliers can manage own listings" ON listings;
CREATE POLICY "Suppliers can manage own listings" ON listings
  FOR ALL USING (auth.uid() = supplier_id);
