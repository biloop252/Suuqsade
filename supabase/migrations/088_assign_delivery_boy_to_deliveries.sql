-- Add delivery boy assignment to deliveries (shipments)
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS assigned_delivery_boy_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_deliveries_assigned_delivery_boy_id
  ON deliveries(assigned_delivery_boy_id);

