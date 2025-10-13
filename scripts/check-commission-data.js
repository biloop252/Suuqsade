// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCommissionData() {
  console.log('=== Checking Commission Data ===\n');
  
  try {
    // Check if there are any orders
    console.log('1. Checking recent orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }
    
    console.log('Recent orders:', orders?.length || 0, 'found');
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        console.log(`  - Order ${order.order_number}: ${order.status}, $${order.total_amount}`);
      });
    }
    console.log();

    // Check if there are any order items with vendor products
    console.log('2. Checking order items with vendor products...');
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, total_price, products(vendor_id)')
      .limit(10);
    
    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      return;
    }
    
    console.log('Order items:', orderItems?.length || 0, 'found');
    if (orderItems && orderItems.length > 0) {
      orderItems.forEach(item => {
        console.log(`  - Item ${item.id}: $${item.total_price}, Vendor: ${item.products?.vendor_id || 'None'}`);
      });
    }
    console.log();

    // Check vendor profiles
    console.log('3. Checking vendor profiles...');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, commission_rate, status')
      .limit(5);
    
    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError);
      return;
    }
    
    console.log('Vendor profiles:', vendors?.length || 0, 'found');
    if (vendors && vendors.length > 0) {
      vendors.forEach(vendor => {
        console.log(`  - ${vendor.business_name || 'Unnamed'}: ${vendor.commission_rate}% commission, Status: ${vendor.status}`);
      });
    }
    console.log();

    // Check existing commission records
    console.log('4. Checking existing commission records...');
    const { data: commissions, error: commissionsError } = await supabase
      .from('vendor_commissions')
      .select('*')
      .limit(5);
    
    if (commissionsError) {
      console.error('Error fetching commissions:', commissionsError);
      return;
    }
    
    console.log('Commission records:', commissions?.length || 0, 'found');
    if (commissions && commissions.length > 0) {
      commissions.forEach(commission => {
        console.log(`  - Order ${commission.order_id}: $${commission.order_amount} -> Admin: $${commission.admin_amount}, Vendor: $${commission.commission_amount}`);
      });
    }
    console.log();

    // Check admin revenues
    console.log('5. Checking admin revenues...');
    const { data: adminRevenues, error: adminRevenuesError } = await supabase
      .from('admin_revenues')
      .select('*')
      .limit(5);
    
    if (adminRevenuesError) {
      console.error('Error fetching admin revenues:', adminRevenuesError);
      return;
    }
    
    console.log('Admin revenue records:', adminRevenues?.length || 0, 'found');
    if (adminRevenues && adminRevenues.length > 0) {
      adminRevenues.forEach(revenue => {
        console.log(`  - ${revenue.revenue_type}: $${revenue.amount} (${revenue.description})`);
      });
    }
    console.log();

    // Test the commission revenue function
    console.log('6. Testing commission revenue function...');
    const { data: commissionRevenue, error: commissionRevenueError } = await supabase.rpc('get_vendor_commission_revenue_breakdown', {
      vendor_uuid: null,
      start_date: null,
      end_date: null
    });
    
    if (commissionRevenueError) {
      console.error('Error calling commission revenue function:', commissionRevenueError);
      return;
    }
    
    console.log('Commission revenue data:', commissionRevenue?.length || 0, 'vendors found');
    if (commissionRevenue && commissionRevenue.length > 0) {
      commissionRevenue.forEach(vendor => {
        console.log(`  - ${vendor.business_name || 'Unnamed'}: $${vendor.total_commission_revenue} commission revenue from $${vendor.total_sales} sales`);
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkCommissionData().catch(console.error);
