-- Customer Support System Migration
-- Creates comprehensive support ticket system with categories, priorities, and status tracking

-- Create support ticket status enum
CREATE TYPE support_ticket_status AS ENUM (
  'open',
  'in_progress', 
  'waiting_customer',
  'waiting_staff',
  'resolved',
  'closed'
);

-- Create support ticket priority enum
CREATE TYPE support_ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Create support ticket category enum
CREATE TYPE support_ticket_category AS ENUM (
  'general_inquiry',
  'order_issue',
  'product_question',
  'shipping_delivery',
  'payment_billing',
  'return_refund',
  'technical_support',
  'account_issue',
  'complaint',
  'feature_request'
);

-- Support ticket categories table (for better management)
CREATE TABLE support_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default support categories
INSERT INTO support_categories (name, slug, description, sort_order) VALUES
('General Inquiry', 'general_inquiry', 'General questions and inquiries', 1),
('Order Issues', 'order_issue', 'Problems with orders, tracking, or fulfillment', 2),
('Product Questions', 'product_question', 'Questions about products, specifications, or availability', 3),
('Shipping & Delivery', 'shipping_delivery', 'Delivery issues, shipping questions, or tracking problems', 4),
('Payment & Billing', 'payment_billing', 'Payment issues, billing questions, or refund requests', 5),
('Returns & Refunds', 'return_refund', 'Return requests, refund processing, or exchange issues', 6),
('Technical Support', 'technical_support', 'Website issues, technical problems, or bug reports', 7),
('Account Issues', 'account_issue', 'Login problems, account settings, or profile issues', 8),
('Complaints', 'complaint', 'Service complaints or negative feedback', 9),
('Feature Requests', 'feature_request', 'Suggestions for new features or improvements', 10);

-- Support tickets table
CREATE TABLE support_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category_id UUID REFERENCES support_categories(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status support_ticket_status DEFAULT 'open',
  priority support_ticket_priority DEFAULT 'medium',
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  is_urgent BOOLEAN DEFAULT false,
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support ticket messages/threads table
CREATE TABLE support_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes not visible to customer
  attachments JSONB DEFAULT '[]', -- Array of attachment URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support ticket attachments table
CREATE TABLE support_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES support_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support ticket tags table (for better organization)
CREATE TABLE support_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support ticket tag assignments
CREATE TABLE support_ticket_tags (
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES support_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, tag_id)
);

-- Insert default support tags
INSERT INTO support_tags (name, color, description) VALUES
('bug', '#EF4444', 'Technical bugs or issues'),
('feature', '#10B981', 'Feature requests or suggestions'),
('urgent', '#F59E0B', 'Urgent issues requiring immediate attention'),
('follow-up', '#8B5CF6', 'Issues requiring follow-up'),
('resolved', '#6B7280', 'Issues that have been resolved'),
('escalated', '#DC2626', 'Issues escalated to management');

-- Support ticket SLA (Service Level Agreement) tracking
CREATE TABLE support_sla_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sla_type TEXT NOT NULL, -- 'first_response', 'resolution'
  target_time INTERVAL NOT NULL,
  actual_time INTERVAL,
  is_breached BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support notifications table
CREATE TABLE support_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'ticket_update', 'new_message', 'status_change', 'assignment'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  ticket_number TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category_id ON support_tickets(category_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX idx_support_tickets_ticket_number ON support_tickets(ticket_number);
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at);
CREATE INDEX idx_support_attachments_ticket_id ON support_attachments(ticket_id);
CREATE INDEX idx_support_attachments_message_id ON support_attachments(message_id);
CREATE INDEX idx_support_notifications_user_id ON support_notifications(user_id);
CREATE INDEX idx_support_notifications_ticket_id ON support_notifications(ticket_id);
CREATE INDEX idx_support_notifications_is_read ON support_notifications(is_read);
CREATE INDEX idx_support_notifications_created_at ON support_notifications(created_at);

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  ticket_num TEXT;
  counter INTEGER;
