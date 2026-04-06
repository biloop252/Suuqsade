-- Unified in-app notifications for customers and admins (orders, payments, system, etc.)

CREATE TABLE app_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('customer', 'admin')),
  category TEXT NOT NULL,
  event_key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('success', 'info', 'warning', 'danger')),
  priority TEXT CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high', 'urgent')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  channels JSONB NOT NULL DEFAULT '["in_app"]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_notifications_recipient ON app_notifications(recipient_id);
CREATE INDEX idx_app_notifications_audience ON app_notifications(audience);
CREATE INDEX idx_app_notifications_created_at ON app_notifications(created_at DESC);
CREATE INDEX idx_app_notifications_is_read ON app_notifications(recipient_id, is_read);
CREATE INDEX idx_app_notifications_category ON app_notifications(recipient_id, category);

ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own app notifications"
  ON app_notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own app notifications"
  ON app_notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete own app notifications"
  ON app_notifications FOR DELETE
  USING (auth.uid() = recipient_id);

-- Inserts are performed with the service role from server-side code (RLS bypass).

COMMENT ON TABLE app_notifications IS 'Customer and admin notifications; use service role to insert.';

-- Enable Realtime for this table: Supabase Dashboard → Database → Replication → add `app_notifications`,
-- or run once: ALTER PUBLICATION supabase_realtime ADD TABLE public.app_notifications;
