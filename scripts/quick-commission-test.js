// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function quickCommissionTest() {
  console.log('=== Quick Commission System Test ===\n');
  
  try {
    // Step 1: Check if we have the basic requirements
    console.log('1. Checking basic requirements...');
    
    // Check vendor profiles
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, commission_rate')
      .eq('status', 'active')
      .limit(1);
    
    if (vendorsError || !vendors || vendors.length === 0) {
      console.log('❌ No active vendors found. Please create a vendor first.');
      return;
    }
    
    const vendor = vendors[0];
    console.log(`✅ Found vendor: ${vendor.business_name} (${vendor.commission_rate}% commission)`);
    
    // Check products with vendor assignments
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, vendor_id')
      .eq('vendor_id', vendor.id)
      .limit(1);
    
    if (productsError || !products || products.length === 0) {
      console.log('❌ No products assigned to vendor. Assigning a product...');
      
      // Get any product and assign it to the vendor
      const { data: anyProduct, error: anyProductError } = await supabase
        .from('products')
        .select('id, name, price')
        .limit(1)
        .single();
      
      if (anyProductError || !anyProduct) {
        console.log('❌ No products found to assign to vendor.');
        return;
      }
      
      const { error: assignError } = await supabase
        .from('products')
        .update({ vendor_id: vendor.id })
        .eq('id', anyProduct.id);
      
      if (assignError) {
        console.log('❌ Error assigning product to vendor:', assignError.message);
        return;
      }
      
      console.log(`✅ Assigned product "${anyProduct.name}" to vendor.`);
      products.push({ ...anyProduct, vendor_id: vendor.id });
    } else {
      console.log(`✅ Found product: ${products[0].name} - $${products[0].price}`);
    }
    
    const product = products[0];
    console.log();

    // Step 2: Create test order
    console.log('2. Creating test order...');
    
    // Get a user
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'customer')
      .limit(1)
      .single();
    
    if (userError || !user) {
      console.log('❌ No customer users found. Please create a customer first.');
      return;
    }
    
    const orderNumber = `QUICK-TEST-${Date.now()}`;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        status: 'confirmed',
        total_amount: product.price,
        subtotal: product.price,
        tax_amount: 0.00,
        shipping_amount: 0.00,
        discount_amount: 0.00
      })
      .select()
      .single();
    
    if (orderError) {
      console.log('❌ Error creating order:', orderError.message);
      return;
    }
    
    console.log(`✅ Order created: ${order.order_number}`);
    
    // Create order item
    const { error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price
      });
    
    if (orderItemError) {
      console.log('❌ Error creating order item:', orderItemError.message);
      return;
    }
    
    console.log('✅ Order item created');
    console.log();

    // Step 3: Test commission calculation
    console.log('3. Testing commission calculation...');
    
    const { error: commissionError } = await supabase.rpc('calculate_order_commissions', {
      order_uuid: order.id
    });
    
    if (commissionError) {
      console.log('❌ Error calculating commissions:', commissionError.message);
      return;
    }
    
    console.log('✅ Commission calculation completed');
    console.log();

    // Step 4: Check results
    console.log('4. Checking results...');
    
    const { data: commissions, error: commissionsError } = await supabase
      .from('vendor_commissions')
      .select('*')
      .eq('order_id', order.id);
    
    if (commissionsError) {
      console.log('❌ Error fetching commissions:', commissionsError.message);
      return;
    }
    
    if (commissions && commissions.length > 0) {
      const commission = commissions[0];
      console.log('✅ Commission record created:');
      console.log(`   - Order Amount: $${commission.order_amount}`);
      console.log(`   - Admin Commission: $${commission.admin_amount} (${commission.commission_rate}%)`);
      console.log(`   - Vendor Earnings: $${commission.commission_amount}`);
    } else {
      console.log('❌ No commission records created');
      return;
    }
    console.log();

    // Step 5: Test commission revenue function
    console.log('5. Testing commission revenue function...');
    
    const { data: commissionRevenue, error: commissionRevenueError } = await supabase.rpc('get_vendor_commission_revenue_breakdown', {
      vendor_uuid: vendor.id,
      start_date: null,
      end_date: null
    });
    
    if (commissionRevenueError) {
      console.log('❌ Error calling commission revenue function:', commissionRevenueError.message);
      return;
    }
    
    if (commissionRevenue && commissionRevenue.length > 0) {
      const revenue = commissionRevenue[0];
      console.log('✅ Commission revenue data:');
      console.log(`   - Vendor: ${revenue.business_name}`);
      console.log(`   - Total Sales: $${revenue.total_sales}`);
      console.log(`   - Commission Revenue: $${revenue.total_commission_revenue}`);
      console.log(`   - Orders: ${revenue.total_orders}`);
    } else {
      console.log('❌ No commission revenue data found');
      return;
    }
    console.log();

    console.log('🎉 SUCCESS! Commission system is working correctly.');
    console.log(`You should now see $${commissionRevenue[0].total_commission_revenue} in the finance dashboard.`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

quickCommissionTest().catch(console.error);



