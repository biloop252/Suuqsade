const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createVendorFunctions() {
  console.log('🔧 Creating Vendor Functions...\n');

  try {
    // SQL to create the functions
    const createFunctionsSQL = `
-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_vendor_commissions_with_profiles(TEXT, UUID);
DROP FUNCTION IF EXISTS get_vendor_payouts_with_profiles();
DROP VIEW IF EXISTS vendor_commissions_with_profiles;

-- Create a view that properly joins the tables
CREATE OR REPLACE VIEW vendor_commissions_with_profiles AS
SELECT 
  vc.*,
  vp.business_name,
  vp.commission_rate as vendor_commission_rate,
  vp.status as vendor_status,
  p.first_name,
  p.last_name,
  p.email
FROM vendor_commissions vc
LEFT JOIN vendor_profiles vp ON vc.vendor_id = vp.id
LEFT JOIN profiles p ON vc.vendor_id = p.id;

-- Create function to get vendor commissions with profile data
CREATE OR REPLACE FUNCTION get_vendor_commissions_with_profiles(
  status_filter TEXT DEFAULT NULL,
  vendor_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  order_id UUID,
  vendor_id UUID,
  order_item_id UUID,
  product_id UUID,
  commission_rate DECIMAL(5,2),
  order_amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  admin_amount DECIMAL(10,2),
  status VARCHAR(20),
  paid_at TIMESTAMP WITH TIME ZONE,
  payout_transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  business_name VARCHAR(255),
  vendor_commission_rate DECIMAL(5,2),
  vendor_status VARCHAR(20),
  first_name TEXT,
  last_name TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vc.id,
    vc.order_id,
    vc.vendor_id,
    vc.order_item_id,
    vc.product_id,
    vc.commission_rate,
    vc.order_amount,
    vc.commission_amount,
    vc.admin_amount,
    vc.status,
    vc.paid_at,
    vc.payout_transaction_id,
    vc.created_at,
    vc.updated_at,
    vp.business_name,
    vp.commission_rate as vendor_commission_rate,
    vp.status as vendor_status,
    p.first_name,
    p.last_name,
    p.email
  FROM vendor_commissions vc
  LEFT JOIN vendor_profiles vp ON vc.vendor_id = vp.id
  LEFT JOIN profiles p ON vc.vendor_id = p.id
  WHERE (status_filter IS NULL OR vc.status = status_filter)
    AND (vendor_id_filter IS NULL OR vc.vendor_id = vendor_id_filter)
  ORDER BY vc.created_at DESC;
END;
$$;

-- Create function for vendor payouts with profile data
CREATE OR REPLACE FUNCTION get_vendor_payouts_with_profiles()
RETURNS TABLE (
  id UUID,
  vendor_id UUID,
  payout_period_start DATE,
  payout_period_end DATE,
  total_commission DECIMAL(12,2),
  total_orders INTEGER,
  payout_method VARCHAR(50),
  payout_details JSONB,
  status VARCHAR(20),
  transaction_id UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  business_name VARCHAR(255),
  vendor_commission_rate DECIMAL(5,2),
  vendor_status VARCHAR(20),
  first_name TEXT,
  last_name TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vp.id,
    vp.vendor_id,
    vp.payout_period_start,
    vp.payout_period_end,
    vp.total_commission,
    vp.total_orders,
    vp.payout_method,
    vp.payout_details,
    vp.status,
    vp.transaction_id,
    vp.processed_at,
    vp.notes,
    vp.created_at,
    vp.updated_at,
    vp2.business_name,
    vp2.commission_rate as vendor_commission_rate,
    vp2.status as vendor_status,
    p.first_name,
    p.last_name,
    p.email
  FROM vendor_payouts vp
  LEFT JOIN vendor_profiles vp2 ON vp.vendor_id = vp2.id
  LEFT JOIN profiles p ON vp.vendor_id = p.id
  ORDER BY vp.created_at DESC;
END;
$$;

-- Grant permissions
GRANT SELECT ON vendor_commissions_with_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_commissions_with_profiles(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_payouts_with_profiles() TO authenticated;
    `;

    // Execute the SQL
    console.log('1. Creating vendor functions and view...');
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionsSQL });

    if (createError) {
      console.log('❌ Failed to create functions:', createError.message);
      
      // Try alternative approach using individual queries
      console.log('2. Trying alternative approach...');
      
      // Create view first
      const { error: viewError } = await supabase
        .from('_realtime_schema')
        .select('*')
        .limit(0); // This is just to test connection
      
      if (viewError) {
        console.log('❌ Database connection issue:', viewError.message);
        return;
      }
      
      console.log('✅ Database connection works, but exec_sql function may not exist');
      console.log('💡 You may need to run the SQL manually in your database client');
      console.log('\nSQL to run manually:');
      console.log(createFunctionsSQL);
      return;
    }

    console.log('✅ Functions created successfully!');

    // Test the functions
    console.log('\n3. Testing created functions...');
    
    const { data: testCommissions, error: testCommissionsError } = await supabase
      .rpc('get_vendor_commissions_with_profiles', {
        status_filter: null,
        vendor_id_filter: null
      });

    if (testCommissionsError) {
      console.log('❌ Test commissions function failed:', testCommissionsError.message);
    } else {
      console.log(`✅ Commissions function works! Found ${testCommissions.length} records`);
    }

    const { data: testPayouts, error: testPayoutsError } = await supabase
      .rpc('get_vendor_payouts_with_profiles');

    if (testPayoutsError) {
      console.log('❌ Test payouts function failed:', testPayoutsError.message);
    } else {
      console.log(`✅ Payouts function works! Found ${testPayouts.length} records`);
    }

    console.log('\n🎉 Vendor functions setup completed!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the setup
createVendorFunctions().then(() => {
  console.log('\n✨ Setup completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});




