const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOrderStatusUpdate() {
  console.log('🧪 Testing Order Status Update to Delivered...\n');

  try {
    // Step 1: Find an order that's not already delivered
    console.log('1. Finding a test order...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status, user_id')
      .neq('status', 'delivered')
      .limit(5);

    if (ordersError) {
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      console.log('❌ No orders found that are not already delivered');
      return;
    }

    const testOrder = orders[0];
    console.log(`✅ Found test order: ${testOrder.order_number} (${testOrder.status})`);

    // Step 2: Check if order has payment
    console.log('\n2. Checking payment status...');
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, status, amount')
      .eq('order_id', testOrder.id)
      .single();

    if (paymentError && paymentError.code !== 'PGRST116') {
      throw paymentError;
    }

    if (!payment) {
      console.log('⚠️  No payment found for this order');
    } else {
      console.log(`✅ Payment found: ${payment.status} ($${payment.amount})`);
    }

    // Step 3: Check if order has delivery record
    console.log('\n3. Checking delivery record...');
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('id, status, tracking_number')
      .eq('order_id', testOrder.id)
      .single();

    if (deliveryError && deliveryError.code !== 'PGRST116') {
      throw deliveryError;
    }

    if (!delivery) {
      console.log('⚠️  No delivery record found for this order');
    } else {
      console.log(`✅ Delivery found: ${delivery.status} (${delivery.tracking_number || 'No tracking'})`);
    }

    // Step 4: Test the status update using our test function
    console.log('\n4. Testing status update to delivered...');
    const { data: testResult, error: testError } = await supabase
      .rpc('test_order_status_update', {
        order_uuid: testOrder.id,
        new_status: 'delivered'
      });

    if (testError) {
      throw testError;
    }

    console.log(`✅ Test result: ${testResult}`);

    // Step 5: Verify the update worked
    console.log('\n5. Verifying the update...');
    const { data: updatedOrder, error: verifyError } = await supabase
      .from('orders')
      .select('id, status, updated_at')
      .eq('id', testOrder.id)
      .single();

    if (verifyError) {
      throw verifyError;
    }

    console.log(`✅ Order status is now: ${updatedOrder.status}`);
    console.log(`✅ Updated at: ${updatedOrder.updated_at}`);

    // Step 6: Check if delivery status was synced
    if (delivery) {
      console.log('\n6. Checking delivery status sync...');
      const { data: updatedDelivery, error: deliverySyncError } = await supabase
        .from('deliveries')
        .select('id, status, updated_at')
        .eq('id', delivery.id)
        .single();

      if (deliverySyncError) {
        throw deliverySyncError;
      }

      console.log(`✅ Delivery status is now: ${updatedDelivery.status}`);
      console.log(`✅ Delivery updated at: ${updatedDelivery.updated_at}`);
    }

    // Step 7: Check if commissions were calculated
    console.log('\n7. Checking commission calculation...');
    const { data: commissions, error: commissionError } = await supabase
      .from('vendor_commissions')
      .select('id, order_id, vendor_id, commission_amount, status')
      .eq('order_id', testOrder.id);

    if (commissionError) {
      throw commissionError;
    }

    if (commissions && commissions.length > 0) {
      console.log(`✅ Found ${commissions.length} commission record(s):`);
      commissions.forEach((commission, index) => {
        console.log(`   ${index + 1}. Vendor: ${commission.vendor_id}, Amount: $${commission.commission_amount}, Status: ${commission.status}`);
      });
    } else {
      console.log('⚠️  No commission records found (this might be expected if no vendor products)');
    }

    // Step 7.5: Test commission calculation preview
    console.log('\n7.5. Testing commission calculation preview...');
    const { data: commissionPreview, error: previewError } = await supabase
      .rpc('test_commission_calculation', {
        order_uuid: testOrder.id
      });

    if (previewError) {
      console.log('⚠️  Could not preview commission calculation:', previewError.message);
    } else if (commissionPreview && commissionPreview.length > 0) {
      console.log(`✅ Commission preview for ${commissionPreview.length} item(s):`);
      commissionPreview.forEach((item, index) => {
        console.log(`   ${index + 1}. Product: ${item.product_id}, Order: $${item.order_amount}, Rate: ${item.commission_rate}%, Vendor: $${item.vendor_commission}, Admin: $${item.admin_commission}`);
      });
    } else {
      console.log('⚠️  No commission preview available (no vendor products in this order)');
    }

    console.log('\n🎉 Order status update test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

async function testDirectStatusUpdate() {
  console.log('\n🔧 Testing Direct Status Update (without test function)...\n');

  try {
    // Find an order
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .neq('status', 'delivered')
      .limit(1);

    if (ordersError) {
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      console.log('❌ No orders found for direct test');
      return;
    }

    const testOrder = orders[0];
    console.log(`Testing direct update on order: ${testOrder.order_number} (${testOrder.status})`);

    // Direct update
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', testOrder.id);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Direct status update completed successfully!');

    // Verify
    const { data: updatedOrder, error: verifyError } = await supabase
      .from('orders')
      .select('id, status, updated_at')
      .eq('id', testOrder.id)
      .single();

    if (verifyError) {
      throw verifyError;
    }

    console.log(`✅ Order status confirmed: ${updatedOrder.status}`);

  } catch (error) {
    console.error('❌ Direct update test failed:', error);
  }
}

// Run the tests
async function runTests() {
  await testOrderStatusUpdate();
  await testDirectStatusUpdate();
}

runTests().then(() => {
  console.log('\n✨ All tests completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
