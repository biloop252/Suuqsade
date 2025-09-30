const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProductSave() {
  try {
    console.log('🔍 Debugging product save functionality...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');
    
    // Test 1: Check if products table exists and is accessible
    console.log('\n1. Testing products table access...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);

    if (productsError) {
      console.error('❌ Products table error:', productsError);
    } else {
      console.log('✅ Products table accessible');
    }

    // Test 2: Check if product_images table exists
    console.log('\n2. Testing product_images table access...');
    const { data: productImages, error: productImagesError } = await supabase
      .from('product_images')
      .select('id, product_id')
      .limit(1);

    if (productImagesError) {
      console.error('❌ Product_images table error:', productImagesError);
    } else {
      console.log('✅ Product_images table accessible');
    }

    // Test 3: Check if categories table exists (for foreign key)
    console.log('\n3. Testing categories table access...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    if (categoriesError) {
      console.error('❌ Categories table error:', categoriesError);
    } else {
      console.log('✅ Categories table accessible');
    }

    // Test 4: Check if brands table exists (for foreign key)
    console.log('\n4. Testing brands table access...');
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name')
      .limit(1);

    if (brandsError) {
      console.error('❌ Brands table error:', brandsError);
    } else {
      console.log('✅ Brands table accessible');
    }

    // Test 5: Try to create a test product
    console.log('\n5. Testing product creation...');
    const testProduct = {
      name: 'Test Product Debug',
      slug: 'test-product-debug',
      description: 'Test product for debugging',
      price: 10.00,
      stock_quantity: 10,
      min_stock_level: 5,
      is_active: true,
      is_featured: false
    };

    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert([testProduct])
      .select()
      .single();

    if (createError) {
      console.error('❌ Product creation error:', createError);
    } else {
      console.log('✅ Product created successfully:', newProduct.id);
      
      // Clean up test product
      await supabase
        .from('products')
        .delete()
        .eq('id', newProduct.id);
      console.log('✅ Test product cleaned up');
    }

    // Test 6: Check storage bucket
    console.log('\n6. Testing storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage buckets error:', bucketsError);
    } else {
      const productImagesBucket = buckets.find(bucket => bucket.id === 'product-images');
      if (productImagesBucket) {
        console.log('✅ product-images bucket exists');
      } else {
        console.log('❌ product-images bucket not found');
        console.log('Available buckets:', buckets.map(b => b.id));
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugProductSave();





