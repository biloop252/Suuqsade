const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDeliveryTestData() {
  console.log('Setting up delivery test data...\n');

  try {
    // 1. Check if we have products
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

    // 2. Check if we have pickup locations
    const { data: pickupLocations, error: pickupError } = await supabase
      .from('pickup_locations')
      .select('id, name, city, country')
      .eq('is_active', true);

    if (pickupError) {
      console.error('Error fetching pickup locations:', pickupError);
      return;
    }

    if (!pickupLocations || pickupLocations.length === 0) {
      console.log('Creating pickup locations...');
      
      const { data: newPickupLocations, error: createPickupError } = await supabase
        .from('pickup_locations')
        .insert([
          {
            name: 'Istanbul Warehouse',
            city: 'Istanbul',
            country: 'Turkey',
            address_line: '123 Main Street, Istanbul',
            contact_phone: '+90 212 123 4567',
            contact_email: 'istanbul@example.com',
            is_active: true
          },
          {
            name: 'Ankara Warehouse',
            city: 'Ankara',
            country: 'Turkey',
            address_line: '456 Business Ave, Ankara',
            contact_phone: '+90 312 987 6543',
            contact_email: 'ankara@example.com',
            is_active: true
          }
        ])
        .select();

      if (createPickupError) {
        console.error('Error creating pickup locations:', createPickupError);
        return;
      }

      console.log(`Created ${newPickupLocations.length} pickup locations`);
    } else {
      console.log(`Found ${pickupLocations.length} existing pickup locations`);
    }

    // 3. Check if we have delivery methods
    const { data: deliveryMethods, error: methodsError } = await supabase
      .from('delivery_methods')
      .select('id, name')
      .eq('is_active', true);

    if (methodsError) {
      console.error('Error fetching delivery methods:', methodsError);
      return;
    }

    if (!deliveryMethods || deliveryMethods.length === 0) {
      console.log('Creating delivery methods...');
      
      const { data: newDeliveryMethods, error: createMethodsError } = await supabase
        .from('delivery_methods')
        .insert([
          {
            name: 'Standard Delivery',
            description: 'Regular delivery service',
            is_active: true
          },
          {
            name: 'Express Delivery',
            description: 'Fast delivery service',
            is_active: true
          }
        ])
        .select();

      if (createMethodsError) {
        console.error('Error creating delivery methods:', createMethodsError);
        return;
      }

      console.log(`Created ${newDeliveryMethods.length} delivery methods`);
    } else {
      console.log(`Found ${deliveryMethods.length} existing delivery methods`);
    }

    // 4. Create delivery rates
    console.log('Creating delivery rates...');
    
    const { data: newDeliveryRates, error: createRatesError } = await supabase
      .from('delivery_rates')
      .insert([
        {
          pickup_city: 'Istanbul',
          delivery_city: 'Ankara',
          delivery_method_id: deliveryMethods[0].id, // Standard Delivery
          price: 15.00,
          estimated_min_days: 2,
          estimated_max_days: 4,
          is_active: true
        },
        {
          pickup_city: 'Istanbul',
          delivery_city: 'Ankara',
          delivery_method_id: deliveryMethods[1].id, // Express Delivery
          price: 25.00,
          estimated_min_days: 1,
          estimated_max_days: 2,
          is_active: true
        },
        {
          pickup_city: 'Istanbul',
          delivery_city: 'Izmir',
          delivery_method_id: deliveryMethods[0].id, // Standard Delivery
          price: 20.00,
          estimated_min_days: 3,
          estimated_max_days: 5,
          is_active: true
        },
        {
          pickup_city: 'Ankara',
          delivery_city: 'Istanbul',
          delivery_method_id: deliveryMethods[0].id, // Standard Delivery
          price: 18.00,
          estimated_min_days: 2,
          estimated_max_days: 4,
          is_active: true
        }
      ])
      .select();

    if (createRatesError) {
      console.error('Error creating delivery rates:', createRatesError);
      return;
    }

    console.log(`Created ${newDeliveryRates.length} delivery rates`);

    // 5. Create product delivery options
    console.log('Creating product delivery options...');
    
    const { data: newProductDeliveryOptions, error: createOptionsError } = await supabase
      .from('product_delivery_options')
      .insert([
        {
          product_id: product.id,
          delivery_rate_id: newDeliveryRates[0].id, // Istanbul to Ankara Standard
          is_free_delivery: false
        },
        {
          product_id: product.id,
          delivery_rate_id: newDeliveryRates[1].id, // Istanbul to Ankara Express
          is_free_delivery: false
        },
        {
          product_id: product.id,
          delivery_rate_id: newDeliveryRates[2].id, // Istanbul to Izmir Standard
          is_free_delivery: false
        }
      ])
      .select();

    if (createOptionsError) {
      console.error('Error creating product delivery options:', createOptionsError);
      return;
    }

    console.log(`Created ${newProductDeliveryOptions.length} product delivery options`);

    // 6. Create delivery zones
    console.log('Creating delivery zones...');
    
    const { data: newDeliveryZones, error: createZonesError } = await supabase
      .from('product_delivery_zones')
      .insert([
        {
          product_id: product.id,
          city: 'Ankara',
          country: 'Turkey',
          is_allowed: true
        },
        {
          product_id: product.id,
          city: 'Izmir',
          country: 'Turkey',
          is_allowed: true
        },
        {
          product_id: product.id,
          city: 'Istanbul',
          country: 'Turkey',
          is_allowed: true
        }
      ])
      .select();

    if (createZonesError) {
      console.error('Error creating delivery zones:', createZonesError);
      return;
    }

    console.log(`Created ${newDeliveryZones.length} delivery zones`);

    // 7. Test the delivery function
    console.log('\nTesting delivery function...');
    
    const { data: deliveryOptions, error: deliveryError } = await supabase.rpc(
      'get_cheapest_delivery_option',
      {
        product_uuid: product.id,
        delivery_city: 'Ankara',
        delivery_country: 'Turkey'
      }
    );

    if (deliveryError) {
      console.error('❌ Error testing delivery function:', deliveryError);
    } else if (deliveryOptions && deliveryOptions.length > 0) {
      console.log('✅ Delivery function is working!');
      console.log('Found delivery options:');
      deliveryOptions.forEach(option => {
        console.log(`  - Method: ${option.delivery_method_name}`);
        console.log(`  - Pickup: ${option.pickup_city}`);
        console.log(`  - Price: $${option.delivery_price}`);
        console.log(`  - Free: ${option.is_free_delivery}`);
        console.log(`  - Days: ${option.estimated_min_days}-${option.estimated_max_days}`);
      });
    } else {
      console.log('⚠️ No delivery options found');
    }

    console.log('\n✅ Test data setup complete!');
    console.log('You can now test the checkout page with shipping to Ankara, Turkey');

  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}

// Run the setup
setupDeliveryTestData();