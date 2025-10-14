// Test script to verify system_images table exists and can be queried
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSystemImagesTable() {
  console.log('Testing system_images table...');
  
  try {
    // Test if table exists by trying to query it
    console.log('1. Testing table existence...');
    const { data: images, error: queryError } = await supabase
      .from('system_images')
      .select('*')
      .limit(1);
    
    if (queryError) {
      console.error('❌ Table query failed:', queryError);
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    console.log('Current images count:', images.length);
    
    // Test inserting a mock record
    console.log('\n2. Testing insert operation...');
    const mockImageData = {
      image_type: 'test',
      image_url: 'https://example.com/test-image.jpg',
      alt_text: 'Test image',
      width: 100,
      height: 100,
      file_size: 1024,
      mime_type: 'image/jpeg',
      is_active: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('system_images')
      .insert([mockImageData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    
    console.log('✅ Insert successful:', insertData);
    
    // Clean up test record
    console.log('\n3. Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('system_images')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
    } else {
      console.log('✅ Test record cleaned up');
    }
    
    console.log('\n✅ All tests passed! The system_images table is working correctly.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testSystemImagesTable();
