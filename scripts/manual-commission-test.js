// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function manualCommissionTest() {
  console.log('=== Manual Commission Calculation Test ===\n');
  
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
      console.log('No active vendors found.');
      return;
    }
    
    const vendor = vendors[0];
    console.log(`Using vendor: ${vendor.business_name} (${vendor.commission_rate}% commission)`);
    console.log();

    // 2. Get a product assigned to this vendor
    console.log('2. Getting product assigned to vendor...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, vendor_id')
      .eq('vendor_id', vendor.id)
      .limit(1);
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }
    
    if (!products || products.length === 0) {
      console.log('No products assigned to this vendor.');
      console.log('Assigning a product to the vendor...');
      
      // Get any product and assign it to the vendor
      const { data: anyProduct, error: anyProductError } = await supabase
        .from('products')
        .select('id, name, price')
        .limit(1)
        .single();
      
      if (anyProductError || !anyProduct) {
        console.error('No products found to assign to vendor.');
        return;
      }
      
      const { error: assignError } = await supabase
        .from('products')
        .update({ vendor_id: vendor.id })
        .eq('id', anyProduct.id);
      
      if (assignError) {
        console.error('Error assigning product to vendor:', assignError);
        return;
      }
      
      console.log(`Assigned product "${anyProduct.name}" to vendor.`);
      products.push({ ...anyProduct, vendor_id: vendor.id });
    }
    
    const product = products[0];
    console.log(`Using product: ${product.name} - $${product.price}`);
    console.log();

    // 3. Get a user for the order
    console.log('3. Getting user for order...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'customer')
      .limit(1)
      .single();
    
    if (usersError || !users) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Using user: ${users.email}`);
    console.log();

    // 4. Create a test order
    console.log('4. Creating test order...');
    const orderNumber = `MANUAL-TEST-${Date.now()}`;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: users.id,
        status: 'confirmed', // Start with confirmed, not delivered
        total_amount: product.price,
        subtotal: product.price,
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

    // 5. Create order item
    console.log('5. Creating order item...');
    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price
      })
      .select()
      .single();
    
    if (orderItemError) {
      console.error('Error creating order item:', orderItemError);
      return;
    }
    
    console.log(`Order item created: ${orderItem.product_name} - $${orderItem.total_price}`);
    console.log();

    // 6. Create payment record
    console.log('6. Creating payment record...');
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        amount: product.price,
        payment_method: 'test',
        status: 'paid'
      });
    
    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return;
    }
    
    console.log('Payment record created successfully!');
    console.log();

    // 7. Manually call the commission calculation function
    console.log('7. Manually calling commission calculation function...');
    const { error: commissionError } = await supabase.rpc('calculate_order_commissions', {
      order_uuid: order.id
    });
    
    if (commissionError) {
      console.error('Error calculating commissions:', commissionError);
      return;
    }
    
    console.log('Commission calculation completed!');
    console.log();

    // 8. Check the results
    console.log('8. Checking commission results...');
    const { data: commissionResults, error: commissionResultsError } = await supabase
      .from('vendor_commissions')
      .select('*')
      .eq('order_id', order.id);
    
    if (commissionResultsError) {
      console.error('Error fetching commission results:', commissionResultsError);
      return;
    }
    
    console.log(`Commission records created: ${commissionResults.length}`);
    if (commissionResults.length > 0) {
      commissionResults.forEach(commission => {
        console.log(`  - Order Amount: $${commission.order_amount}`);
        console.log(`  - Admin Commission: $${commission.admin_amount} (${commission.commission_rate}%)`);
        console.log(`  - Vendor Earnings: $${commission.commission_amount}`);
        console.log(`  - Status: ${commission.status}`);
      });
    } else {
      console.log('❌ No commission records were created!');
    }
    console.log();

    // 9. Check admin revenues
    console.log('9. Checking admin revenues...');
    const { data: adminRevenues, error: adminRevenuesError } = await supabase
      .from('admin_revenues')
      .select('*')
      .eq('source_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (adminRevenuesError) {
      console.error('Error fetching admin revenues:', adminRevenuesError);
      return;
    }
    
    console.log(`Admin revenue records: ${adminRevenues.length}`);
    if (adminRevenues.length > 0) {
      adminRevenues.forEach(revenue => {
        console.log(`  - ${revenue.revenue_type}: $${revenue.amount} (${revenue.description})`);
      });
    }
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
    if (commissionRevenue.length > 0) {
      commissionRevenue.forEach(vendor => {
        console.log(`  - ${vendor.business_name}: $${vendor.total_commission_revenue} commission revenue from $${vendor.total_sales} sales (${vendor.total_orders} orders)`);
      });
    } else {
      console.log('  No commission revenue data found.');
    }
    console.log();

    if (commissionResults.length > 0) {
      console.log('✅ Commission calculation is working!');
      console.log(`Total admin commission: $${commissionResults.reduce((sum, c) => sum + c.admin_amount, 0)}`);
      console.log('You should now see commission revenue in the finance dashboard.');
    } else {
      console.log('❌ Commission calculation failed.');
      console.log('Check the error messages above for details.');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

manualCommissionTest().catch(console.error);



