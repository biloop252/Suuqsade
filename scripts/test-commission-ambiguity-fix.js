const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCommissionAmbiguityFix() {
  console.log('🔧 Testing Commission Rate Ambiguity Fix...\n');

  try {
    // Step 1: Find an order with vendor products
    console.log('1. Finding an order with vendor products...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, 
        order_number, 
        status,
        order_items!inner (
          id,
          product_id,
          products!inner (
            id,
            vendor_id,
            vendor_profiles!inner (
              id,
              commission_rate
            )
          )
        )
      `)
      .neq('status', 'delivered')
      .limit(5);

    if (ordersError) {
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      console.log('❌ No orders found with vendor products');
      return;
    }

    const testOrder = orders[0];
    console.log(`✅ Found test order: ${testOrder.order_number} (${testOrder.status})`);
    console.log(`   Has ${testOrder.order_items.length} item(s) with vendor products`);

    // Step 2: Test commission calculation preview
    console.log('\n2. Testing commission calculation preview...');
    const { data: commissionPreview, error: previewError } = await supabase
      .rpc('test_commission_calculation', {
        order_uuid: testOrder.id
      });

    if (previewError) {
      console.log('❌ Commission preview failed:', previewError.message);
      console.log('Error details:', previewError);
      return;
    }

    if (commissionPreview && commissionPreview.length > 0) {
      console.log(`✅ Commission preview successful for ${commissionPreview.length} item(s):`);
      commissionPreview.forEach((item, index) => {
        console.log(`   ${index + 1}. Product: ${item.product_id}`);
        console.log(`      Order Amount: $${item.order_amount}`);
        console.log(`      Commission Rate: ${item.commission_rate}%`);
        console.log(`      Vendor Commission: $${item.vendor_commission}`);
        console.log(`      Admin Commission: $${item.admin_commission}`);
      });
    } else {
      console.log('⚠️  No commission preview available');
    }

    // Step 3: Test the actual commission calculation function
    console.log('\n3. Testing actual commission calculation...');
    
    // First, check if commissions already exist
    const { data: existingCommissions, error: existingError } = await supabase
      .from('vendor_commissions')
      .select('id, order_id')
      .eq('order_id', testOrder.id);

    if (existingError) {
      throw existingError;
    }

    if (existingCommissions && existingCommissions.length > 0) {
      console.log(`⚠️  Commissions already exist for this order (${existingCommissions.length} records)`);
      console.log('   Skipping commission calculation test');
    } else {
      console.log('✅ No existing commissions found, testing calculation...');
      
      // Test the commission calculation function directly
      const { error: calcError } = await supabase
        .rpc('calculate_order_commissions', {
          order_uuid: testOrder.id
        });

      if (calcError) {
        console.log('❌ Commission calculation failed:', calcError.message);
        console.log('Error details:', calcError);
        
        if (calcError.code === '42702') {
          console.log('💡 This is the ambiguous column reference error we\'re trying to fix!');
        }
        return;
      }

      console.log('✅ Commission calculation completed successfully!');

      // Verify commissions were created
      const { data: newCommissions, error: verifyError } = await supabase
        .from('vendor_commissions')
        .select('id, order_id, vendor_id, commission_amount, admin_amount, status')
        .eq('order_id', testOrder.id);

      if (verifyError) {
        throw verifyError;
      }

      if (newCommissions && newCommissions.length > 0) {
        console.log(`✅ Created ${newCommissions.length} commission record(s):`);
        newCommissions.forEach((commission, index) => {
          console.log(`   ${index + 1}. Vendor: ${commission.vendor_id}`);
          console.log(`      Commission: $${commission.commission_amount}`);
          console.log(`      Admin: $${commission.admin_amount}`);
          console.log(`      Status: ${commission.status}`);
        });
      }
    }

    // Step 4: Test order status update to delivered
    console.log('\n4. Testing order status update to delivered...');
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'delivered',
        updated_at: new Date().toISOString()
      })
      .eq('id', testOrder.id);

    if (updateError) {
      console.log('❌ Order status update failed:', updateError.message);
      console.log('Error details:', updateError);
      
      if (updateError.code === '42702') {
        console.log('💡 This is still the ambiguous column reference error!');
        console.log('   The fix may not have been applied yet.');
      }
      return;
    }

    console.log('✅ Order status update to delivered succeeded!');

    // Verify the update
    const { data: updatedOrder, error: verifyUpdateError } = await supabase
      .from('orders')
      .select('id, status, updated_at')
      .eq('id', testOrder.id)
      .single();

    if (verifyUpdateError) {
      throw verifyUpdateError;
    }

    console.log(`✅ Verified: Order status is now "${updatedOrder.status}"`);
    console.log(`✅ Updated at: ${updatedOrder.updated_at}`);

    console.log('\n🎉 Commission ambiguity fix test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testCommissionAmbiguityFix().then(() => {
  console.log('\n✨ Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});


