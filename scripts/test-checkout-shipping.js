const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCheckoutShipping() {
  console.log('Testing Checkout Shipping Calculation...\n');

  try {
    // 1. Get a sample product
    console.log('1. Getting sample products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('is_active', true)
      .limit(3);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    console.log(`Found ${products.length} products:`);
    products.forEach(product => {
      console.log(`  - ${product.name} (${product.id})`);
    });

    // 2. Test delivery options for each product
    const testCities = ['Ankara', 'Istanbul', 'Izmir'];
    const testCountry = 'Turkey';

    for (const product of products) {
      console.log(`\n2. Testing delivery options for: ${product.name}`);
      
      for (const city of testCities) {
        console.log(`\n   Testing delivery to ${city}, ${testCountry}:`);
        
        // Test get_cheapest_delivery_option function
        const { data: deliveryOptions, error: deliveryError } = await supabase.rpc(
          'get_cheapest_delivery_option',
          {
            product_uuid: product.id,
            delivery_city: city,
            delivery_country: testCountry
          }
        );

        if (deliveryError) {
          console.error(`     ❌ Error: ${deliveryError.message}`);
          continue;
        }

        if (deliveryOptions && deliveryOptions.length > 0) {
          const option = deliveryOptions[0];
          console.log(`     ✅ Found delivery option:`);
          console.log(`        - Method: ${option.delivery_method_name}`);
          console.log(`        - Pickup: ${option.pickup_city}`);
          console.log(`        - Price: $${option.delivery_price}`);
          console.log(`        - Free: ${option.is_free_delivery ? 'Yes' : 'No'}`);
          console.log(`        - Est. Days: ${option.estimated_min_days}-${option.estimated_max_days}`);
        } else {
          console.log(`     ⚠️  No delivery options found`);
        }
      }
    }

    // 3. Test delivery zones
    console.log(`\n3. Testing delivery zones...`);
    for (const product of products) {
      const { data: zones, error: zonesError } = await supabase
        .from('product_delivery_zones')
        .select('city, country, is_allowed')
        .eq('product_id', product.id);

      if (zonesError) {
        console.error(`Error fetching zones for ${product.name}:`, zonesError);
        continue;
      }

      console.log(`   ${product.name} delivery zones:`);
      if (zones && zones.length > 0) {
        zones.forEach(zone => {
          console.log(`     - ${zone.city}, ${zone.country} (${zone.is_allowed ? 'allowed' : 'blocked'})`);
        });
      } else {
        console.log(`     - No delivery zones configured`);
      }
    }

    // 4. Test product delivery options
    console.log(`\n4. Testing product delivery options...`);
    for (const product of products) {
      const { data: options, error: optionsError } = await supabase
        .from('product_delivery_options')
        .select(`
          id,
          is_free_delivery,
          delivery_rate:delivery_rates(
            id,
            pickup_city,
            delivery_city,
            price,
            estimated_min_days,
            estimated_max_days,
            delivery_method:delivery_methods(name)
          )
        `)
        .eq('product_id', product.id);

      if (optionsError) {
        console.error(`Error fetching options for ${product.name}:`, optionsError);
        continue;
      }

      console.log(`   ${product.name} delivery options:`);
      if (options && options.length > 0) {
        options.forEach(option => {
          if (option.delivery_rate) {
            console.log(`     - ${option.delivery_rate.pickup_city} → ${option.delivery_rate.delivery_city} (${option.delivery_rate.delivery_method?.name}) - $${option.delivery_rate.price} ${option.is_free_delivery ? '(FREE)' : ''}`);
          }
        });
      } else {
        console.log(`     - No delivery options configured`);
      }
    }

    // 5. Simulate checkout scenario
    console.log(`\n5. Simulating checkout scenario...`);
    const testCartItems = products.slice(0, 2); // Take first 2 products
    const testAddress = { city: 'Ankara', country: 'Turkey' };
    
    console.log(`   Cart items: ${testCartItems.map(p => p.name).join(', ')}`);
    console.log(`   Shipping to: ${testAddress.city}, ${testAddress.country}`);
    
    let totalShippingCost = 0;
    const productCosts = {};

    for (const product of testCartItems) {
      const { data: deliveryOptions, error } = await supabase.rpc(
        'get_cheapest_delivery_option',
        {
          product_uuid: product.id,
          delivery_city: testAddress.city,
          delivery_country: testAddress.country
        }
      );

      if (error) {
        console.log(`   ❌ Error calculating delivery for ${product.name}: ${error.message}`);
        productCosts[product.id] = { name: product.name, cost: 0, isFree: true };
        continue;
      }

      if (deliveryOptions && deliveryOptions.length > 0) {
        const option = deliveryOptions[0];
        const cost = option.delivery_price || 0;
        const isFree = option.is_free_delivery || cost === 0;
        
        productCosts[product.id] = {
          name: product.name,
          cost: cost,
          isFree: isFree,
          method: option.delivery_method_name,
          estimatedDays: option.estimated_min_days
        };
        
        totalShippingCost += cost;
        
        console.log(`   ✅ ${product.name}: ${isFree ? 'Free' : `$${cost.toFixed(2)}`} (${option.delivery_method_name})`);
      } else {
        console.log(`   ⚠️  ${product.name}: No delivery options available`);
        productCosts[product.id] = { name: product.name, cost: 0, isFree: true };
      }
    }

    console.log(`\n   Total shipping cost: $${totalShippingCost.toFixed(2)}`);
    console.log(`   Product breakdown:`, productCosts);

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testCheckoutShipping();
