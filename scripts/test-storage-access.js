// Test script to check storage bucket access
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testStorageBucket() {
  console.log('🔍 Testing Storage Bucket Access');
  console.log('================================\n');
  
  try {
    console.log('1. Listing all storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Buckets retrieved successfully');
    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (ID: ${bucket.id}, Public: ${bucket.public})`);
    });
    
    console.log('\n2. Looking for system-images bucket...');
    const systemImagesBucket = buckets.find(b => b.name === 'system-images');
    
    if (!systemImagesBucket) {
      console.error('❌ system-images bucket not found!');
      console.log('\nPossible solutions:');
      console.log('1. Run migration 070: supabase db push');
      console.log('2. Check if the bucket was created with a different name');
      console.log('3. Verify you have the correct Supabase project');
      return;
    }
    
    console.log('✅ system-images bucket found!');
    console.log('Bucket details:', {
      id: systemImagesBucket.id,
      name: systemImagesBucket.name,
      public: systemImagesBucket.public,
      fileSizeLimit: systemImagesBucket.file_size_limit,
      allowedMimeTypes: systemImagesBucket.allowed_mime_types
    });
    
    console.log('\n3. Testing bucket permissions...');
    
    // Test if we can list files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('system-images')
      .list('system', { limit: 1 });
    
    if (listError) {
      console.error('❌ Error listing files:', listError);
      console.log('This might indicate permission issues with the anon key');
    } else {
      console.log('✅ Can list files in bucket');
      console.log('Files in system folder:', files.length);
    }
    
    console.log('\n✅ Storage bucket test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testStorageBucket();
