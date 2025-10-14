// Test script to verify system-images storage bucket exists and is accessible
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStorageBucket() {
  console.log('Testing system-images storage bucket...');
  
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    const systemImagesBucket = buckets.find(b => b.name === 'system-images');
    
    if (!systemImagesBucket) {
      console.error('❌ system-images bucket not found!');
      console.log('Creating system-images bucket...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('system-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
      
      console.log('✅ system-images bucket created successfully');
    } else {
      console.log('✅ system-images bucket exists');
      console.log('Bucket details:', systemImagesBucket);
    }
    
    // Test upload permissions
    console.log('\nTesting upload permissions...');
    
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('system-images')
      .upload('test/test.txt', testFile);
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
    } else {
      console.log('✅ Upload test successful:', uploadData);
      
      // Clean up test file
      await supabase.storage.from('system-images').remove(['test/test.txt']);
      console.log('✅ Test file cleaned up');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testStorageBucket();
