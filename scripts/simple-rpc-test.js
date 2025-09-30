const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleRpcTest() {
  console.log('Simple RPC Test...\n');

  try {
    // 1. Test basic RPC functionality
    console.log('1. Testing basic RPC...');
    const { data: version, error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.error('❌ Basic RPC failed:', versionError);
      return;
    } else {
      console.log('✅ Basic RPC works, version:', version);
    }

    // 2. Get a product ID
    console.log('\n2. Getting product ID...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (productsError) {
      console.error('❌ Error getting products:', productsError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('❌ No products found');
      return;
    }

    const productId = products[0].id;
    console.log('✅ Product ID:', productId);

    // 3. Test the delivery function with exact parameters
    console.log('\n3. Testing get_cheapest_delivery_option...');
    
    const { data: deliveryOptions, error: deliveryError } = await supabase.rpc(
      'get_cheapest_delivery_option',
      {
        product_uuid: productId,
        delivery_city: 'Ankara',
        delivery_country: 'Turkey'
      }
    );

    if (deliveryError) {
      console.error('❌ Delivery function error:', deliveryError);
      console.log('Error details:', JSON.stringify(deliveryError, null, 2));
      
      // Check if it's a function not found error
      if (deliveryError.message && deliveryError.message.includes('function') && deliveryError.message.includes('does not exist')) {
        console.log('\n🔧 The function does not exist. You need to apply the migration.');
        console.log('Run: supabase db push');
      }
    } else {
      console.log('✅ Delivery function works!');
      console.log('Result:', deliveryOptions);
    }

    // 4. Test with different parameter names (in case there's a mismatch)
    console.log('\n4. Testing with different parameter names...');
    
    const { data: deliveryOptions2, error: deliveryError2 } = await supabase.rpc(
      'get_cheapest_delivery_option',
      {
        product_uuid: productId,
        delivery_city: 'Istanbul',
        delivery_country: 'Turkey'
      }
    );

    if (deliveryError2) {
      console.error('❌ Delivery function error (test 2):', deliveryError2);
    } else {
      console.log('✅ Delivery function works (test 2)!');
      console.log('Result:', deliveryOptions2);
    }

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

// Run the test
simpleRpcTest();
