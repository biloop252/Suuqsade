const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinanceFunctions() {
  console.log('Testing finance functions...\n');

  // Test 1: get_vendor_commission_revenue_breakdown_simple
  console.log('1. Testing get_vendor_commission_revenue_breakdown_simple...');
  try {
    const { data, error } = await supabase.rpc('get_vendor_commission_revenue_breakdown_simple', {
      vendor_uuid: null,
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    });
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Returned', data?.length || 0, 'rows');
      if (data && data.length > 0) {
        console.log('Sample data:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n2. Testing get_vendor_commission_revenue_breakdown...');
  try {
    const { data, error } = await supabase.rpc('get_vendor_commission_revenue_breakdown', {
      vendor_uuid: null,
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    });
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Returned', data?.length || 0, 'rows');
      if (data && data.length > 0) {
        console.log('Sample data:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n3. Testing get_vendor_performance_metrics...');
  try {
    const { data, error } = await supabase.rpc('get_vendor_performance_metrics', {
      vendor_uuid: null,
      days_back: 30
    });
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Returned', data?.length || 0, 'rows');
      if (data && data.length > 0) {
        console.log('Sample data:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n4. Testing get_admin_financial_summary...');
  try {
    const { data, error } = await supabase.rpc('get_admin_financial_summary', {
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    });
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Returned', data?.length || 0, 'rows');
      if (data && data.length > 0) {
        console.log('Sample data:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n5. Testing get_realtime_finance_summary...');
  try {
    const { data, error } = await supabase.rpc('get_realtime_finance_summary');
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Returned', data?.length || 0, 'rows');
      if (data && data.length > 0) {
        console.log('Sample data:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n6. Testing direct vendor_commissions query...');
  try {
    const { data, error } = await supabase
      .from('vendor_commissions')
      .select('vendor_id, commission_amount, admin_amount, order_amount, created_at')
      .limit(5);
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Returned', data?.length || 0, 'rows');
      if (data && data.length > 0) {
        console.log('Sample data:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n7. Testing vendor_profiles query...');
  try {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('id, business_name, commission_rate, status')
      .limit(5);
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success! Returned', data?.length || 0, 'rows');
      if (data && data.length > 0) {
        console.log('Sample data:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\nTest completed!');
}

testFinanceFunctions().catch(console.error);

