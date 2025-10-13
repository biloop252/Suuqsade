const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVendorPerformanceData() {
  console.log('Testing vendor performance data loading...\n');

  // 1. Test get_vendor_performance_metrics function
  console.log('1. Testing get_vendor_performance_metrics function...');
  try {
    const { data, error } = await supabase.rpc('get_vendor_performance_metrics', {
      vendor_uuid: null, // Get all vendors
      days_back: 30
    });
    
    if (error) {
      console.error('❌ Error calling get_vendor_performance_metrics:', error.message);
    } else {
      console.log('✅ Function call successful');
      console.log('Found', data?.length || 0, 'vendors');
      
      if (data && data.length > 0) {
        console.log('Sample vendor data:');
        data.slice(0, 3).forEach((vendor, index) => {
          console.log(`  ${index + 1}. ${vendor.business_name || 'NO BUSINESS NAME'} (${vendor.vendor_id?.slice(0, 8)}...)`);
          console.log(`     - Total Sales: $${vendor.total_sales}`);
          console.log(`     - Total Orders: ${vendor.total_orders}`);
          console.log(`     - Commission Rate: ${vendor.commission_rate}%`);
        });
        
        // Check if any vendors have missing business names
        const vendorsWithoutNames = data.filter(v => !v.business_name || v.business_name === 'Unknown Vendor');
        if (vendorsWithoutNames.length > 0) {
          console.log(`\n⚠️  Found ${vendorsWithoutNames.length} vendors without business names:`);
          vendorsWithoutNames.forEach(vendor => {
            console.log(`  - ${vendor.vendor_id?.slice(0, 8)}... (Sales: $${vendor.total_sales})`);
          });
        } else {
          console.log('\n✅ All vendors have business names');
        }
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 2. Check vendor_profiles table
  console.log('\n2. Checking vendor_profiles table...');
  try {
    const { data: vendors, error } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, status')
      .eq('status', 'active')
      .limit(10);
    
    if (error) {
      console.error('❌ Error querying vendor_profiles:', error.message);
    } else {
      console.log('✅ Found', vendors?.length || 0, 'active vendors in vendor_profiles');
      if (vendors && vendors.length > 0) {
        console.log('Sample vendor profiles:');
        vendors.forEach((vendor, index) => {
          console.log(`  ${index + 1}. ${vendor.business_name || 'NO BUSINESS NAME'} (${vendor.id?.slice(0, 8)}...)`);
        });
        
        // Check for vendors without business names
        const vendorsWithoutNames = vendors.filter(v => !v.business_name);
        if (vendorsWithoutNames.length > 0) {
          console.log(`\n⚠️  Found ${vendorsWithoutNames.length} vendor profiles without business names:`);
          vendorsWithoutNames.forEach(vendor => {
            console.log(`  - ${vendor.id?.slice(0, 8)}...`);
          });
        }
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 3. Check vendor_commissions table
  console.log('\n3. Checking vendor_commissions table...');
  try {
    const { data: commissions, error } = await supabase
      .from('vendor_commissions')
      .select('vendor_id, commission_amount, order_amount, status')
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying vendor_commissions:', error.message);
    } else {
      console.log('✅ Found', commissions?.length || 0, 'commission records');
      if (commissions && commissions.length > 0) {
        console.log('Sample commission records:');
        commissions.forEach((commission, index) => {
          console.log(`  ${index + 1}. Vendor ${commission.vendor_id?.slice(0, 8)}... - $${commission.commission_amount} commission`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 4. Test the join between vendor_profiles and vendor_commissions
  console.log('\n4. Testing vendor data with commissions...');
  try {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select(`
        id,
        business_name,
        status,
        vendor_commissions!inner(
          commission_amount,
          order_amount,
          status
        )
      `)
      .eq('status', 'active')
      .limit(3);
    
    if (error) {
      console.error('❌ Error with join query:', error.message);
    } else {
      console.log('✅ Join query successful');
      if (data && data.length > 0) {
        console.log('Vendors with commissions:');
        data.forEach((vendor, index) => {
          console.log(`  ${index + 1}. ${vendor.business_name || 'NO BUSINESS NAME'} (${vendor.id?.slice(0, 8)}...)`);
          console.log(`     - Commissions: ${vendor.vendor_commissions?.length || 0} records`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\nVendor performance data test completed!');
}

testVendorPerformanceData().catch(console.error);

