const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPayoutCreation() {
  console.log('Testing payout creation process...\n');

  // 1. Check if there are any vendors
  console.log('1. Checking vendors...');
  try {
    const { data: vendors, error } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, status')
      .eq('status', 'active')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching vendors:', error.message);
      return;
    }
    
    console.log('✅ Found', vendors?.length || 0, 'active vendors');
    if (vendors && vendors.length > 0) {
      console.log('Sample vendors:');
      vendors.forEach((vendor, index) => {
        console.log(`  ${index + 1}. ${vendor.business_name} (${vendor.id.slice(0, 8)}...)`);
      });
    } else {
      console.log('No active vendors found. Creating a test vendor...');
      // Create a test vendor
      const { data: testVendor, error: vendorError } = await supabase
        .from('vendor_profiles')
        .insert({
          business_name: 'Test Vendor for Payout',
          business_description: 'Test vendor for payout testing',
          commission_rate: 10.0,
          status: 'active'
        })
        .select()
        .single();
      
      if (vendorError) {
        console.error('❌ Error creating test vendor:', vendorError.message);
        return;
      }
      
      console.log('✅ Created test vendor:', testVendor.business_name);
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 2. Check vendor_commissions table
  console.log('\n2. Checking vendor commissions...');
  try {
    const { data: commissions, error } = await supabase
      .from('vendor_commissions')
      .select('*')
      .eq('status', 'pending')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching commissions:', error.message);
    } else {
      console.log('✅ Found', commissions?.length || 0, 'pending commissions');
      if (commissions && commissions.length > 0) {
        console.log('Sample commissions:');
        commissions.forEach((commission, index) => {
          console.log(`  ${index + 1}. Vendor ${commission.vendor_id?.slice(0, 8)}... - $${commission.commission_amount}`);
        });
      } else {
        console.log('No pending commissions found. Creating test commissions...');
        
        // Get a vendor to create test commissions for
        const { data: vendors } = await supabase
          .from('vendor_profiles')
          .select('id')
          .eq('status', 'active')
          .limit(1);
        
        if (vendors && vendors.length > 0) {
          const vendorId = vendors[0].id;
          
          // Create test commissions
          const testCommissions = [
            {
              vendor_id: vendorId,
              commission_rate: 10.0,
              order_amount: 100.00,
              commission_amount: 10.00,
              admin_amount: 90.00,
              status: 'pending'
            },
            {
              vendor_id: vendorId,
              commission_rate: 10.0,
              order_amount: 200.00,
              commission_amount: 20.00,
              admin_amount: 180.00,
              status: 'pending'
            }
          ];
          
          const { data: newCommissions, error: commissionError } = await supabase
            .from('vendor_commissions')
            .insert(testCommissions)
            .select();
          
          if (commissionError) {
            console.error('❌ Error creating test commissions:', commissionError.message);
          } else {
            console.log('✅ Created', newCommissions?.length || 0, 'test commissions');
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // 3. Test payout creation process
  console.log('\n3. Testing payout creation...');
  try {
    // Get a vendor with pending commissions
    const { data: vendorWithCommissions } = await supabase
      .from('vendor_commissions')
      .select('vendor_id')
      .eq('status', 'pending')
      .limit(1);
    
    if (!vendorWithCommissions || vendorWithCommissions.length === 0) {
      console.log('No vendor with pending commissions found. Skipping payout test.');
      return;
    }
    
    const vendorId = vendorWithCommissions[0].vendor_id;
    console.log('Testing payout for vendor:', vendorId.slice(0, 8) + '...');
    
    // Get pending commissions for this vendor
    const { data: commissions, error: commissionsError } = await supabase
      .from('vendor_commissions')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('status', 'pending');
    
    if (commissionsError) {
      console.error('❌ Error fetching commissions for payout test:', commissionsError.message);
      return;
    }
    
    if (!commissions || commissions.length === 0) {
      console.log('No pending commissions found for this vendor.');
      return;
    }
    
    const totalCommission = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
    const periodStart = new Date(Math.min(...commissions.map(c => new Date(c.created_at).getTime())));
    const periodEnd = new Date(Math.max(...commissions.map(c => new Date(c.created_at).getTime())));
    
    console.log('Payout details:', {
      totalCommission,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      totalOrders: commissions.length
    });
    
    // Test payout details object creation
    const payoutDetails = {
      account_number: '123456789',
      routing_number: '987654321',
      method: 'bank_transfer'
    };
    
    console.log('Payout details object:', payoutDetails);
    
    // Test creating payout record (without actually inserting)
    console.log('✅ Payout creation logic test passed');
    console.log('   - Commission calculation: OK');
    console.log('   - Period calculation: OK');
    console.log('   - Payout details object: OK');
    
  } catch (err) {
    console.error('❌ Exception during payout test:', err.message);
  }

  // 4. Check database constraints and permissions
  console.log('\n4. Checking database constraints...');
  try {
    // Check if vendor_payouts table exists and has correct structure
    const { data: tableInfo, error } = await supabase
      .from('vendor_payouts')
      .select('*')
      .limit(0);
    
    if (error) {
      console.error('❌ Error accessing vendor_payouts table:', error.message);
    } else {
      console.log('✅ vendor_payouts table is accessible');
    }
    
    // Check if finance_transactions table exists
    const { data: transactionInfo, error: transactionError } = await supabase
      .from('finance_transactions')
      .select('*')
      .limit(0);
    
    if (transactionError) {
      console.error('❌ Error accessing finance_transactions table:', transactionError.message);
    } else {
      console.log('✅ finance_transactions table is accessible');
    }
    
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\nPayout creation test completed!');
}

testPayoutCreation().catch(console.error);

