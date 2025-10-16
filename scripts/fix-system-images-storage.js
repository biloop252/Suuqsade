// Fix script for system-images storage bucket
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSystemImagesStorage() {
  console.log('🔧 Fixing system-images storage bucket...');
  console.log('==========================================\n');
  
  try {
    // 1. Check if bucket exists
    console.log('1. Checking if system-images bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    const systemImagesBucket = buckets.find(b => b.name === 'system-images');
    
    if (!systemImagesBucket) {
      console.log('❌ system-images bucket not found, creating it...');
      
      // Create the bucket using SQL
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
          VALUES (
            'system-images', 
            'system-images', 
            true, 
            5242880, -- 5MB limit
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
          )
          ON CONFLICT (id) DO NOTHING;
        `
      });
      
      if (sqlError) {
        console.error('❌ Error creating bucket via SQL:', sqlError);
        
        // Try alternative method using storage API
        console.log('Trying alternative method...');
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('system-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        });
        
        if (createError) {
          console.error('❌ Error creating bucket via API:', createError);
          console.log('\nManual fix required:');
          console.log('1. Go to your Supabase dashboard');
          console.log('2. Navigate to Storage');
          console.log('3. Create a new bucket named "system-images"');
          console.log('4. Set it as public');
          console.log('5. Set file size limit to 5MB');
          console.log('6. Allow image file types');
          return;
        }
        
        console.log('✅ system-images bucket created via API');
      } else {
        console.log('✅ system-images bucket created via SQL');
      }
    } else {
      console.log('✅ system-images bucket already exists');
    }
    
    // 2. Check storage policies
    console.log('\n2. Checking storage policies...');
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'objects' AND policyname LIKE '%system%';
      `
    });
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log('Current system-related storage policies:', policies);
    }
    
    // 3. Create missing policies if needed
    console.log('\n3. Ensuring storage policies exist...');
    const policyQueries = [
      `CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload system images" ON storage.objects
       FOR INSERT WITH CHECK (
         bucket_id = 'system-images' AND 
         auth.role() = 'authenticated'
       );`,
      `CREATE POLICY IF NOT EXISTS "Allow public access to view system images" ON storage.objects
       FOR SELECT USING (bucket_id = 'system-images');`,
      `CREATE POLICY IF NOT EXISTS "Allow authenticated users to update system images" ON storage.objects
       FOR UPDATE USING (
         bucket_id = 'system-images' AND 
         auth.role() = 'authenticated'
       );`,
      `CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete system images" ON storage.objects
       FOR DELETE USING (
         bucket_id = 'system-images' AND 
         auth.role() = 'authenticated'
       );`
    ];
    
    for (const query of policyQueries) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: query });
      if (policyError) {
        console.error('❌ Error creating policy:', policyError);
      }
    }
    
    console.log('✅ Storage policies ensured');
    
    // 4. Test bucket access
    console.log('\n4. Testing bucket access...');
    const { data: testFiles, error: testError } = await supabase.storage
      .from('system-images')
      .list('system', { limit: 1 });
    
    if (testError) {
      console.error('❌ Error testing bucket access:', testError);
    } else {
      console.log('✅ Bucket access test successful');
    }
    
    // 5. Check system_images table
    console.log('\n5. Checking system_images table...');
    const { data: tableData, error: tableError } = await supabase
      .from('system_images')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing system_images table:', tableError);
    } else {
      console.log('✅ system_images table accessible');
    }
    
    console.log('\n🎉 System images storage setup completed!');
    console.log('\nNext steps:');
    console.log('1. Try uploading a system logo again');
    console.log('2. Check the admin settings page');
    console.log('3. Verify the image appears in the system_images table');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixSystemImagesStorage();


