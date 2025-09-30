const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductImages() {
  try {
    console.log('Testing product images functionality...');
    
    // Test if products table has images field
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, image_url, images')
      .limit(3);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    console.log('✅ Products fetched successfully:');
    products.forEach(product => {
      console.log(`  - ${product.name}`);
      if (product.image_url) console.log(`    Main Image: ${product.image_url}`);
      if (product.images && product.images.length > 0) {
        console.log(`    Additional Images: ${product.images.length} images`);
        product.images.forEach((url, index) => {
          console.log(`      ${index + 1}. ${url}`);
        });
      }
    });

    // Test if product-images bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    const productImagesBucket = buckets.find(bucket => bucket.id === 'product-images');
    
    if (productImagesBucket) {
      console.log('✅ product-images bucket exists');
    } else {
      console.log('❌ product-images bucket not found. Please run the migration first.');
      console.log('Run: npx supabase db reset');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testProductImages();





