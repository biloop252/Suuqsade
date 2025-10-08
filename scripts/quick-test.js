// Quick test to verify promotional media tables exist
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickTest() {
  console.log('Quick test of promotional media tables...\n');

  try {
    // Test promotional_media table
    const { data, error } = await supabase
      .from('promotional_media')
      .select('id, title, media_type')
      .limit(1);

    if (error) {
      console.error('❌ promotional_media table error:', error.message);
      console.log('\n🔧 Solution:');
      console.log('1. Go to your Supabase Dashboard → SQL Editor');
      console.log('2. Copy and paste the contents of scripts/create-promotional-media-tables.sql');
      console.log('3. Run the SQL script');
      console.log('4. Try again');
    } else {
      console.log('✅ promotional_media table exists');
      console.log(`   Found ${data?.length || 0} records`);
      
      // Test insert
      const testData = {
        title: 'Test Banner',
        media_type: 'banner',
        banner_position: 'homepage_top',
        display_order: 999,
        is_active: true
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
        
        // Clean up
        await supabase
          .from('promotional_media')
          .delete()
          .eq('id', insertData.id);
        console.log('✅ Test record cleaned up');
        
        console.log('\n🎉 Promotional media system is ready!');
        console.log('Navigate to: /admin/promotional-media');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest();



