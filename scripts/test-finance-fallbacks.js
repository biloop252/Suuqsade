const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFinanceFallbacks() {
  console.log('🧪 Testing Finance Management Fallbacks...\n');

  try {
    // Test 1: Check if functions exist
    console.log('1. Testing if database functions exist...');
    
    const functionsToTest = [
      'get_admin_financial_summary',
      'get_vendor_financial_summary', 
      'get_vendor_commission_revenue_breakdown',
      'get_vendor_commissions_with_profiles',
      'get_vendor_payouts_with_profiles'
    ];

    for (const funcName of functionsToTest) {
      try {
        const { data, error } = await supabase.rpc(funcName, {});
        if (error && error.code === 'PGRST202') {
          console.log(`❌ Function ${funcName} does not exist`);
        } else if (error) {
          console.log(`⚠️  Function ${funcName} exists but has other error: ${error.message}`);
        } else {
          console.log(`✅ Function ${funcName} exists and works`);
        }
      } catch (err) {
        console.log(`❌ Function ${funcName} test failed: ${err.message}`);
      }
    }

    // Test 2: Test fallback queries
    console.log('\n2. Testing fallback queries...');
    
    // Test admin revenues fallback
    const { data: adminRevenues, error: adminError } = await supabase
      .from('admin_revenues')
      .select('amount, revenue_type')
      .limit(5);

    if (adminError) {
      console.log('❌ Admin revenues fallback failed:', adminError.message);
    } else {
      console.log(`✅ Admin revenues fallback works! Found ${adminRevenues.length} records`);
    }

    // Test vendor commissions fallback
    const { data: vendorCommissions, error: vendorError } = await supabase
      .from('vendor_commissions')
      .select('vendor_id, commission_amount, admin_amount, order_amount, status')
      .limit(5);

    if (vendorError) {
      console.log('❌ Vendor commissions fallback failed:', vendorError.message);
    } else {
      console.log(`✅ Vendor commissions fallback works! Found ${vendorCommissions.length} records`);
    }

    // Test vendor profiles fallback
    const { data: vendorProfiles, error: profilesError } = await supabase
      .from('vendor_profiles')
      .select('id, business_name')
      .limit(5);

    if (profilesError) {
      console.log('❌ Vendor profiles fallback failed:', profilesError.message);
    } else {
      console.log(`✅ Vendor profiles fallback works! Found ${vendorProfiles.length} records`);
    }

    // Test 3: Test the view
    console.log('\n3. Testing vendor_commissions_with_profiles view...');
    
    const { data: viewData, error: viewError } = await supabase
      .from('vendor_commissions_with_profiles')
      .select('*')
      .limit(3);

    if (viewError) {
      console.log('❌ View does not exist:', viewError.message);
    } else {
      console.log(`✅ View works! Found ${viewData.length} records`);
    }

    // Test 4: Test basic table queries
    console.log('\n4. Testing basic table queries...');
    
    const tablesToTest = [
      'finance_transactions',
      'vendor_payouts',
      'financial_reports'
    ];

    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${tableName} query failed: ${error.message}`);
        } else {
          console.log(`✅ Table ${tableName} query works!`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName} test failed: ${err.message}`);
      }
    }

    console.log('\n🎉 Finance fallback testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testFinanceFallbacks().then(() => {
  console.log('\n✨ Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});


