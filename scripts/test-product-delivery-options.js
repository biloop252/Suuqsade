const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductDeliveryOptions() {
  console.log('Testing Product Delivery Options Creation...\n');

  try {
    // 1. Check if we have products
    console.log('1. Checking products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('is_active', true)
      .limit(5);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    console.log(`Found ${products.length} products:`);
    products.forEach(product => {
      console.log(`  - ${product.name} (${product.id})`);
    });

    // 2. Check pickup locations
    console.log('\n2. Checking pickup locations...');
    const { data: pickupLocations, error: pickupError } = await supabase
      .from('pickup_locations')
      .select('id, name, city, country')
      .eq('is_active', true);

    if (pickupError) {
      console.error('Error fetching pickup locations:', pickupError);
      return;
    }

    console.log(`Found ${pickupLocations.length} pickup locations:`);
    pickupLocations.forEach(location => {
      console.log(`  - ${location.name} (${location.city}, ${location.country})`);
    });

    // 3. Check delivery methods
    console.log('\n3. Checking delivery methods...');
    const { data: deliveryMethods, error: methodsError } = await supabase
      .from('delivery_methods')
      .select('id, name')
      .eq('is_active', true);

    if (methodsError) {
      console.error('Error fetching delivery methods:', methodsError);
      return;
    }

    console.log(`Found ${deliveryMethods.length} delivery methods:`);
    deliveryMethods.forEach(method => {
      console.log(`  - ${method.name} (${method.id})`);
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
        delivery_method_id,
        delivery_method:delivery_methods(name)
      `)
      .eq('is_active', true)
      .limit(10);

    if (ratesError) {
      console.error('Error fetching delivery rates:', ratesError);
      return;
    }

    console.log(`Found ${deliveryRates.length} delivery rates:`);
    deliveryRates.forEach(rate => {
      console.log(`  - ${rate.pickup_city} → ${rate.delivery_city} (${rate.delivery_method?.name}) - $${rate.price}`);
    });

    // 5. Check existing product delivery options
    console.log('\n5. Checking existing product delivery options...');
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

    console.log(`Found ${productDeliveryOptions.length} product delivery options:`);
    productDeliveryOptions.forEach(option => {
      if (option.delivery_rate) {
        console.log(`  - Product ${option.product_id}: ${option.delivery_rate.pickup_city} → ${option.delivery_rate.delivery_city} (${option.delivery_rate.delivery_method?.name}) - $${option.delivery_rate.price} ${option.is_free_delivery ? '(FREE)' : ''}`);
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

    console.log(`Found ${deliveryZones.length} delivery zones:`);
    deliveryZones.forEach(zone => {
      console.log(`  - Product ${zone.product_id}: ${zone.city}, ${zone.country} (${zone.is_allowed ? 'allowed' : 'blocked'})`);
    });

    // 7. Test creating a product delivery option (simulation)
    console.log('\n7. Testing product delivery option creation logic...');
    
    if (products.length > 0 && pickupLocations.length > 0 && deliveryMethods.length > 0 && deliveryRates.length > 0) {
      const testProduct = products[0];
      const testPickupLocation = pickupLocations[0];
      const testDeliveryMethods = deliveryMethods.slice(0, 2); // Take first 2 methods
      
      console.log(`\nSimulating creation for product: ${testProduct.name}`);
      console.log(`Pickup location: ${testPickupLocation.name} (${testPickupLocation.city})`);
      console.log(`Delivery methods: ${testDeliveryMethods.map(m => m.name).join(', ')}`);

      // Find matching delivery rates
      const { data: matchingRates, error: matchingError } = await supabase
        .from('delivery_rates')
        .select('id, delivery_method_id, delivery_city, price')
        .eq('pickup_city', testPickupLocation.city)
        .in('delivery_method_id', testDeliveryMethods.map(m => m.id))
        .eq('is_active', true);

      if (matchingError) {
        console.error('Error finding matching delivery rates:', matchingError);
        return;
      }

      console.log(`\nFound ${matchingRates.length} matching delivery rates:`);
      matchingRates.forEach(rate => {
        const method = testDeliveryMethods.find(m => m.id === rate.delivery_method_id);
        console.log(`  - ${rate.delivery_city} (${method?.name}) - $${rate.price}`);
      });

      if (matchingRates.length > 0) {
        console.log('\n✅ Product delivery options can be created successfully!');
        console.log('The system will create the following product_delivery_options:');
        matchingRates.forEach(rate => {
          console.log(`  - product_id: ${testProduct.id}`);
          console.log(`  - delivery_rate_id: ${rate.id}`);
          console.log(`  - is_free_delivery: false`);
          console.log('  ---');
        });
      } else {
        console.log('\n❌ No matching delivery rates found for the test scenario');
        console.log('This means the product delivery options cannot be created with the current data');
      }
    } else {
      console.log('\n❌ Insufficient data to test product delivery option creation');
    }

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testProductDeliveryOptions();
