-- Migration to add only neighborhood_id column to addresses table
-- Other location ID columns already exist

-- Add neighborhood_id column to addresses table
ALTER TABLE addresses 
ADD COLUMN neighborhood_id UUID REFERENCES locations(id);

-- Create index for the new foreign key column
CREATE INDEX idx_addresses_neighborhood_id ON addresses(neighborhood_id);

-- Add comment for documentation
COMMENT ON COLUMN addresses.neighborhood_id IS 'Reference to neighborhood in locations table';



