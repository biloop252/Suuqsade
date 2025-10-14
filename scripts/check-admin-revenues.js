const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndPopulateAdminRevenues() {
  console.log('Checking admin_revenues table...\n');

  // Check current data
  console.log('1. Checking existing admin revenues...');
  try {
    const { data, error } = await supabase
      .from('admin_revenues')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error querying admin_revenues:', error.message);
      return;
    }
    
    console.log('✅ Found', data?.length || 0, 'admin revenue records');
    if (data && data.length > 0) {
      console.log('Sample records:');
      data.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.revenue_type} - $${record.amount} - ${record.description}`);
      });
    } else {
      console.log('No admin revenue records found. Adding sample data...');
      
      // Add sample admin revenue data
      const sampleRevenues = [
        {
          revenue_type: 'commission',
          source_type: 'vendor',
          amount: 150.00,
          description: 'Admin commission from vendor sales',
          status: 'confirmed'
        },
        {
          revenue_type: 'subscription',
          source_type: 'vendor',
          amount: 99.00,
          description: 'Monthly subscription fee',
          status: 'confirmed'
        },
        {
          revenue_type: 'advertising',
          source_type: 'advertiser',
          amount: 500.00,
          description: 'Banner advertising revenue',
          status: 'confirmed'
        },
        {
          revenue_type: 'listing_fee',
          source_type: 'vendor',
          amount: 25.00,
          description: 'Product listing fee',
          status: 'confirmed'
        },
        {
          revenue_type: 'commission',
          source_type: 'vendor',
          amount: 75.50,
          description: 'Admin commission from order #12345',
          status: 'confirmed'
        },
        {
          revenue_type: 'premium_features',
          source_type: 'vendor',
          amount: 200.00,
          description: 'Premium vendor features subscription',
          status: 'confirmed'
        }
      ];

      const { data: insertData, error: insertError } = await supabase
        .from('admin_revenues')
        .insert(sampleRevenues);
      
      if (insertError) {
        console.error('❌ Error inserting sample data:', insertError.message);
      } else {
        console.log('✅ Successfully inserted', sampleRevenues.length, 'sample admin revenue records');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // Check vendor_commissions table
  console.log('\n2. Checking vendor_commissions table...');
  try {
    const { data, error } = await supabase
      .from('vendor_commissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying vendor_commissions:', error.message);
    } else {
      console.log('✅ Found', data?.length || 0, 'vendor commission records');
      if (data && data.length > 0) {
        console.log('Sample commission records:');
        data.forEach((record, index) => {
          console.log(`  ${index + 1}. Order ${record.order_id?.slice(0, 8)}... - Vendor ${record.vendor_id?.slice(0, 8)}... - $${record.admin_amount} admin share`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // Check finance_transactions table
  console.log('\n3. Checking finance_transactions table...');
  try {
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying finance_transactions:', error.message);
    } else {
      console.log('✅ Found', data?.length || 0, 'finance transaction records');
      if (data && data.length > 0) {
        console.log('Sample transaction records:');
        data.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.transaction_type} - $${record.amount} - ${record.description}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // Test the admin financial summary function
  console.log('\n4. Testing get_admin_financial_summary function...');
  try {
    const { data, error } = await supabase.rpc('get_admin_financial_summary', {
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    });
    
    if (error) {
      console.error('❌ Error calling get_admin_financial_summary:', error.message);
    } else {
      console.log('✅ Function call successful');
      if (data && data.length > 0) {
        console.log('Summary data:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\nCheck completed!');
}

checkAndPopulateAdminRevenues().catch(console.error);




