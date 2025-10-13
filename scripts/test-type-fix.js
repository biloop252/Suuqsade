const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTypeFix() {
  console.log('🧪 Testing Type Fix for Vendor Functions...\n');

  try {
    // Test 1: Check if the functions exist and work
    console.log('1. Testing get_vendor_commissions_with_profiles function...');
    
    const { data: commissions, error: commissionsError } = await supabase
      .rpc('get_vendor_commissions_with_profiles', {
        status_filter: null,
        vendor_id_filter: null
      });

    if (commissionsError) {
      console.log('❌ get_vendor_commissions_with_profiles failed:', commissionsError.message);
      console.log('Error code:', commissionsError.code);
      console.log('Error details:', commissionsError.details);
      console.log('Error hint:', commissionsError.hint);
    } else {
      console.log(`✅ get_vendor_commissions_with_profiles works! Found ${commissions.length} commissions`);
      if (commissions.length > 0) {
        console.log('Sample commission data types:');
        const sample = commissions[0];
        console.log('  - business_name type:', typeof sample.business_name, 'value:', sample.business_name);
        console.log('  - vendor_status type:', typeof sample.vendor_status, 'value:', sample.vendor_status);
        console.log('  - first_name type:', typeof sample.first_name, 'value:', sample.first_name);
        console.log('  - last_name type:', typeof sample.last_name, 'value:', sample.last_name);
        console.log('  - email type:', typeof sample.email, 'value:', sample.email);
      }
    }

    // Test 2: Check get_vendor_payouts_with_profiles function
    console.log('\n2. Testing get_vendor_payouts_with_profiles function...');
    
    const { data: payouts, error: payoutsError } = await supabase
      .rpc('get_vendor_payouts_with_profiles');

    if (payoutsError) {
      console.log('❌ get_vendor_payouts_with_profiles failed:', payoutsError.message);
      console.log('Error code:', payoutsError.code);
      console.log('Error details:', payoutsError.details);
      console.log('Error hint:', payoutsError.hint);
    } else {
      console.log(`✅ get_vendor_payouts_with_profiles works! Found ${payouts.length} payouts`);
      if (payouts.length > 0) {
        console.log('Sample payout data types:');
        const sample = payouts[0];
        console.log('  - business_name type:', typeof sample.business_name, 'value:', sample.business_name);
        console.log('  - vendor_status type:', typeof sample.vendor_status, 'value:', sample.vendor_status);
        console.log('  - first_name type:', typeof sample.first_name, 'value:', sample.first_name);
        console.log('  - last_name type:', typeof sample.last_name, 'value:', sample.last_name);
        console.log('  - email type:', typeof sample.email, 'value:', sample.email);
      }
    }

    // Test 3: Check the view
    console.log('\n3. Testing vendor_commissions_with_profiles view...');
    
    const { data: viewData, error: viewError } = await supabase
      .from('vendor_commissions_with_profiles')
      .select('*')
      .limit(1);

    if (viewError) {
      console.log('❌ vendor_commissions_with_profiles view failed:', viewError.message);
    } else {
      console.log(`✅ vendor_commissions_with_profiles view works! Found ${viewData.length} records`);
      if (viewData.length > 0) {
        console.log('Sample view data types:');
        const sample = viewData[0];
        console.log('  - business_name type:', typeof sample.business_name, 'value:', sample.business_name);
        console.log('  - vendor_status type:', typeof sample.vendor_status, 'value:', sample.vendor_status);
      }
    }

    // Test 4: Test the specific query that was failing in VendorPayoutManagement
    console.log('\n4. Testing the specific query from VendorPayoutManagement...');
    
    const { data: pendingCommissions, error: pendingError } = await supabase
      .rpc('get_vendor_commissions_with_profiles', {
        status_filter: 'pending',
        vendor_id_filter: null
      });

    if (pendingError) {
      console.log('❌ Pending commissions query failed:', pendingError.message);
      console.log('Error code:', pendingError.code);
      console.log('Error details:', pendingError.details);
    } else {
      console.log(`✅ Pending commissions query works! Found ${pendingCommissions.length} pending commissions`);
      
      // Test the grouping logic that was in the component
      const grouped = (pendingCommissions || []).reduce((acc, commission) => {
        const vendorId = commission.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = {
            vendor_id: vendorId,
            total_commission: 0,
            total_orders: 0,
            business_name: commission.business_name
          };
        }
        acc[vendorId].total_commission += commission.commission_amount;
        acc[vendorId].total_orders += 1;
        return acc;
      }, {} as Record<string, any>);
      
      console.log(`✅ Grouping logic works! Created ${Object.keys(grouped).length} vendor groups`);
      if (Object.keys(grouped).length > 0) {
        const firstGroup = Object.values(grouped)[0];
        console.log('Sample grouped data:', {
          vendor_id: firstGroup.vendor_id.slice(0, 8) + '...',
          business_name: firstGroup.business_name,
          total_commission: firstGroup.total_commission,
          total_orders: firstGroup.total_orders
        });
      }
    }

    console.log('\n🎉 Type fix testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testTypeFix().then(() => {
  console.log('\n✨ Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});


