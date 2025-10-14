const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseOrderTriggers() {
  console.log('🔍 Diagnosing Order Status Update Issues...\n');

  try {
    // Check current triggers on orders table
    console.log('1. Checking current triggers on orders table...');
    const { data: triggers, error: triggerError } = await supabase
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

    if (triggerError) {
      console.log('⚠️  Could not query triggers directly, trying alternative method...');
    } else {
      console.log('Current triggers on orders table:');
      triggers.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`);
      });
    }

    // Test a simple order status update
    console.log('\n2. Testing simple order status update...');
    
    // Find an order to test with
    const { data: testOrder, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .neq('status', 'delivered')
      .limit(1)
      .single();

    if (orderError) {
      console.log('❌ Could not find a test order:', orderError.message);
      return;
    }

    console.log(`Found test order: ${testOrder.order_number} (current status: ${testOrder.status})`);

    // Try to update the status
    console.log('Attempting to update status to "delivered"...');
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'delivered',
        updated_at: new Date().toISOString()
      })
      .eq('id', testOrder.id);

    if (updateError) {
      console.log('❌ Status update failed:', updateError.message);
      console.log('Error details:', updateError);
      
      // Check if it's a constraint violation
      if (updateError.code === '23514') {
        console.log('💡 This appears to be a CHECK constraint violation');
      } else if (updateError.code === '23505') {
        console.log('💡 This appears to be a UNIQUE constraint violation');
      } else if (updateError.code === '23503') {
        console.log('💡 This appears to be a FOREIGN KEY constraint violation');
      }
      
      return;
    }

    console.log('✅ Status update succeeded!');

    // Verify the update
    const { data: updatedOrder, error: verifyError } = await supabase
      .from('orders')
      .select('id, status, updated_at')
      .eq('id', testOrder.id)
      .single();

    if (verifyError) {
      console.log('❌ Could not verify update:', verifyError.message);
      return;
    }

    console.log(`✅ Verified: Order status is now "${updatedOrder.status}"`);
    console.log(`✅ Updated at: ${updatedOrder.updated_at}`);

    // Check if any triggers fired by looking for commission records
    console.log('\n3. Checking if commission calculation trigger fired...');
    const { data: commissions, error: commissionError } = await supabase
      .from('vendor_commissions')
      .select('id, order_id, commission_amount, status')
      .eq('order_id', testOrder.id);

    if (commissionError) {
      console.log('⚠️  Could not check commissions:', commissionError.message);
    } else if (commissions && commissions.length > 0) {
      console.log(`✅ Commission trigger fired! Found ${commissions.length} commission record(s)`);
    } else {
      console.log('⚠️  No commission records found (trigger may not have fired or no vendor products)');
    }

    // Check delivery sync
    console.log('\n4. Checking delivery status sync...');
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('id, status, updated_at')
      .eq('order_id', testOrder.id)
      .single();

    if (deliveryError && deliveryError.code !== 'PGRST116') {
      console.log('⚠️  Could not check delivery:', deliveryError.message);
    } else if (delivery) {
      console.log(`✅ Delivery status: ${delivery.status}`);
      console.log(`✅ Delivery updated at: ${delivery.updated_at}`);
    } else {
      console.log('⚠️  No delivery record found for this order');
    }

    console.log('\n🎉 Diagnosis completed successfully!');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the diagnosis
diagnoseOrderTriggers().then(() => {
  console.log('\n✨ Diagnosis completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Diagnosis failed:', error);
  process.exit(1);
});






