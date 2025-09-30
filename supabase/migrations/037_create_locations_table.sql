-- Locations Table Migration
-- This migration creates a self-referencing locations table for hierarchical location data

-- Create locations table
CREATE TABLE locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0, -- 0 = country, 1 = state/province, 2 = city, 3 = district, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance on parent_id lookups
CREATE INDEX idx_locations_parent_id ON locations(parent_id);
CREATE INDEX idx_locations_level ON locations(level);
CREATE INDEX idx_locations_name ON locations(name);

-- Add RLS policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read locations
CREATE POLICY "Anyone can view locations" ON locations
  FOR SELECT USING (true);

-- Allow authenticated users to insert locations
CREATE POLICY "Authenticated users can insert locations" ON locations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update locations
CREATE POLICY "Authenticated users can update locations" ON locations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete locations
CREATE POLICY "Authenticated users can delete locations" ON locations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample hierarchical location data
INSERT INTO locations (id, name, parent_id, level) VALUES
-- Countries (level 0)
('550e8400-e29b-41d4-a716-446655440001', 'Turkey', NULL, 0),
('550e8400-e29b-41d4-a716-446655440002', 'United States', NULL, 0),
('550e8400-e29b-41d4-a716-446655440003', 'United Kingdom', NULL, 0),

-- States/Provinces (level 1)
('550e8400-e29b-41d4-a716-446655440011', 'Istanbul', '550e8400-e29b-41d4-a716-446655440001', 1),
('550e8400-e29b-41d4-a716-446655440012', 'Ankara', '550e8400-e29b-41d4-a716-446655440001', 1),
('550e8400-e29b-41d4-a716-446655440013', 'Izmir', '550e8400-e29b-41d4-a716-446655440001', 1),
('550e8400-e29b-41d4-a716-446655440021', 'California', '550e8400-e29b-41d4-a716-446655440002', 1),
('550e8400-e29b-41d4-a716-446655440022', 'New York', '550e8400-e29b-41d4-a716-446655440002', 1),
('550e8400-e29b-41d4-a716-446655440023', 'Texas', '550e8400-e29b-41d4-a716-446655440002', 1),
('550e8400-e29b-41d4-a716-446655440031', 'England', '550e8400-e29b-41d4-a716-446655440003', 1),
('550e8400-e29b-41d4-a716-446655440032', 'Scotland', '550e8400-e29b-41d4-a716-446655440003', 1),

-- Cities (level 2)
('550e8400-e29b-41d4-a716-446655440111', 'Kadikoy', '550e8400-e29b-41d4-a716-446655440011', 2),
('550e8400-e29b-41d4-a716-446655440112', 'Besiktas', '550e8400-e29b-41d4-a716-446655440011', 2),
('550e8400-e29b-41d4-a716-446655440113', 'Sisli', '550e8400-e29b-41d4-a716-446655440011', 2),
('550e8400-e29b-41d4-a716-446655440121', 'Cankaya', '550e8400-e29b-41d4-a716-446655440012', 2),
('550e8400-e29b-41d4-a716-446655440122', 'Kecioren', '550e8400-e29b-41d4-a716-446655440012', 2),
('550e8400-e29b-41d4-a716-446655440131', 'Konak', '550e8400-e29b-41d4-a716-446655440013', 2),
('550e8400-e29b-41d4-a716-446655440132', 'Bornova', '550e8400-e29b-41d4-a716-446655440013', 2),
('550e8400-e29b-41d4-a716-446655440211', 'Los Angeles', '550e8400-e29b-41d4-a716-446655440021', 2),
('550e8400-e29b-41d4-a716-446655440212', 'San Francisco', '550e8400-e29b-41d4-a716-446655440021', 2),
('550e8400-e29b-41d4-a716-446655440221', 'New York City', '550e8400-e29b-41d4-a716-446655440022', 2),
('550e8400-e29b-41d4-a716-446655440222', 'Buffalo', '550e8400-e29b-41d4-a716-446655440022', 2),
('550e8400-e29b-41d4-a716-446655440231', 'Houston', '550e8400-e29b-41d4-a716-446655440023', 2),
('550e8400-e29b-41d4-a716-446655440232', 'Dallas', '550e8400-e29b-41d4-a716-446655440023', 2),
('550e8400-e29b-41d4-a716-446655440311', 'London', '550e8400-e29b-41d4-a716-446655440031', 2),
('550e8400-e29b-41d4-a716-446655440312', 'Manchester', '550e8400-e29b-41d4-a716-446655440031', 2),
('550e8400-e29b-41d4-a716-446655440321', 'Edinburgh', '550e8400-e29b-41d4-a716-446655440032', 2),
('550e8400-e29b-41d4-a716-446655440322', 'Glasgow', '550e8400-e29b-41d4-a716-446655440032', 2),

