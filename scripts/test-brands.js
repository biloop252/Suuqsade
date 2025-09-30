const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBrands() {
  try {
    console.log('Testing brands functionality...');
    
    // Test if brands table exists and has data
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .limit(5);

    if (brandsError) {
      console.error('❌ Error fetching brands:', brandsError);
      return;
    }

    console.log('✅ Brands fetched successfully:');
    brands.forEach(brand => {
      console.log(`  - ${brand.name} (${brand.slug})`);
      if (brand.website_url) console.log(`    Website: ${brand.website_url}`);
      if (brand.logo_url) console.log(`    Logo: ${brand.logo_url}`);
    });

    // Test if brand-logos bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    const brandLogosBucket = buckets.find(bucket => bucket.id === 'brand-logos');
    
    if (brandLogosBucket) {
      console.log('✅ brand-logos bucket exists');
    } else {
      console.log('❌ brand-logos bucket not found. Please run the migration first.');
      console.log('Run: npx supabase db reset');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBrands();





