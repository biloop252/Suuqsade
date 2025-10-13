// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createCommissionTestData() {
  console.log('=== Creating Commission Test Data ===\n');
  
  try {
    // 1. Get a vendor profile
    console.log('1. Getting vendor profile...');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, commission_rate')
      .eq('status', 'active')
      .limit(1);
    
    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError);
      return;
    }
    
    if (!vendors || vendors.length === 0) {
      console.log('No active vendors found. Please create a vendor first.');
      return;
    }
    
    const vendor = vendors[0];
    console.log(`Using vendor: ${vendor.business_name} (${vendor.commission_rate}% commission)`);
    console.log();

    // 2. Get some products to assign to the vendor
    console.log('2. Getting products to assign to vendor...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .is('vendor_id', null)
      .limit(3);
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }
    
    if (!products || products.length === 0) {
      console.log('No products found to assign to vendor.');
      return;
    }
    
    console.log(`Found ${products.length} products to assign:`);
    products.forEach(product => {
      console.log(`  - ${product.name}: $${product.price}`);
    });
    console.log();

    // 3. Assign products to vendor
    console.log('3. Assigning products to vendor...');
    const productIds = products.map(p => p.id);
    const { error: updateError } = await supabase
      .from('products')
      .update({ vendor_id: vendor.id })
      .in('id', productIds);
    
    if (updateError) {
      console.error('Error assigning products to vendor:', updateError);
      return;
    }
    
    console.log('Products assigned to vendor successfully!');
    console.log();

    // 4. Get a user to create an order
    console.log('4. Getting user for order...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'customer')
      .limit(1);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('No customer users found. Please create a customer first.');
      return;
    }
    
    const user = users[0];
    console.log(`Using customer: ${user.email}`);
    console.log();

    // 5. Create a test order
    console.log('5. Creating test order...');
    const orderNumber = `TEST-${Date.now()}`;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        status: 'delivered', // Set as delivered to trigger commission calculation
        total_amount: 150.00,
        subtotal: 150.00,
        tax_amount: 0.00,
        shipping_amount: 0.00,
        discount_amount: 0.00
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('Error creating order:', orderError);
      return;
    }
    
    console.log(`Order created: ${order.order_number} (ID: ${order.id})`);
    console.log();

    // 6. Create order items
    console.log('6. Creating order items...');
    const orderItems = products.map((product, index) => ({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.price,
      total_price: product.price
    }));
    
    const { data: createdOrderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();
    
    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      return;
    }
    
    console.log(`Created ${createdOrderItems.length} order items:`);
    createdOrderItems.forEach(item => {
      console.log(`  - ${item.product_name}: $${item.total_price}`);
    });
    console.log();

    // 7. Create payment record
    console.log('7. Creating payment record...');
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        amount: 150.00,
        payment_method: 'test',
        status: 'paid'
      });
    
    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return;
    }
    
    console.log('Payment record created successfully!');
    console.log();

    // 8. Trigger commission calculation
    console.log('8. Triggering commission calculation...');
    const { error: commissionError } = await supabase.rpc('calculate_order_commissions', {
      order_uuid: order.id
    });
    
    if (commissionError) {
      console.error('Error calculating commissions:', commissionError);
      return;
    }
    
    console.log('Commission calculation completed!');
    console.log();

    // 9. Check the results
    console.log('9. Checking commission results...');
    const { data: commissionResults, error: commissionResultsError } = await supabase
      .from('vendor_commissions')
      .select('*')
      .eq('order_id', order.id);
    
    if (commissionResultsError) {
      console.error('Error fetching commission results:', commissionResultsError);
      return;
    }
    
    console.log(`Commission records created: ${commissionResults.length}`);
    commissionResults.forEach(commission => {
      console.log(`  - Product: $${commission.order_amount} -> Admin: $${commission.admin_amount}, Vendor: $${commission.commission_amount} (${commission.commission_rate}%)`);
    });
    console.log();

    // 10. Test the commission revenue function
    console.log('10. Testing commission revenue function...');
    const { data: commissionRevenue, error: commissionRevenueError } = await supabase.rpc('get_vendor_commission_revenue_breakdown', {
      vendor_uuid: vendor.id,
      start_date: null,
      end_date: null
    });
    
    if (commissionRevenueError) {
      console.error('Error calling commission revenue function:', commissionRevenueError);
      return;
    }
    
    console.log('Commission revenue results:');
    commissionRevenue.forEach(vendor => {
      console.log(`  - ${vendor.business_name}: $${vendor.total_commission_revenue} commission revenue from $${vendor.total_sales} sales (${vendor.total_orders} orders)`);
    });
    console.log();

    console.log('✅ Test data created successfully!');
    console.log('Now you should see commission revenue in the finance dashboard.');
    console.log(`Total commission revenue: $${commissionRevenue[0]?.total_commission_revenue || 0}`);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createCommissionTestData().catch(console.error);



