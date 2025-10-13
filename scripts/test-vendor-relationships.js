const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testVendorRelationships() {
  console.log('🧪 Testing Vendor Relationship Fixes...\n');

  try {
    // Test 1: Check if the new functions exist
    console.log('1. Testing new database functions...');
    
    // Test get_vendor_commissions_with_profiles function
    const { data: commissions, error: commissionsError } = await supabase
      .rpc('get_vendor_commissions_with_profiles', {
        status_filter: 'pending',
        vendor_id_filter: null
      });

    if (commissionsError) {
      console.log('❌ get_vendor_commissions_with_profiles failed:', commissionsError.message);
    } else {
      console.log(`✅ get_vendor_commissions_with_profiles works! Found ${commissions.length} pending commissions`);
      if (commissions.length > 0) {
        console.log('Sample commission:', {
          id: commissions[0].id.slice(0, 8) + '...',
          vendor_id: commissions[0].vendor_id.slice(0, 8) + '...',
          business_name: commissions[0].business_name || 'No business name',
          commission_amount: commissions[0].commission_amount,
          status: commissions[0].status
        });
      }
    }

    // Test get_vendor_payouts_with_profiles function
    const { data: payouts, error: payoutsError } = await supabase
      .rpc('get_vendor_payouts_with_profiles');

    if (payoutsError) {
      console.log('❌ get_vendor_payouts_with_profiles failed:', payoutsError.message);
    } else {
      console.log(`✅ get_vendor_payouts_with_profiles works! Found ${payouts.length} payouts`);
      if (payouts.length > 0) {
        console.log('Sample payout:', {
          id: payouts[0].id.slice(0, 8) + '...',
          vendor_id: payouts[0].vendor_id.slice(0, 8) + '...',
          business_name: payouts[0].business_name || 'No business name',
          total_commission: payouts[0].total_commission,
          status: payouts[0].status
        });
      }
    }

    // Test 2: Check if the view exists
    console.log('\n2. Testing vendor_commissions_with_profiles view...');
    const { data: viewData, error: viewError } = await supabase
      .from('vendor_commissions_with_profiles')
      .select('*')
      .limit(3);

    if (viewError) {
      console.log('❌ vendor_commissions_with_profiles view failed:', viewError.message);
    } else {
      console.log(`✅ vendor_commissions_with_profiles view works! Found ${viewData.length} records`);
      if (viewData.length > 0) {
        console.log('Sample view record:', {
          id: viewData[0].id.slice(0, 8) + '...',
          business_name: viewData[0].business_name || 'No business name',
          commission_amount: viewData[0].commission_amount,
          status: viewData[0].status
        });
      }
    }

    // Test 3: Test the old problematic query to see if it still fails
    console.log('\n3. Testing old problematic query...');
    const { data: oldQuery, error: oldError } = await supabase
      .from('vendor_commissions')
      .select(`
        vendor_id,
        commission_amount,
        order_id,
        vendor_profiles!inner(business_name)
      `)
      .eq('status', 'pending')
      .limit(1);

    if (oldError) {
      console.log('✅ Old problematic query still fails as expected:', oldError.message);
      console.log('   This confirms the relationship issue exists and our fix is needed.');
    } else {
      console.log('⚠️  Old query unexpectedly works now. This might indicate the relationship was fixed elsewhere.');
    }

    // Test 4: Test alternative approach using manual joins
    console.log('\n4. Testing manual join approach...');
    const { data: manualJoin, error: manualError } = await supabase
      .from('vendor_commissions')
      .select(`
        vendor_id,
        commission_amount,
        order_id,
        status
      `)
      .eq('status', 'pending')
      .limit(3);

    if (manualError) {
      console.log('❌ Manual join approach failed:', manualError.message);
    } else {
      console.log(`✅ Manual join approach works! Found ${manualJoin.length} records`);
      
      // Now try to get vendor profile data separately
      if (manualJoin.length > 0) {
        const vendorIds = manualJoin.map(c => c.vendor_id);
        const { data: vendorProfiles, error: vendorError } = await supabase
          .from('vendor_profiles')
          .select('id, business_name')
          .in('id', vendorIds);

        if (vendorError) {
          console.log('❌ Getting vendor profiles failed:', vendorError.message);
        } else {
          console.log(`✅ Got ${vendorProfiles.length} vendor profiles`);
          console.log('Sample combined data:', {
            commission: {
              vendor_id: manualJoin[0].vendor_id.slice(0, 8) + '...',
              amount: manualJoin[0].commission_amount
            },
            vendor: vendorProfiles.find(v => v.id === manualJoin[0].vendor_id) || { business_name: 'Not found' }
          });
        }
      }
    }

    console.log('\n🎉 Vendor relationship testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testVendorRelationships().then(() => {
  console.log('\n✨ Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});


