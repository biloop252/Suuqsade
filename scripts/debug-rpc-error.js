const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRpcError() {
  console.log('Debugging RPC Error...\n');

  try {
    // 1. Check if we have products
    console.log('1. Getting sample products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('❌ No products found. Please create a product first.');
      return;
    }

    const product = products[0];
    console.log(`Using product: ${product.name} (${product.id})`);

    // 2. Test the RPC call with different parameter formats
    console.log('\n2. Testing RPC call with different parameter formats...');

    // Test 1: With proper parameter names
    console.log('\nTest 1: Using proper parameter names');
    try {
      const { data: result1, error: error1 } = await supabase.rpc(
        'get_cheapest_delivery_option',
        {
          product_uuid: product.id,
          delivery_city: 'Ankara',
          delivery_country: 'Turkey'
        }
      );

      if (error1) {
        console.error('❌ Error 1:', error1);
      } else {
        console.log('✅ Success 1:', result1);
      }
    } catch (err) {
      console.error('❌ Exception 1:', err);
    }

    // Test 2: With different parameter names
    console.log('\nTest 2: Using different parameter names');
    try {
      const { data: result2, error: error2 } = await supabase.rpc(
        'get_cheapest_delivery_option',
        {
          product_uuid: product.id,
          delivery_city: 'Istanbul',
          delivery_country: 'Turkey'
        }
      );

      if (error2) {
        console.error('❌ Error 2:', error2);
      } else {
        console.log('✅ Success 2:', result2);
      }
    } catch (err) {
      console.error('❌ Exception 2:', err);
    }

    // Test 3: Check if function exists
    console.log('\nTest 3: Checking if function exists');
    try {
      const { data: result3, error: error3 } = await supabase
        .from('pg_proc')
        .select('proname, proargnames, proargtypes')
        .eq('proname', 'get_cheapest_delivery_option');

      if (error3) {
        console.error('❌ Error checking function:', error3);
      } else {
        console.log('✅ Function info:', result3);
      }
    } catch (err) {
      console.error('❌ Exception checking function:', err);
    }

    // Test 4: Try calling with minimal parameters
    console.log('\nTest 4: Testing with minimal parameters');
    try {
      const { data: result4, error: error4 } = await supabase.rpc(
        'get_cheapest_delivery_option',
        {
          product_uuid: product.id,
          delivery_city: 'TestCity',
          delivery_country: 'TestCountry'
        }
      );

      if (error4) {
        console.error('❌ Error 4:', error4);
        console.log('Error details:', JSON.stringify(error4, null, 2));
      } else {
        console.log('✅ Success 4:', result4);
      }
    } catch (err) {
      console.error('❌ Exception 4:', err);
    }

    // Test 5: Check if we can call any RPC function
    console.log('\nTest 5: Testing basic RPC functionality');
    try {
      const { data: result5, error: error5 } = await supabase.rpc('version');

      if (error5) {
        console.error('❌ Error calling version():', error5);
      } else {
        console.log('✅ RPC is working, version:', result5);
      }
    } catch (err) {
      console.error('❌ Exception calling version():', err);
    }

    // Test 6: Check delivery rates table
    console.log('\nTest 6: Checking delivery rates table');
    try {
      const { data: rates, error: ratesError } = await supabase
        .from('delivery_rates')
        .select('*')
        .limit(5);

      if (ratesError) {
        console.error('❌ Error fetching delivery rates:', ratesError);
      } else {
        console.log('✅ Delivery rates found:', rates?.length || 0);
        if (rates && rates.length > 0) {
          console.log('Sample rate:', rates[0]);
        }
      }
    } catch (err) {
      console.error('❌ Exception fetching delivery rates:', err);
    }

    // Test 7: Check product delivery options
    console.log('\nTest 7: Checking product delivery options');
    try {
      const { data: options, error: optionsError } = await supabase
        .from('product_delivery_options')
        .select('*')
        .eq('product_id', product.id)
        .limit(5);

      if (optionsError) {
        console.error('❌ Error fetching product delivery options:', optionsError);
      } else {
        console.log('✅ Product delivery options found:', options?.length || 0);
        if (options && options.length > 0) {
          console.log('Sample option:', options[0]);
        }
      }
    } catch (err) {
      console.error('❌ Exception fetching product delivery options:', err);
    }

  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

// Run the debug
debugRpcError();
