const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDeliverySystem() {
  console.log('Testing delivery system...\n');

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

    console.log(`Found ${products.length} products:`, products.map(p => p.name));

    // 2. Check if we have delivery rates
    console.log('\n2. Checking delivery rates...');
    const { data: deliveryRates, error: ratesError } = await supabase
      .from('delivery_rates')
      .select('id, pickup_city, delivery_city, price, estimated_min_days, estimated_max_days')
      .eq('is_active', true)
      .limit(5);

    if (ratesError) {
      console.error('Error fetching delivery rates:', ratesError);
      return;
    }

    console.log(`Found ${deliveryRates.length} delivery rates:`, deliveryRates.map(r => `${r.pickup_city} → ${r.delivery_city} ($${r.price})`));

    // 3. Check if we have product delivery options
    console.log('\n3. Checking product delivery options...');
    const { data: productOptions, error: optionsError } = await supabase
      .from('product_delivery_options')
      .select(`
        id,
        product_id,
        delivery_rate_id,
        is_free_delivery,
        product:products(name),
        delivery_rate:delivery_rates(pickup_city, delivery_city, price)
      `)
      .limit(5);

    if (optionsError) {
      console.error('Error fetching product delivery options:', optionsError);
      return;
    }

    console.log(`Found ${productOptions.length} product delivery options:`, 
      productOptions.map(opt => `${opt.product?.name} → ${opt.delivery_rate?.pickup_city} → ${opt.delivery_rate?.delivery_city}`));

    // 4. Check if we have delivery zones
    console.log('\n4. Checking delivery zones...');
    const { data: deliveryZones, error: zonesError } = await supabase
      .from('product_delivery_zones')
      .select('product_id, city, country, is_allowed')
      .limit(5);

    if (zonesError) {
      console.error('Error fetching delivery zones:', zonesError);
      return;
    }

    console.log(`Found ${deliveryZones.length} delivery zones:`, 
      deliveryZones.map(zone => `${zone.city}, ${zone.country} (${zone.is_allowed ? 'allowed' : 'blocked'})`));

    // 5. Test a specific product delivery calculation
    if (products.length > 0 && deliveryRates.length > 0) {
      console.log('\n5. Testing delivery calculation...');
      const testProduct = products[0];
      const testRate = deliveryRates[0];
      
      console.log(`Testing with product: ${testProduct.name}`);
      console.log(`Testing delivery to: ${testRate.delivery_city}`);

      // Check if there's a product delivery option for this combination
      const { data: testOptions, error: testError } = await supabase
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
        .eq('product_id', testProduct.id)
        .eq('delivery_rate.delivery_city', testRate.delivery_city);

      if (testError) {
        console.error('Error testing delivery options:', testError);
      } else {
        console.log(`Found ${testOptions.length} delivery options for this test`);
        testOptions.forEach((opt, index) => {
          console.log(`  Option ${index + 1}: ${opt.delivery_rate?.pickup_city} → ${opt.delivery_rate?.delivery_city} (${opt.delivery_rate?.delivery_method?.name}) - $${opt.delivery_rate?.price} ${opt.is_free_delivery ? '(FREE)' : ''}`);
        });
      }
    }

    console.log('\n✅ Delivery system test completed!');

  } catch (error) {
    console.error('Error during delivery system test:', error);
  }
}

// Run the test
testDeliverySystem();
