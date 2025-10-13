// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCommissionSystem() {
  console.log('=== Testing Commission System ===\n');
  
  try {
    // 1. Check if vendor_profiles exist
    console.log('1. Checking vendor profiles...');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, commission_rate, status')
      .limit(5);
    
    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError);
      return;
    }
    
    console.log(`Found ${vendors?.length || 0} vendor profiles:`);
    vendors?.forEach(vendor => {
      console.log(`  - ${vendor.business_name}: ${vendor.commission_rate}% commission, Status: ${vendor.status}`);
    });
    console.log();

    // 2. Check if there are products assigned to vendors
    console.log('2. Checking products with vendor assignments...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, vendor_id, price')
      .not('vendor_id', 'is', null)
      .limit(10);
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }
    
    console.log(`Found ${products?.length || 0} products with vendor assignments:`);
    products?.forEach(product => {
      console.log(`  - ${product.name}: $${product.price}, Vendor: ${product.vendor_id}`);
    });
    console.log();

    // 3. Check if there are any orders
    console.log('3. Checking recent orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }
    
    console.log(`Found ${orders?.length || 0} recent orders:`);
    orders?.forEach(order => {
      console.log(`  - Order ${order.order_number}: ${order.status}, $${order.total_amount}`);
    });
    console.log();

    // 4. Check if there are any commission records
    console.log('4. Checking commission records...');
    const { data: commissions, error: commissionsError } = await supabase
      .from('vendor_commissions')
      .select('*')
      .limit(5);
    
    if (commissionsError) {
      console.error('Error fetching commissions:', commissionsError);
      return;
    }
    
    console.log(`Found ${commissions?.length || 0} commission records:`);
    commissions?.forEach(commission => {
      console.log(`  - Order ${commission.order_id}: $${commission.order_amount} -> Admin: $${commission.admin_amount}, Vendor: $${commission.commission_amount}`);
    });
    console.log();

    // 5. Test the commission revenue function
    console.log('5. Testing commission revenue function...');
    const { data: commissionRevenue, error: commissionRevenueError } = await supabase.rpc('get_vendor_commission_revenue_breakdown', {
      vendor_uuid: null,
      start_date: null,
      end_date: null
    });
    
    if (commissionRevenueError) {
      console.error('Error calling commission revenue function:', commissionRevenueError);
      return;
    }
    
    console.log(`Commission revenue data: ${commissionRevenue?.length || 0} vendors found`);
    if (commissionRevenue && commissionRevenue.length > 0) {
      commissionRevenue.forEach(vendor => {
        console.log(`  - ${vendor.business_name || 'Unnamed'}: $${vendor.total_commission_revenue} commission revenue from $${vendor.total_sales} sales`);
      });
    } else {
      console.log('  No commission revenue data found - this explains why you see $0.00');
    }
    console.log();

    // 6. If no data exists, offer to create test data
    if ((!products || products.length === 0) && vendors && vendors.length > 0) {
      console.log('6. No products assigned to vendors found. Would you like to create test data?');
      console.log('   This would:');
      console.log('   - Assign some existing products to vendors');
      console.log('   - Create a test order with vendor products');
      console.log('   - Trigger commission calculation');
      console.log();
      
      // For now, just show what we would do
      console.log('To create test data, you would need to:');
      console.log('1. Update some products to have vendor_id');
      console.log('2. Create an order with those products');
      console.log('3. Mark the order as delivered to trigger commission calculation');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testCommissionSystem().catch(console.error);



