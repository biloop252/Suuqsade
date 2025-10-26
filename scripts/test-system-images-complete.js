// Comprehensive test for system images functionality
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSystemImagesFunctionality() {
  console.log('🧪 Testing System Images Functionality');
  console.log('=====================================\n');
  
  try {
    // 1. Test bucket existence
    console.log('1. Testing storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    const systemImagesBucket = buckets.find(b => b.name === 'system-images');
    if (!systemImagesBucket) {
      console.error('❌ system-images bucket not found!');
      console.log('Run: node scripts/fix-system-images-storage.js');
      return;
    }
    
    console.log('✅ system-images bucket exists');
    console.log('   - Public:', systemImagesBucket.public);
    console.log('   - File size limit:', systemImagesBucket.file_size_limit);
    console.log('   - Allowed types:', systemImagesBucket.allowed_mime_types);
    
    // 2. Test table existence
    console.log('\n2. Testing system_images table...');
    const { data: tableData, error: tableError } = await supabase
      .from('system_images')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing system_images table:', tableError);
      return;
    }
    
    console.log('✅ system_images table accessible');
    
    // 3. Test storage policies
    console.log('\n3. Testing storage policies...');
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'objects' AND policyname LIKE '%system%';
      `
    });
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log('✅ Storage policies found:', policies.length);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    // 4. Test file upload (simulation)
    console.log('\n4. Testing file upload simulation...');
    const testFile = new File(['test content'], 'test-logo.png', { type: 'image/png' });
    const testPath = `system/test-logo_${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('system-images')
      .upload(testPath, testFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      console.log('This indicates permission issues with the storage bucket');
    } else {
      console.log('✅ Upload test successful');
      console.log('   - Path:', uploadData.path);
      
      // Clean up test file
      await supabase.storage.from('system-images').remove([testPath]);
      console.log('   - Test file cleaned up');
    }
    
    // 5. Test database insert
    console.log('\n5. Testing database insert...');
    const testImageData = {
      image_type: 'logo',
      image_url: 'https://example.com/test-logo.png',
      alt_text: 'Test Logo',
      width: 200,
      height: 100,
      file_size: 1024,
      mime_type: 'image/png',
      is_active: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('system_images')
      .insert(testImageData)
      .select();
    
    if (insertError) {
      console.error('❌ Database insert test failed:', insertError);
    } else {
      console.log('✅ Database insert test successful');
      console.log('   - Inserted ID:', insertData[0].id);
      
      // Clean up test record
      await supabase
        .from('system_images')
        .delete()
        .eq('id', insertData[0].id);
      console.log('   - Test record cleaned up');
    }
    
    // 6. Test API endpoint simulation
    console.log('\n6. Testing API endpoint simulation...');
    const { data: apiTestData, error: apiTestError } = await supabase
      .from('system_images')
      .select('*')
      .eq('is_active', true)
      .order('image_type', { ascending: true });
    
    if (apiTestError) {
      console.error('❌ API simulation test failed:', apiTestError);
    } else {
      console.log('✅ API simulation test successful');
      console.log('   - Found', apiTestData.length, 'active images');
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\nIf all tests passed, the system images functionality should work correctly.');
    console.log('If any tests failed, check the error messages above for specific issues.');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testSystemImagesFunctionality();








