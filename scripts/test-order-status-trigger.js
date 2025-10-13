// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOrderStatusTrigger() {
  console.log('=== Testing Order Status Trigger ===\n');
  
  try {
    // 1. Check if there are any orders
    console.log('1. Checking existing orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }
    
    console.log(`Found ${orders?.length || 0} orders:`);
    orders?.forEach(order => {
      console.log(`  - Order ${order.order_number}: ${order.status}, $${order.total_amount}`);
    });
    console.log();

    if (!orders || orders.length === 0) {
      console.log('No orders found. Please create an order first.');
      return;
    }

    // 2. Check if there are any order items with vendor products
    console.log('2. Checking order items with vendor products...');
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, total_price, products(vendor_id)')
      .in('order_id', orders.map(o => o.id))
      .limit(10);
    
    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      return;
    }
    
    console.log(`Found ${orderItems?.length || 0} order items:`);
    const vendorOrderItems = orderItems?.filter(item => item.products?.vendor_id) || [];
    console.log(`  - ${vendorOrderItems.length} items have vendor products`);
    
    vendorOrderItems.forEach(item => {
      console.log(`    - Order ${item.order_id}: $${item.total_price}, Vendor: ${item.products.vendor_id}`);
    });
    console.log();

    if (vendorOrderItems.length === 0) {
      console.log('No order items with vendor products found.');
      console.log('This is why commission calculation is not working.');
      console.log('You need to:');
      console.log('1. Assign products to vendors (update products.vendor_id)');
      console.log('2. Create orders with those products');
      return;
    }

    // 3. Find an order with vendor products that's not delivered
    const orderWithVendorProducts = orders.find(order => 
      vendorOrderItems.some(item => item.order_id === order.id) && 
      order.status !== 'delivered'
    );

    if (!orderWithVendorProducts) {
      console.log('No orders with vendor products found that are not delivered.');
      console.log('All orders with vendor products are already delivered.');
      return;
    }

    console.log(`3. Testing order status change for order: ${orderWithVendorProducts.order_number}`);
    console.log(`   Current status: ${orderWithVendorProducts.status}`);
    console.log();

    // 4. Check existing commission records for this order
    console.log('4. Checking existing commission records...');
    const { data: existingCommissions, error: existingCommissionsError } = await supabase
      .from('vendor_commissions')
      .select('*')
      .eq('order_id', orderWithVendorProducts.id);
    
    if (existingCommissionsError) {
      console.error('Error fetching existing commissions:', existingCommissionsError);
      return;
    }
    
    console.log(`Existing commission records: ${existingCommissions?.length || 0}`);
    if (existingCommissions && existingCommissions.length > 0) {
      existingCommissions.forEach(commission => {
        console.log(`  - Admin: $${commission.admin_amount}, Vendor: $${commission.commission_amount}`);
      });
    }
    console.log();

    // 5. Update order status to delivered
    console.log('5. Updating order status to delivered...');
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderWithVendorProducts.id);
    
    if (updateError) {
      console.error('Error updating order status:', updateError);
      return;
    }
    
    console.log('Order status updated to delivered!');
    console.log();

    // 6. Wait a moment for triggers to execute
    console.log('6. Waiting for triggers to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log();

    // 7. Check if commission records were created
    console.log('7. Checking if commission records were created...');
    const { data: newCommissions, error: newCommissionsError } = await supabase
      .from('vendor_commissions')
      .select('*')
      .eq('order_id', orderWithVendorProducts.id);
    
    if (newCommissionsError) {
      console.error('Error fetching new commissions:', newCommissionsError);
      return;
    }
    
    console.log(`Commission records after status change: ${newCommissions?.length || 0}`);
    if (newCommissions && newCommissions.length > 0) {
      newCommissions.forEach(commission => {
        console.log(`  - Admin: $${commission.admin_amount}, Vendor: $${commission.commission_amount} (${commission.commission_rate}%)`);
      });
    } else {
      console.log('❌ No commission records were created!');
      console.log('This indicates the trigger is not working properly.');
    }
    console.log();

    // 8. Check admin revenues
    console.log('8. Checking admin revenues...');
    const { data: adminRevenues, error: adminRevenuesError } = await supabase
      .from('admin_revenues')
      .select('*')
      .eq('source_id', vendorOrderItems[0]?.products?.vendor_id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (adminRevenuesError) {
      console.error('Error fetching admin revenues:', adminRevenuesError);
      return;
    }
    
    console.log(`Recent admin revenues: ${adminRevenues?.length || 0}`);
    if (adminRevenues && adminRevenues.length > 0) {
      adminRevenues.forEach(revenue => {
        console.log(`  - ${revenue.revenue_type}: $${revenue.amount} (${revenue.description})`);
      });
    }
    console.log();

    if (newCommissions && newCommissions.length > 0) {
      console.log('✅ Commission calculation is working!');
      console.log(`Total admin commission: $${newCommissions.reduce((sum, c) => sum + c.admin_amount, 0)}`);
    } else {
      console.log('❌ Commission calculation is NOT working.');
      console.log('Possible issues:');
      console.log('1. Trigger not properly installed');
      console.log('2. Vendor profiles not found');
      console.log('3. Commission calculation function has errors');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testOrderStatusTrigger().catch(console.error);



