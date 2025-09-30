-- Migration to add location ID fields to addresses table
-- This allows addresses to reference the locations table while maintaining backward compatibility

-- Add location ID columns to addresses table
ALTER TABLE addresses 
ADD COLUMN country_id UUID REFERENCES locations(id),
ADD COLUMN state_id UUID REFERENCES locations(id),
ADD COLUMN city_id UUID REFERENCES locations(id),
ADD COLUMN district_id UUID REFERENCES locations(id),
ADD COLUMN neighborhood_id UUID REFERENCES locations(id);

-- Create indexes for the new foreign key columns
CREATE INDEX idx_addresses_country_id ON addresses(country_id);
CREATE INDEX idx_addresses_state_id ON addresses(state_id);
CREATE INDEX idx_addresses_city_id ON addresses(city_id);
CREATE INDEX idx_addresses_district_id ON addresses(district_id);
CREATE INDEX idx_addresses_neighborhood_id ON addresses(neighborhood_id);

-- Add comments for documentation
COMMENT ON COLUMN addresses.country_id IS 'Reference to country in locations table';
COMMENT ON COLUMN addresses.state_id IS 'Reference to state/province in locations table';
COMMENT ON COLUMN addresses.city_id IS 'Reference to city in locations table';
COMMENT ON COLUMN addresses.district_id IS 'Reference to district in locations table';
COMMENT ON COLUMN addresses.neighborhood_id IS 'Reference to neighborhood in locations table';
