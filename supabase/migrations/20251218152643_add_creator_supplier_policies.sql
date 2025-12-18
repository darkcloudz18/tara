-- Add RLS policies for creators table
CREATE POLICY "Users can view all creators" ON creators FOR SELECT USING (true);
CREATE POLICY "Users can create own creator profile" ON creators FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own creator profile" ON creators FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own creator profile" ON creators FOR DELETE USING (auth.uid() = id);

-- Add RLS policies for suppliers table
CREATE POLICY "Users can view all suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Users can create own supplier profile" ON suppliers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own supplier profile" ON suppliers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own supplier profile" ON suppliers FOR DELETE USING (auth.uid() = id);

-- Add INSERT policy for profiles (users need to be able to insert their own profile)
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
