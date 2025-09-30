const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDeliveryIssue() {
  console.log('Debugging Delivery Issue...\n');

  try {
    // 1. Check if we have any products
    console.log('1. Checking products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .limit(3);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('❌ No products found in database');
      return;
    }

    console.log(`Found ${products.length} products:`);
    products.forEach(p => console.log(`  - ${p.name} (${p.id})`));

    // 2. Check pickup locations
    console.log('\n2. Checking pickup locations...');
    const { data: pickupLocations, error: pickupError } = await supabase
      .from('pickup_locations')
      .select('id, name, city, country, is_active');

    if (pickupError) {
      console.error('Error fetching pickup locations:', pickupError);
      return;
    }

    console.log(`Found ${pickupLocations?.length || 0} pickup locations:`);
    pickupLocations?.forEach(pl => {
      console.log(`  - ${pl.name} (${pl.city}, ${pl.country}) - Active: ${pl.is_active}`);
    });

    // 3. Check delivery methods
    console.log('\n3. Checking delivery methods...');
    const { data: deliveryMethods, error: methodsError } = await supabase
      .from('delivery_methods')
      .select('id, name, is_active');

    if (methodsError) {
      console.error('Error fetching delivery methods:', methodsError);
      return;
    }

    console.log(`Found ${deliveryMethods?.length || 0} delivery methods:`);
    deliveryMethods?.forEach(dm => {
      console.log(`  - ${dm.name} - Active: ${dm.is_active}`);
    });

    // 4. Check delivery rates
    console.log('\n4. Checking delivery rates...');
    const { data: deliveryRates, error: ratesError } = await supabase
      .from('delivery_rates')
      .select(`
        id,
        pickup_city,
        delivery_city,
        price,
        estimated_min_days,
        estimated_max_days,
        is_active,
        delivery_method:delivery_methods(name)
      `)
      .limit(10);

    if (ratesError) {
      console.error('Error fetching delivery rates:', ratesError);
      return;
    }

    console.log(`Found ${deliveryRates?.length || 0} delivery rates:`);
    deliveryRates?.forEach(dr => {
      console.log(`  - ${dr.pickup_city} → ${dr.delivery_city} (${dr.delivery_method?.name}) - $${dr.price} - Active: ${dr.is_active}`);
    });

    // 5. Check product delivery options
    console.log('\n5. Checking product delivery options...');
    const { data: productDeliveryOptions, error: pdoError } = await supabase
      .from('product_delivery_options')
      .select(`
        id,
        product_id,
        is_free_delivery,
        delivery_rate:delivery_rates(
          id,
          pickup_city,
          delivery_city,
          price,
          delivery_method:delivery_methods(name)
        )
      `)
      .limit(10);

    if (pdoError) {
      console.error('Error fetching product delivery options:', pdoError);
      return;
    }

    console.log(`Found ${productDeliveryOptions?.length || 0} product delivery options:`);
    productDeliveryOptions?.forEach(pdo => {
      if (pdo.delivery_rate) {
        console.log(`  - Product ${pdo.product_id}: ${pdo.delivery_rate.pickup_city} → ${pdo.delivery_rate.delivery_city} (${pdo.delivery_rate.delivery_method?.name}) - $${pdo.delivery_rate.price} ${pdo.is_free_delivery ? '(FREE)' : ''}`);
      }
    });

    // 6. Check product delivery zones
    console.log('\n6. Checking product delivery zones...');
    const { data: deliveryZones, error: zonesError } = await supabase
      .from('product_delivery_zones')
      .select('product_id, city, country, is_allowed')
      .limit(10);

    if (zonesError) {
      console.error('Error fetching delivery zones:', zonesError);
      return;
    }

    console.log(`Found ${deliveryZones?.length || 0} delivery zones:`);
    deliveryZones?.forEach(dz => {
      console.log(`  - Product ${dz.product_id}: ${dz.city}, ${dz.country} (${dz.is_allowed ? 'allowed' : 'blocked'})`);
    });

    // 7. Test the delivery function directly
    if (products.length > 0 && deliveryRates && deliveryRates.length > 0) {
      console.log('\n7. Testing delivery function...');
      const testProduct = products[0];
      const testCity = deliveryRates[0].delivery_city;
      const testCountry = 'Turkey'; // Assuming Turkey for now

      console.log(`Testing delivery for product: ${testProduct.name} to ${testCity}, ${testCountry}`);

      const { data: deliveryOptions, error: deliveryError } = await supabase.rpc(
        'get_cheapest_delivery_option',
        {
          product_uuid: testProduct.id,
          delivery_city: testCity,
          delivery_country: testCountry
        }
      );

      if (deliveryError) {
        console.error('❌ Error calling delivery function:', deliveryError);
      } else if (deliveryOptions && deliveryOptions.length > 0) {
        console.log('✅ Delivery function returned options:');
        deliveryOptions.forEach(option => {
          console.log(`  - Method: ${option.delivery_method_name}`);
          console.log(`  - Pickup: ${option.pickup_city}`);
          console.log(`  - Price: $${option.delivery_price}`);
          console.log(`  - Free: ${option.is_free_delivery}`);
          console.log(`  - Days: ${option.estimated_min_days}-${option.estimated_max_days}`);
        });
      } else {
        console.log('⚠️ Delivery function returned no options');
        
        // Let's check what might be missing
        console.log('\nDebugging why no options were returned:');
        
        // Check if product has delivery zones
        const { data: productZones, error: zonesError2 } = await supabase
          .from('product_delivery_zones')
          .select('*')
          .eq('product_id', testProduct.id)
          .eq('city', testCity)
          .eq('country', testCountry)
          .eq('is_allowed', true);

        if (zonesError2) {
          console.error('Error checking product zones:', zonesError2);
        } else {
          console.log(`Product zones for ${testCity}, ${testCountry}:`, productZones?.length || 0);
        }

        // Check if product has delivery options
        const { data: productOptions, error: optionsError2 } = await supabase
          .from('product_delivery_options')
          .select('*')
          .eq('product_id', testProduct.id);

        if (optionsError2) {
          console.error('Error checking product options:', optionsError2);
        } else {
          console.log(`Product delivery options:`, productOptions?.length || 0);
        }
      }
    }

  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

// Run the debug
debugDeliveryIssue();
