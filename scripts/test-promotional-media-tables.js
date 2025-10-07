// Simple database test for promotional media
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPromotionalMediaTables() {
  console.log('Testing promotional media database tables...\n');

  try {
    // Test 1: Check if promotional_media table exists
    console.log('1. Testing promotional_media table...');
    const { data: mediaData, error: mediaError } = await supabase
      .from('promotional_media')
      .select('*')
      .limit(1);

    if (mediaError) {
      console.error('❌ promotional_media table error:', mediaError.message);
      if (mediaError.message.includes('relation "promotional_media" does not exist')) {
        console.log('   → Run: supabase db push');
      }
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
      if (categoriesError.message.includes('relation "promotional_media_categories" does not exist')) {
        console.log('   → Run: supabase db push');
      }
    } else {
      console.log('✅ promotional_media_categories table exists');
    }

    // Test 3: Try to insert a test record
    console.log('\n3. Testing insert operation...');
    const testData = {
      title: 'Test Promotional Media',
      subtitle: 'Test Subtitle',
      description: 'Test Description',
      media_type: 'banner',
      banner_position: 'homepage_top',
      display_order: 1,
      background_color: '#ffffff',
      text_color: '#000000',
      is_active: true,
      language_code: 'en'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('promotional_media')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
    } else {
      console.log('✅ Insert test successful');
      
      // Clean up test record
      await supabase
        .from('promotional_media')
        .delete()
        .eq('id', insertData.id);
      console.log('✅ Test record cleaned up');
    }

    console.log('\n🎉 Database test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPromotionalMediaTables();


