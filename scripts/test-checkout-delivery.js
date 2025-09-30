const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCheckoutDelivery() {
  console.log('Testing Checkout Delivery System...\n');

  try {
    // 1. Get a sample product
    console.log('1. Getting sample products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('is_active', true)
      .limit(2);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('❌ No products found. Please create a product first.');
      return;
    }

    console.log(`Found ${products.length} products:`);
    products.forEach(p => console.log(`  - ${p.name} (${p.id})`));

    // 2. Test different delivery scenarios
    const testScenarios = [
      { city: 'Ankara', country: 'Turkey' },
      { city: 'Istanbul', country: 'Turkey' },
      { city: 'Izmir', country: 'Turkey' },
      { city: 'London', country: 'UK' }, // This should not have delivery options
    ];

    for (const scenario of testScenarios) {
      console.log(`\n2. Testing delivery to ${scenario.city}, ${scenario.country}:`);
      
      let totalShippingCost = 0;
      const productCosts = {};

      for (const product of products) {
        console.log(`\n   Testing product: ${product.name}`);
        
        // Test get_cheapest_delivery_option function
        const { data: deliveryOptions, error: deliveryError } = await supabase.rpc(
          'get_cheapest_delivery_option',
          {
            product_uuid: product.id,
            delivery_city: scenario.city,
            delivery_country: scenario.country
          }
        );

        if (deliveryError) {
          console.error(`     ❌ Error: ${deliveryError.message}`);
          productCosts[product.id] = {
            name: product.name,
            cost: 0,
            isFree: true,
            method: 'Error',
            estimatedDays: 0
          };
          continue;
        }

        if (deliveryOptions && deliveryOptions.length > 0) {
          const option = deliveryOptions[0];
          const deliveryCost = option.delivery_price || 0;
          const isFree = option.is_free_delivery || deliveryCost === 0;
          
          productCosts[product.id] = {
            name: product.name,
            cost: deliveryCost,
            isFree: isFree,
            method: option.delivery_method_name || 'Unknown',
            estimatedDays: option.estimated_min_days || 0
          };
          
          totalShippingCost += deliveryCost;
          
          console.log(`     ✅ Found delivery option:`);
          console.log(`        - Method: ${option.delivery_method_name}`);
          console.log(`        - Pickup: ${option.pickup_city}`);
          console.log(`        - Price: $${deliveryCost}`);
          console.log(`        - Free: ${isFree ? 'Yes' : 'No'}`);
          console.log(`        - Est. Days: ${option.estimated_min_days}-${option.estimated_max_days}`);
        } else {
          console.log(`     ⚠️  No delivery options found`);
          productCosts[product.id] = {
            name: product.name,
            cost: 0,
            isFree: true,
            method: 'Not Available',
            estimatedDays: 0
          };
        }
      }

      // Summary for this scenario
      console.log(`\n   📊 Summary for ${scenario.city}, ${scenario.country}:`);
      console.log(`   Total Shipping Cost: $${totalShippingCost.toFixed(2)}`);
      console.log(`   Product Breakdown:`);
      Object.values(productCosts).forEach(product => {
        console.log(`     - ${product.name}: ${product.isFree ? 'Free' : `$${product.cost.toFixed(2)}`} (${product.method})`);
      });

      // Check if this matches what checkout would show
      const hasValidShipping = Object.values(productCosts).some(p => p.method !== 'Not Available' && p.method !== 'Error');
      if (hasValidShipping) {
        console.log(`   ✅ Checkout would show: "✓ Delivery options available for all products"`);
      } else {
        console.log(`   ⚠️  Checkout would show: "ℹ️ Using default shipping rates"`);
      }
    }

    // 3. Test the delivery function directly with exact city matching
    console.log(`\n3. Testing exact city matching...`);
    
    // First, let's see what cities are available in delivery rates
    const { data: deliveryRates, error: ratesError } = await supabase
      .from('delivery_rates')
      .select('pickup_city, delivery_city, price, delivery_method:delivery_methods(name)')
      .eq('is_active', true)
      .limit(10);

    if (ratesError) {
      console.error('Error fetching delivery rates:', ratesError);
      return;
    }

    console.log(`Available delivery routes:`);
    deliveryRates?.forEach(rate => {
      console.log(`  - ${rate.pickup_city} → ${rate.delivery_city} (${rate.delivery_method?.name}) - $${rate.price}`);
    });

    // Test with exact city names from delivery rates
    if (deliveryRates && deliveryRates.length > 0) {
      const testCity = deliveryRates[0].delivery_city;
      const testCountry = 'Turkey';
      
      console.log(`\nTesting with exact city from delivery rates: ${testCity}, ${testCountry}`);
      
      for (const product of products) {
        const { data: deliveryOptions, error } = await supabase.rpc(
          'get_cheapest_delivery_option',
          {
            product_uuid: product.id,
            delivery_city: testCity,
            delivery_country: testCountry
          }
        );

        if (error) {
          console.error(`Error for ${product.name}:`, error);
        } else if (deliveryOptions && deliveryOptions.length > 0) {
          console.log(`✅ ${product.name}: Found ${deliveryOptions.length} delivery option(s)`);
        } else {
          console.log(`⚠️  ${product.name}: No delivery options found`);
        }
      }
    }

    console.log('\n✅ Checkout delivery test complete!');
    console.log('\nTo test in the browser:');
    console.log('1. Go to checkout page');
    console.log('2. Add products to cart');
    console.log('3. Enter a delivery address with city and country');
    console.log('4. Check the shipping preview section');
    console.log('5. Verify the shipping cost matches the delivery rates');

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testCheckoutDelivery();
