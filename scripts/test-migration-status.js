const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigrationStatus() {
  console.log('Testing Migration Status...\n');

  try {
    // 1. Test if basic RPC works
    console.log('1. Testing basic RPC functionality...');
    const { data: version, error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.error('❌ Basic RPC failed:', versionError);
      return;
    } else {
      console.log('✅ Basic RPC works');
    }

    // 2. Test the test function
    console.log('\n2. Testing test_delivery_function...');
    const { data: testResult, error: testError } = await supabase.rpc('test_delivery_function');
    
    if (testError) {
      console.error('❌ Test function failed:', testError);
      console.log('This means the migration has not been applied yet.');
      console.log('\n🔧 To fix this:');
      console.log('1. Run: supabase db push');
      console.log('2. Or apply the migration manually in your Supabase dashboard');
    } else {
      console.log('✅ Test function works:', testResult);
    }

    // 3. Test the delivery function
    console.log('\n3. Testing get_cheapest_delivery_option...');
    
    // Get a product first
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);

    if (productsError) {
      console.error('❌ Error getting products:', productsError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('❌ No products found. Please create a product first.');
      return;
    }

    const product = products[0];
    console.log(`Using product: ${product.name} (${product.id})`);

    const { data: deliveryOptions, error: deliveryError } = await supabase.rpc(
      'get_cheapest_delivery_option',
      {
        product_uuid: product.id,
        delivery_city: 'Ankara',
        delivery_country: 'Turkey'
      }
    );

    if (deliveryError) {
      console.error('❌ Delivery function failed:', deliveryError);
      
      if (deliveryError.message && deliveryError.message.includes('function') && deliveryError.message.includes('does not exist')) {
        console.log('\n🔧 The delivery function does not exist. You need to apply the migration.');
        console.log('\nTo fix this:');
        console.log('1. Run: supabase db push');
        console.log('2. Or manually run the migration SQL in your Supabase dashboard');
        console.log('3. The migration file is: supabase/migrations/041_fix_delivery_functions_v2.sql');
      } else {
        console.log('\n🔧 The function exists but there might be a parameter issue.');
        console.log('Error details:', JSON.stringify(deliveryError, null, 2));
      }
    } else {
      console.log('✅ Delivery function works!');
      console.log('Result:', deliveryOptions);
      
      if (deliveryOptions && deliveryOptions.length > 0) {
        console.log(`Found ${deliveryOptions.length} delivery option(s)`);
        deliveryOptions.forEach((option, index) => {
          console.log(`  ${index + 1}. ${option.delivery_method_name} - $${option.delivery_price} (${option.estimated_min_days} days)`);
        });
      } else {
        console.log('No delivery options found for this product and location.');
      }
    }

    // 4. Check if we have the required data
    console.log('\n4. Checking required data...');
    
    // Check delivery rates
    const { data: rates, error: ratesError } = await supabase
      .from('delivery_rates')
      .select('count')
      .single();

    if (ratesError) {
      console.log('❌ Error checking delivery rates:', ratesError);
    } else {
      console.log('✅ Delivery rates table exists');
    }

    // Check product delivery options
    const { data: options, error: optionsError } = await supabase
      .from('product_delivery_options')
      .select('count')
      .eq('product_id', product.id)
      .single();

    if (optionsError) {
      console.log('❌ Error checking product delivery options:', optionsError);
    } else {
      console.log('✅ Product delivery options table exists');
    }

    // Check product delivery zones
    const { data: zones, error: zonesError } = await supabase
      .from('product_delivery_zones')
      .select('count')
      .eq('product_id', product.id)
      .single();

    if (zonesError) {
      console.log('❌ Error checking product delivery zones:', zonesError);
    } else {
      console.log('✅ Product delivery zones table exists');
    }

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

// Run the test
testMigrationStatus();
