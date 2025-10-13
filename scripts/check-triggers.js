// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTriggers() {
  console.log('=== Checking Database Triggers ===\n');
  
  try {
    // Check triggers on orders table
    console.log('1. Checking triggers on orders table...');
    const { data: orderTriggers, error: orderTriggersError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            trigger_name,
            event_manipulation,
            action_timing,
            action_statement
          FROM information_schema.triggers 
          WHERE event_object_table = 'orders'
          ORDER BY trigger_name;
        `
      });
    
    if (orderTriggersError) {
      console.error('Error fetching order triggers:', orderTriggersError);
    } else {
      console.log(`Found ${orderTriggers?.length || 0} triggers on orders table:`);
      orderTriggers?.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
        console.log(`    Function: ${trigger.action_statement}`);
      });
    }
    console.log();

    // Check if the commission calculation function exists
    console.log('2. Checking commission calculation function...');
    const { data: functions, error: functionsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            routine_name,
            routine_type,
            data_type
          FROM information_schema.routines 
          WHERE routine_name = 'calculate_order_commissions'
          AND routine_schema = 'public';
        `
      });
    
    if (functionsError) {
      console.error('Error fetching functions:', functionsError);
    } else {
      console.log(`Found ${functions?.length || 0} commission calculation functions:`);
      functions?.forEach(func => {
        console.log(`  - ${func.routine_name}: ${func.routine_type} returns ${func.data_type}`);
      });
    }
    console.log();

    // Check if vendor_profiles table exists and has data
    console.log('3. Checking vendor_profiles table...');
    const { data: vendorProfiles, error: vendorProfilesError } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, commission_rate, status')
      .limit(5);
    
    if (vendorProfilesError) {
      console.error('Error fetching vendor profiles:', vendorProfilesError);
    } else {
      console.log(`Found ${vendorProfiles?.length || 0} vendor profiles:`);
      vendorProfiles?.forEach(vendor => {
        console.log(`  - ${vendor.business_name}: ${vendor.commission_rate}% commission, Status: ${vendor.status}`);
      });
    }
    console.log();

    // Check if products have vendor assignments
    console.log('4. Checking products with vendor assignments...');
    const { data: productsWithVendors, error: productsWithVendorsError } = await supabase
      .from('products')
      .select('id, name, vendor_id')
      .not('vendor_id', 'is', null)
      .limit(5);
    
    if (productsWithVendorsError) {
      console.error('Error fetching products with vendors:', productsWithVendorsError);
    } else {
      console.log(`Found ${productsWithVendors?.length || 0} products with vendor assignments:`);
      productsWithVendors?.forEach(product => {
        console.log(`  - ${product.name}: Vendor ID ${product.vendor_id}`);
      });
    }
    console.log();

    // Check recent orders
    console.log('5. Checking recent orders...');
    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentOrdersError) {
      console.error('Error fetching recent orders:', recentOrdersError);
    } else {
      console.log(`Found ${recentOrders?.length || 0} recent orders:`);
      recentOrders?.forEach(order => {
        console.log(`  - ${order.order_number}: ${order.status}, $${order.total_amount}`);
      });
    }
    console.log();

    // Check existing commission records
    console.log('6. Checking existing commission records...');
    const { data: commissions, error: commissionsError } = await supabase
      .from('vendor_commissions')
      .select('*')
      .limit(5);
    
    if (commissionsError) {
      console.error('Error fetching commissions:', commissionsError);
    } else {
      console.log(`Found ${commissions?.length || 0} commission records:`);
      commissions?.forEach(commission => {
        console.log(`  - Order ${commission.order_id}: $${commission.admin_amount} admin, $${commission.commission_amount} vendor`);
      });
    }
    console.log();

    console.log('=== Summary ===');
    console.log('If you see $0.00 commission revenue, it could be because:');
    console.log('1. No products are assigned to vendors');
    console.log('2. No orders contain vendor products');
    console.log('3. Orders are not marked as "delivered"');
    console.log('4. Commission calculation trigger is not working');
    console.log('5. Commission calculation function has errors');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkTriggers().catch(console.error);





