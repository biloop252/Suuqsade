const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFixedFunctions() {
  console.log('🧪 Testing Fixed Vendor Functions...\n');

  try {
    // Test 1: Check if functions exist and work
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
      
      if (commissionsError.code === '42804') {
        console.log('💡 This is still a type mismatch error. The function may need to be recreated.');
      } else if (commissionsError.code === '42P13') {
        console.log('💡 This is a function signature error. The function may need to be dropped first.');
      }
    } else {
      console.log(`✅ get_vendor_commissions_with_profiles works! Found ${commissions.length} commissions`);
      if (commissions.length > 0) {
        console.log('Sample commission:');
        const sample = commissions[0];
        console.log('  - ID:', sample.id.slice(0, 8) + '...');
        console.log('  - Business Name:', sample.business_name || 'No business name');
        console.log('  - Vendor Status:', sample.vendor_status || 'No status');
        console.log('  - Commission Amount:', sample.commission_amount);
        console.log('  - Status:', sample.status);
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
        console.log('Sample payout:');
        const sample = payouts[0];
        console.log('  - ID:', sample.id.slice(0, 8) + '...');
        console.log('  - Business Name:', sample.business_name || 'No business name');
        console.log('  - Total Commission:', sample.total_commission);
        console.log('  - Status:', sample.status);
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
    }

    // Test 4: Test the specific query that was failing
    console.log('\n4. Testing the specific pending commissions query...');
    
    const { data: pendingCommissions, error: pendingError } = await supabase
      .rpc('get_vendor_commissions_with_profiles', {
        status_filter: 'pending',
        vendor_id_filter: null
      });

    if (pendingError) {
      console.log('❌ Pending commissions query failed:', pendingError.message);
    } else {
      console.log(`✅ Pending commissions query works! Found ${pendingCommissions.length} pending commissions`);
      
      // Test the grouping logic
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
    }

    // Test 5: Test alternative approach if functions still don't work
    console.log('\n5. Testing alternative manual join approach...');
    
    const { data: manualData, error: manualError } = await supabase
      .from('vendor_commissions')
      .select(`
        id,
        vendor_id,
        commission_amount,
        status,
        created_at
      `)
      .eq('status', 'pending')
      .limit(3);

    if (manualError) {
      console.log('❌ Manual approach failed:', manualError.message);
    } else {
      console.log(`✅ Manual approach works! Found ${manualData.length} records`);
      
      if (manualData.length > 0) {
        // Get vendor profiles separately
        const vendorIds = manualData.map(c => c.vendor_id);
        const { data: vendorProfiles, error: vendorError } = await supabase
          .from('vendor_profiles')
          .select('id, business_name')
          .in('id', vendorIds);

        if (vendorError) {
          console.log('❌ Getting vendor profiles failed:', vendorError.message);
        } else {
          console.log(`✅ Got ${vendorProfiles.length} vendor profiles`);
          console.log('This approach can be used as a fallback if the functions still have issues.');
        }
      }
    }

    console.log('\n🎉 Function testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testFixedFunctions().then(() => {
  console.log('\n✨ Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});


