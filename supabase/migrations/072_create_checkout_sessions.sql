-- Create checkout_sessions to support pay-before-order flows (e.g., Sifalo Pay)
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  amount DECIMAL(10,2) NOT NULL,
  shipping_address_id UUID REFERENCES addresses(id),
  billing_address_id UUID REFERENCES addresses(id),
  notes TEXT,
  items JSONB NOT NULL,
  pricing JSONB,
  status TEXT DEFAULT 'created',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_expires_at ON checkout_sessions(expires_at);

ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Users can create their own sessions
CREATE POLICY "Users can create their own checkout sessions" ON checkout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own sessions
CREATE POLICY "Users can view their own checkout sessions" ON checkout_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own sessions (e.g., cancel)
CREATE POLICY "Users can update their own checkout sessions" ON checkout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- updated_at trigger (reuse existing function)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_checkout_sessions_updated_at') THEN
      CREATE TRIGGER update_checkout_sessions_updated_at
        BEFORE UPDATE ON checkout_sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END $$;

