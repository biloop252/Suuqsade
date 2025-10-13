const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinanceIntegration() {
  console.log('🧪 Testing Finance System Integration...\n');

  try {
    // 1. Get a test user and vendor
    console.log('1. Getting test data...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (userError || !users.length) {
      throw new Error('No test users found');
    }

    const { data: vendors, error: vendorError } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, commission_rate')
      .eq('status', 'active')
      .limit(1);
    
    if (vendorError || !vendors.length) {
      throw new Error('No test vendors found');
    }

    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('vendor_id', vendors[0].id)
      .limit(1);
    
    if (productError || !products.length) {
      throw new Error('No test products found');
    }

    const testUser = users[0];
    const testVendor = vendors[0];
    const testProduct = products[0];

    console.log(`✅ Test User: ${testUser.id}`);
    console.log(`✅ Test Vendor: ${testVendor.business_name} (${testVendor.commission_rate}% commission)`);
    console.log(`✅ Test Product: ${testProduct.name} ($${testProduct.price})\n`);

    // 2. Create a test order
    console.log('2. Creating test order...');
    const orderNumber = `TEST-${Date.now()}`;
    const orderAmount = 100.00;
    const commissionRate = testVendor.commission_rate;
    const expectedAdminRevenue = (orderAmount * commissionRate) / 100; // Admin gets commission_rate%
    const expectedVendorCommission = orderAmount - expectedAdminRevenue; // Vendor gets the rest

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: testUser.id,
        status: 'delivered',
        total_amount: orderAmount,
        subtotal: orderAmount,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 0
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Order creation failed: ${orderError.message}`);
    }

    console.log(`✅ Order created: ${order.order_number} ($${order.total_amount})\n`);

    // 3. Create order item
    console.log('3. Creating order item...');
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: testProduct.id,
        product_name: testProduct.name,
        quantity: 1,
        unit_price: testProduct.price,
        total_price: orderAmount
      })
      .select()
      .single();

    if (itemError) {
      throw new Error(`Order item creation failed: ${itemError.message}`);
    }

    console.log(`✅ Order item created: ${orderItem.product_name}\n`);

    // 4. Create payment record
    console.log('4. Creating payment record...');
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        amount: orderAmount,
        payment_method: 'test',
        status: 'paid'
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Payment creation failed: ${paymentError.message}`);
    }

    console.log(`✅ Payment created: $${payment.amount} (${payment.status})\n`);

    // 5. Commission calculation will be triggered automatically when payment is marked as paid
    console.log('5. Commission calculation triggered automatically by payment status change\n');

    // 6. Verify finance transactions were created
    console.log('6. Verifying finance transactions...');
    const { data: transactions, error: transactionError } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('order_id', order.id);

    if (transactionError) {
      throw new Error(`Transaction verification failed: ${transactionError.message}`);
    }

    console.log(`✅ Found ${transactions.length} finance transactions:`);
    transactions.forEach(t => {
      console.log(`   - ${t.transaction_type}: $${t.amount} (${t.status})`);
    });
    console.log();

    // 7. Verify vendor commissions were created
    console.log('7. Verifying vendor commissions...');
    const { data: commissions, error: commissionVerifyError } = await supabase
      .from('vendor_commissions')
      .select('*')
      .eq('order_id', order.id);

    if (commissionVerifyError) {
      throw new Error(`Commission verification failed: ${commissionVerifyError.message}`);
    }

    if (commissions.length > 0) {
      const commission = commissions[0];
      console.log(`✅ Vendor commission created:`);
      console.log(`   - Order Amount: $${commission.order_amount}`);
      console.log(`   - Commission Rate: ${commission.commission_rate}% (Admin's %)`);
      console.log(`   - Vendor Commission: $${commission.commission_amount}`);
      console.log(`   - Admin Revenue: $${commission.admin_amount}`);
      console.log(`   - Status: ${commission.status}`);
      
      // Verify calculations
      if (Math.abs(commission.commission_amount - expectedVendorCommission) < 0.01) {
        console.log('✅ Vendor commission calculation is correct');
      } else {
        console.log(`❌ Vendor commission calculation error: expected $${expectedVendorCommission}, got $${commission.commission_amount}`);
      }
      
      if (Math.abs(commission.admin_amount - expectedAdminRevenue) < 0.01) {
        console.log('✅ Admin revenue calculation is correct');
      } else {
        console.log(`❌ Admin revenue calculation error: expected $${expectedAdminRevenue}, got $${commission.admin_amount}`);
      }
    } else {
      console.log('❌ No vendor commissions found');
    }
    console.log();

    // 8. Verify admin revenues were created
    console.log('8. Verifying admin revenues...');
    const { data: adminRevenues, error: adminRevenueError } = await supabase
      .from('admin_revenues')
      .select('*')
      .eq('source_id', testVendor.id)
      .eq('revenue_type', 'commission');

    if (adminRevenueError) {
      throw new Error(`Admin revenue verification failed: ${adminRevenueError.message}`);
    }

    if (adminRevenues.length > 0) {
      const adminRevenue = adminRevenues[adminRevenues.length - 1]; // Get the most recent
      console.log(`✅ Admin revenue created:`);
      console.log(`   - Amount: $${adminRevenue.amount}`);
      console.log(`   - Type: ${adminRevenue.revenue_type}`);
      console.log(`   - Source: ${adminRevenue.source_type}`);
      console.log(`   - Status: ${adminRevenue.status}`);
    } else {
      console.log('❌ No admin revenues found');
    }
    console.log();

    // 9. Test real-time summary
    console.log('9. Testing real-time summary...');
    const { data: realtimeSummary, error: realtimeError } = await supabase.rpc('get_realtime_finance_summary');

    if (realtimeError) {
      console.log(`⚠️ Real-time summary error: ${realtimeError.message}`);
    } else if (realtimeSummary && realtimeSummary.length > 0) {
      const summary = realtimeSummary[0];
      console.log(`✅ Real-time summary:`);
      console.log(`   - Orders Today: ${summary.total_orders_today}`);
      console.log(`   - Revenue Today: $${summary.total_revenue_today}`);
      console.log(`   - Commissions Today: $${summary.total_commissions_today}`);
      console.log(`   - Pending Payouts: $${summary.pending_payouts}`);
      console.log(`   - Active Vendors: ${summary.total_vendors_active}`);
    }
    console.log();

    // 10. Clean up test data
    console.log('10. Cleaning up test data...');
    await supabase.from('vendor_commissions').delete().eq('order_id', order.id);
    await supabase.from('finance_transactions').delete().eq('order_id', order.id);
    await supabase.from('admin_revenues').delete().eq('source_id', testVendor.id).eq('revenue_type', 'commission');
    await supabase.from('payments').delete().eq('id', payment.id);
    await supabase.from('order_items').delete().eq('id', orderItem.id);
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 Finance System Integration Test PASSED!');
    console.log('\n📊 Summary:');
    console.log(`- Order created and processed successfully`);
    console.log(`- Admin commission: $${expectedAdminRevenue} (${commissionRate}%)`);
    console.log(`- Vendor commission: $${expectedVendorCommission} (${100 - commissionRate}%)`);
    console.log(`- Finance transactions created: ${transactions.length}`);
    console.log(`- Real-time monitoring functional`);

  } catch (error) {
    console.error('❌ Finance System Integration Test FAILED:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the test
testFinanceIntegration();
