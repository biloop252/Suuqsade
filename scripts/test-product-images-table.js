const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductImagesTable() {
  try {
    console.log('Testing product_images table functionality...');
    
    // Test if product_images table exists and has data
    const { data: productImages, error: productImagesError } = await supabase
      .from('product_images')
      .select('*')
      .limit(5);

    if (productImagesError) {
      console.error('❌ Error fetching product_images:', productImagesError);
      return;
    }

    console.log('✅ Product images fetched successfully:');
    productImages.forEach(image => {
      console.log(`  - Product ID: ${image.product_id}`);
      console.log(`    Image URL: ${image.image_url}`);
      console.log(`    Alt Text: ${image.alt_text || 'N/A'}`);
      console.log(`    Is Primary: ${image.is_primary}`);
      console.log(`    Sort Order: ${image.sort_order}`);
      console.log('    ---');
    });

    // Test products with images relationship
    const { data: productsWithImages, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        image_url,
        images:product_images(*)
      `)
      .limit(3);

    if (productsError) {
      console.error('❌ Error fetching products with images:', productsError);
      return;
    }

    console.log('✅ Products with images relationship:');
    productsWithImages.forEach(product => {
      console.log(`  - ${product.name}`);
      if (product.image_url) console.log(`    Main Image: ${product.image_url}`);
      if (product.images && product.images.length > 0) {
        console.log(`    Additional Images: ${product.images.length} images`);
        product.images.forEach((img, index) => {
          console.log(`      ${index + 1}. ${img.image_url} (Primary: ${img.is_primary})`);
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

testProductImagesTable();





