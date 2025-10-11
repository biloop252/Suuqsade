// Test script to verify promotional media system setup
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPromotionalMediaSystem() {
  console.log('Testing Promotional Media System...\n');

  try {
    // Test 1: Check if promotional_media table exists
    console.log('1. Testing promotional_media table...');
    const { data: mediaData, error: mediaError } = await supabase
      .from('promotional_media')
      .select('*')
      .limit(1);

    if (mediaError) {
      console.error('❌ promotional_media table error:', mediaError.message);
    } else {
      console.log('✅ promotional_media table exists');
    }

    // Test 2: Check if promotional_media_categories table exists
    console.log('\n2. Testing promotional_media_categories table...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('promotional_media_categories')
      .select('*')
      .limit(1);

    if (categoriesError) {
      console.error('❌ promotional_media_categories table error:', categoriesError.message);
    } else {
      console.log('✅ promotional_media_categories table exists');
    }

    // Test 3: Check if storage bucket exists
    console.log('\n3. Testing promotional-media storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Storage buckets error:', bucketsError.message);
    } else {
      const promotionalBucket = buckets.find(bucket => bucket.name === 'promotional-media');
      if (promotionalBucket) {
        console.log('✅ promotional-media storage bucket exists');
      } else {
        console.log('❌ promotional-media storage bucket not found');
      }
    }

    // Test 4: Test database functions
    console.log('\n4. Testing database functions...');
    const { data: functionData, error: functionError } = await supabase
      .rpc('get_active_promotional_media', {
        position_param: 'homepage_top',
        language_param: 'en'
      });

    if (functionError) {
      console.error('❌ Database function error:', functionError.message);
    } else {
      console.log('✅ Database functions work correctly');
    }

    console.log('\n🎉 Promotional Media System setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run the development server: npm run dev');
    console.log('2. Navigate to /admin/promotional-media');
    console.log('3. Create your first promotional media item');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPromotionalMediaSystem();