-- Districts/Neighborhoods (level 3)
('550e8400-e29b-41d4-a716-4466554401111', 'Moda', '550e8400-e29b-41d4-a716-446655440111', 3),
('550e8400-e29b-41d4-a716-4466554401112', 'Fenerbahce', '550e8400-e29b-41d4-a716-446655440111', 3),
('550e8400-e29b-41d4-a716-4466554401113', 'Bostanci', '550e8400-e29b-41d4-a716-446655440111', 3),
('550e8400-e29b-41d4-a716-4466554401121', 'Ortakoy', '550e8400-e29b-41d4-a716-446655440112', 3),
('550e8400-e29b-41d4-a716-4466554401122', 'Etiler', '550e8400-e29b-41d4-a716-446655440112', 3),
('550e8400-e29b-41d4-a716-4466554401131', 'Nisantasi', '550e8400-e29b-41d4-a716-446655440113', 3),
('550e8400-e29b-41d4-a716-4466554401132', 'Mecidiyekoy', '550e8400-e29b-41d4-a716-446655440113', 3),
('550e8400-e29b-41d4-a716-4466554401211', 'Kizilay', '550e8400-e29b-41d4-a716-446655440121', 3),
('550e8400-e29b-41d4-a716-4466554401212', 'Tunali Hilmi', '550e8400-e29b-41d4-a716-446655440121', 3),
('550e8400-e29b-41d4-a716-4466554401311', 'Alsancak', '550e8400-e29b-41d4-a716-446655440131', 3),
('550e8400-e29b-41d4-a716-4466554401312', 'Konak Pier', '550e8400-e29b-41d4-a716-446655440131', 3),
('550e8400-e29b-41d4-a716-4466554402111', 'Hollywood', '550e8400-e29b-41d4-a716-446655440211', 3),
('550e8400-e29b-41d4-a716-4466554402112', 'Beverly Hills', '550e8400-e29b-41d4-a716-446655440211', 3),
('550e8400-e29b-41d4-a716-4466554402211', 'Manhattan', '550e8400-e29b-41d4-a716-446655440221', 3),
('550e8400-e29b-41d4-a716-4466554402212', 'Brooklyn', '550e8400-e29b-41d4-a716-446655440221', 3),
('550e8400-e29b-41d4-a716-4466554403111', 'Westminster', '550e8400-e29b-41d4-a716-446655440311', 3),
('550e8400-e29b-41d4-a716-4466554403112', 'Camden', '550e8400-e29b-41d4-a716-446655440311', 3);

-- Create a function to get location hierarchy
CREATE OR REPLACE FUNCTION get_location_hierarchy(location_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  level INTEGER,
  full_path TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE location_path AS (
    -- Base case: start with the given location
    SELECT 
      l.id,
      l.name,
      l.level,
      l.name::TEXT as full_path
    FROM locations l
    WHERE l.id = location_id
    
    UNION ALL
    
    -- Recursive case: get parent locations
    SELECT 
      l.id,
      l.name,
      l.level,
      l.name || ' > ' || lp.full_path as full_path
    FROM locations l
    JOIN location_path lp ON l.id = lp.parent_id
  )
  SELECT 
    lp.id,
    lp.name,
    lp.level,
    lp.full_path
  FROM location_path lp
  ORDER BY lp.level ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all children of a location
CREATE OR REPLACE FUNCTION get_location_children(parent_location_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  level INTEGER,
  parent_id UUID
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE children AS (
    -- Base case: direct children
    SELECT 
      l.id,
      l.name,
      l.level,
      l.parent_id
    FROM locations l
    WHERE l.parent_id = parent_location_id
    
    UNION ALL
    
    -- Recursive case: children of children
    SELECT 
      l.id,
      l.name,
      l.level,
      l.parent_id
    FROM locations l
    JOIN children c ON l.parent_id = c.id
  )
  SELECT 
    c.id,
    c.name,
    c.level,
    c.parent_id
  FROM children c
  ORDER BY c.level ASC, c.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_location_hierarchy TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_children TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE locations IS 'Hierarchical locations table for countries, states, cities, districts, etc.';
COMMENT ON COLUMN locations.level IS 'Hierarchy level: 0=country, 1=state/province, 2=city, 3=district, etc.';
COMMENT ON COLUMN locations.parent_id IS 'Reference to parent location in the hierarchy';

