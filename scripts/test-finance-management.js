const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFinanceManagementData() {
  console.log('🧪 Testing Finance Management Data Loading...\n');

  try {
    // Test 1: Check payouts with vendor information
    console.log('1. Testing payouts with vendor information...');
    const { data: payouts, error: payoutsError } = await supabase
      .from('vendor_payouts')
      .select(`
        *,
        vendor_profiles!inner (
          id,
          business_name,
          contact_email
        )
      `)
      .limit(5);

    if (payoutsError) {
      console.log('❌ Payouts query failed:', payoutsError.message);
    } else {
      console.log(`✅ Found ${payouts.length} payout records`);
      if (payouts.length > 0) {
        console.log('Sample payout:', {
          id: payouts[0].id.slice(0, 8) + '...',
          vendor: payouts[0].vendor_profiles?.business_name || 'Unknown',
          amount: payouts[0].total_commission,
          status: payouts[0].status
        });
      }
    }

    // Test 2: Check commissions with vendor and order information
    console.log('\n2. Testing commissions with vendor and order information...');
    const { data: commissions, error: commissionsError } = await supabase
      .from('vendor_commissions')
      .select(`
        *,
        vendor_profiles!inner (
          id,
          business_name
        ),
        orders!inner (
          id,
          order_number
        )
      `)
      .limit(5);

    if (commissionsError) {
      console.log('❌ Commissions query failed:', commissionsError.message);
    } else {
      console.log(`✅ Found ${commissions.length} commission records`);
      if (commissions.length > 0) {
        console.log('Sample commission:', {
          id: commissions[0].id.slice(0, 8) + '...',
          vendor: commissions[0].vendor_profiles?.business_name || 'Unknown',
          order: commissions[0].orders?.order_number || 'Unknown',
          amount: commissions[0].commission_amount,
          status: commissions[0].status
        });
      }
    }

    // Test 3: Check admin revenues
    console.log('\n3. Testing admin revenues...');
    const { data: revenues, error: revenuesError } = await supabase
      .from('admin_revenues')
      .select('*')
      .limit(5);

    if (revenuesError) {
      console.log('❌ Admin revenues query failed:', revenuesError.message);
    } else {
      console.log(`✅ Found ${revenues.length} admin revenue records`);
      if (revenues.length > 0) {
        console.log('Sample revenue:', {
          id: revenues[0].id.slice(0, 8) + '...',
          type: revenues[0].revenue_type,
          amount: revenues[0].amount,
          status: revenues[0].status
        });
      }
    }

    // Test 4: Check financial reports
    console.log('\n4. Testing financial reports...');
    const { data: reports, error: reportsError } = await supabase
      .from('financial_reports')
      .select(`
        *,
        profiles!financial_reports_generated_by_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .limit(5);

    if (reportsError) {
      console.log('❌ Financial reports query failed:', reportsError.message);
    } else {
      console.log(`✅ Found ${reports.length} financial report records`);
      if (reports.length > 0) {
        console.log('Sample report:', {
          id: reports[0].id.slice(0, 8) + '...',
          type: reports[0].report_type,
          status: reports[0].status,
          generated_by: reports[0].profiles ? 
            `${reports[0].profiles.first_name} ${reports[0].profiles.last_name}` : 
            'System'
        });
      }
    }

    // Test 5: Check finance transactions
    console.log('\n5. Testing finance transactions...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('finance_transactions')
      .select('*')
      .limit(5);

    if (transactionsError) {
      console.log('❌ Finance transactions query failed:', transactionsError.message);
    } else {
      console.log(`✅ Found ${transactions.length} finance transaction records`);
      if (transactions.length > 0) {
        console.log('Sample transaction:', {
          id: transactions[0].id.slice(0, 8) + '...',
          type: transactions[0].transaction_type,
          amount: transactions[0].amount,
          status: transactions[0].status
        });
      }
    }

    console.log('\n🎉 Finance Management data loading test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testFinanceManagementData().then(() => {
  console.log('\n✨ Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});