BEGIN
  -- Get the current counter value
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 3) AS INTEGER)), 0) + 1
  INTO counter
  FROM support_tickets
  WHERE ticket_number ~ '^ST[0-9]+$';
  
  -- Format as ST + 6-digit number
  ticket_num := 'ST' || LPAD(counter::TEXT, 6, '0');
  
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Function to update ticket status timestamps
CREATE OR REPLACE FUNCTION update_ticket_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update resolved_at when status changes to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at := NOW();
  END IF;
  
  -- Update closed_at when status changes to closed
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at := NOW();
  END IF;
  
  -- Always update the updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_timestamps
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamps();

-- Function to get ticket statistics
CREATE OR REPLACE FUNCTION get_support_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  assigned_to UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_tickets', COUNT(*),
    'open_tickets', COUNT(*) FILTER (WHERE status = 'open'),
    'in_progress_tickets', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'resolved_tickets', COUNT(*) FILTER (WHERE status = 'resolved'),
    'closed_tickets', COUNT(*) FILTER (WHERE status = 'closed'),
    'urgent_tickets', COUNT(*) FILTER (WHERE is_urgent = true),
    'avg_resolution_time', AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE resolved_at IS NOT NULL),
    'customer_satisfaction', AVG(customer_satisfaction) FILTER (WHERE customer_satisfaction IS NOT NULL)
  ) INTO stats
  FROM support_tickets
  WHERE 
    (start_date IS NULL OR created_at >= start_date) AND
    (end_date IS NULL OR created_at <= end_date) AND
    (assigned_to IS NULL OR assigned_to = assigned_to);
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on support tables
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_sla_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_categories (public read)
CREATE POLICY "Support categories are viewable by everyone" ON support_categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage support categories" ON support_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tickets" ON support_tickets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Staff can view all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Staff can update all tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages in their tickets" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their tickets" ON support_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Staff can create messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- RLS Policies for support_attachments
CREATE POLICY "Users can view attachments in their tickets" ON support_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_attachments.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload attachments to their tickets" ON support_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_attachments.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage all attachments" ON support_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- RLS Policies for support_tags
CREATE POLICY "Support tags are viewable by everyone" ON support_tags
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage support tags" ON support_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for support_ticket_tags
CREATE POLICY "Users can view tags on their tickets" ON support_ticket_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_ticket_tags.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage ticket tags" ON support_ticket_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- RLS Policies for support_sla_logs
CREATE POLICY "Staff can view SLA logs" ON support_sla_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- RLS Policies for support_notifications
CREATE POLICY "Users can view their own notifications" ON support_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON support_notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON support_notifications
  FOR INSERT WITH CHECK (true);

-- Add support management permission to staff permissions
INSERT INTO staff_permissions (name, description) VALUES
('manage_support', 'Can manage customer support tickets and messages')
ON CONFLICT (name) DO NOTHING;

-- Grant support management permission to admin and super_admin roles
INSERT INTO staff_role_permissions (role, permission_id) 
SELECT 'admin', id FROM staff_permissions WHERE name = 'manage_support';

INSERT INTO staff_role_permissions (role, permission_id) 
SELECT 'super_admin', id FROM staff_permissions WHERE name = 'manage_support';

-- Add comments for documentation
COMMENT ON TABLE support_tickets IS 'Customer support tickets with status tracking and assignment';
COMMENT ON TABLE support_messages IS 'Messages/threads within support tickets';
COMMENT ON TABLE support_attachments IS 'File attachments for support tickets and messages';
COMMENT ON TABLE support_categories IS 'Predefined categories for support tickets';
COMMENT ON TABLE support_tags IS 'Tags for organizing and filtering support tickets';
COMMENT ON TABLE support_sla_logs IS 'Service Level Agreement tracking for support tickets';
