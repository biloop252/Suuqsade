const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPayoutCommissionFlow() {
  console.log('Testing payout and commission status flow...\n');

  // 1. Check current pending commissions
  console.log('1. Checking current pending commissions...');
  try {
    const { data: pendingCommissions, error } = await supabase
      .from('vendor_commissions')
      .select('*')
      .eq('status', 'pending')
      .limit(10);
    
    if (error) {
      console.error('❌ Error querying pending commissions:', error.message);
    } else {
      console.log('✅ Found', pendingCommissions?.length || 0, 'pending commissions');
      if (pendingCommissions && pendingCommissions.length > 0) {
        console.log('Sample pending commissions:');
        pendingCommissions.forEach((commission, index) => {
          console.log(`  ${index + 1}. Vendor ${commission.vendor_id?.slice(0, 8)}... - $${commission.commission_amount} - ${commission.status}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 2. Check current payouts
  console.log('\n2. Checking current payouts...');
  try {
    const { data: payouts, error } = await supabase
      .from('vendor_payouts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying payouts:', error.message);
    } else {
      console.log('✅ Found', payouts?.length || 0, 'payouts');
      if (payouts && payouts.length > 0) {
        console.log('Sample payouts:');
        payouts.forEach((payout, index) => {
          console.log(`  ${index + 1}. Vendor ${payout.vendor_id?.slice(0, 8)}... - $${payout.total_commission} - Status: ${payout.status}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 3. Check commission statuses by payout status
  console.log('\n3. Analyzing commission statuses by payout status...');
  try {
    const { data: analysis, error } = await supabase
      .from('vendor_payouts')
      .select(`
        id,
        vendor_id,
        status as payout_status,
        total_commission,
        vendor_commissions!inner(
          id,
          status as commission_status,
          commission_amount
        )
      `)
      .limit(10);
    
    if (error) {
      console.error('❌ Error with analysis query:', error.message);
    } else {
      console.log('✅ Analysis query successful');
      if (analysis && analysis.length > 0) {
        console.log('Payout-Commission Status Analysis:');
        analysis.forEach((payout, index) => {
          console.log(`  ${index + 1}. Payout ${payout.id?.slice(0, 8)}... (${payout.payout_status})`);
          console.log(`     - Vendor: ${payout.vendor_id?.slice(0, 8)}...`);
          console.log(`     - Total Commission: $${payout.total_commission}`);
          console.log(`     - Commission Statuses: ${payout.vendor_commissions?.map(c => c.commission_status).join(', ')}`);
          
          // Check for inconsistencies
          const hasPendingCommissions = payout.vendor_commissions?.some(c => c.commission_status === 'pending');
          if (payout.payout_status === 'completed' && hasPendingCommissions) {
            console.log(`     ⚠️  ISSUE: Completed payout has pending commissions!`);
          }
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 4. Test the get_vendor_commissions_with_profiles function
  console.log('\n4. Testing get_vendor_commissions_with_profiles function...');
  try {
    const { data, error } = await supabase.rpc('get_vendor_commissions_with_profiles', {
      status_filter: 'pending',
      vendor_id_filter: null
    });
    
    if (error) {
      console.error('❌ Error calling get_vendor_commissions_with_profiles:', error.message);
    } else {
      console.log('✅ Function call successful');
      console.log('Found', data?.length || 0, 'pending commissions with profiles');
      if (data && data.length > 0) {
        console.log('Sample results:');
        data.slice(0, 3).forEach((commission, index) => {
          console.log(`  ${index + 1}. ${commission.business_name || 'Unknown'} - $${commission.commission_amount} - ${commission.status}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 5. Check for data consistency issues
  console.log('\n5. Checking for data consistency issues...');
  try {
    // Find payouts that are completed but have pending commissions
    const { data: inconsistentData, error } = await supabase
      .from('vendor_payouts')
      .select(`
        id,
        vendor_id,
        status,
        total_commission,
        vendor_commissions!inner(
          status,
          commission_amount
        )
      `)
      .eq('status', 'completed');
    
    if (error) {
      console.error('❌ Error checking consistency:', error.message);
    } else {
      console.log('✅ Consistency check completed');
      if (inconsistentData && inconsistentData.length > 0) {
        const inconsistentPayouts = inconsistentData.filter(payout => 
          payout.vendor_commissions?.some(commission => commission.status === 'pending')
        );
        
        if (inconsistentPayouts.length > 0) {
          console.log(`⚠️  Found ${inconsistentPayouts.length} completed payouts with pending commissions:`);
          inconsistentPayouts.forEach((payout, index) => {
            console.log(`  ${index + 1}. Payout ${payout.id?.slice(0, 8)}... - Vendor ${payout.vendor_id?.slice(0, 8)}...`);
            const pendingCommissions = payout.vendor_commissions?.filter(c => c.status === 'pending');
            console.log(`     - ${pendingCommissions?.length || 0} pending commissions totaling $${pendingCommissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0}`);
          });
        } else {
          console.log('✅ No consistency issues found - all completed payouts have paid commissions');
        }
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\nPayout-Commission flow test completed!');
}

testPayoutCommissionFlow().catch(console.error);

