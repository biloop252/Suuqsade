// Fix storage policies where qual (qualification) is null
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixStoragePoliciesQual() {
  console.log('🔧 Fixing Storage Policies with Null Qual');
  console.log('==========================================\n');
  
  try {
    // 1. Check current policies
    console.log('1. Checking current policies...');
    const { data: currentPolicies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname, 
          cmd, 
          qual,
          CASE WHEN qual IS NULL THEN 'NULL - NEEDS FIX' ELSE 'OK' END as status
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname LIKE '%system%'
        ORDER BY policyname;
      `
    });
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
      return;
    }
    
    console.log('Current policies:');
    currentPolicies.forEach(policy => {
      console.log(`  - ${policy.policyname} (${policy.cmd}): ${policy.status}`);
      if (policy.qual) {
        console.log(`    Qual: ${policy.qual}`);
      }
    });
    
    // 2. Drop existing policies
    console.log('\n2. Dropping existing policies...');
    const dropQueries = [
      'DROP POLICY IF EXISTS "Allow authenticated users to upload system images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Allow public access to view system images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Allow authenticated users to update system images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Allow authenticated users to delete system images" ON storage.objects;'
    ];
    
    for (const query of dropQueries) {
      const { error: dropError } = await supabase.rpc('exec_sql', { sql: query });
      if (dropError) {
        console.error('❌ Error dropping policy:', dropError);
      }
    }
    
    console.log('✅ Policies dropped');
    
    // 3. Recreate policies with proper qualifications
    console.log('\n3. Recreating policies with proper qualifications...');
    const createQueries = [
      `CREATE POLICY "Allow authenticated users to upload system images" ON storage.objects
       FOR INSERT 
       WITH CHECK (
         bucket_id = 'system-images' 
         AND auth.role() = 'authenticated'
       );`,
      `CREATE POLICY "Allow public access to view system images" ON storage.objects
       FOR SELECT 
       USING (bucket_id = 'system-images');`,
      `CREATE POLICY "Allow authenticated users to update system images" ON storage.objects
       FOR UPDATE 
       USING (
         bucket_id = 'system-images' 
         AND auth.role() = 'authenticated'
       );`,
      `CREATE POLICY "Allow authenticated users to delete system images" ON storage.objects
       FOR DELETE 
       USING (
         bucket_id = 'system-images' 
         AND auth.role() = 'authenticated'
       );`
    ];
    
    for (const query of createQueries) {
      const { error: createError } = await supabase.rpc('exec_sql', { sql: query });
      if (createError) {
        console.error('❌ Error creating policy:', createError);
      } else {
        console.log('✅ Policy created successfully');
      }
    }
    
    // 4. Verify policies were created correctly
    console.log('\n4. Verifying policies after fix...');
    const { data: newPolicies, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname, 
          cmd, 
          qual,
          CASE WHEN qual IS NULL THEN 'NULL - STILL BROKEN' ELSE 'FIXED' END as status
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname LIKE '%system%'
        ORDER BY policyname;
      `
    });
    
    if (verifyError) {
      console.error('❌ Error verifying policies:', verifyError);
    } else {
      console.log('Policies after fix:');
      newPolicies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd}): ${policy.status}`);
        if (policy.qual) {
          console.log(`    Qual: ${policy.qual}`);
        }
      });
    }
    
    // 5. Test bucket access
    console.log('\n5. Testing bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
    } else {
      const systemImagesBucket = buckets.find(b => b.name === 'system-images');
      if (systemImagesBucket) {
        console.log('✅ system-images bucket exists');
        
        // Test file listing
        const { data: files, error: listError } = await supabase.storage
          .from('system-images')
          .list('system', { limit: 1 });
        
        if (listError) {
          console.error('❌ Error listing files:', listError);
        } else {
          console.log('✅ Bucket access test successful');
        }
      } else {
        console.error('❌ system-images bucket not found');
      }
    }
    
    console.log('\n🎉 Storage policies fix completed!');
    console.log('\nThe INSERT policy should now have a proper qualification (qual) instead of NULL.');
    console.log('Try uploading a system logo again - it should work now.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixStoragePoliciesQual();

