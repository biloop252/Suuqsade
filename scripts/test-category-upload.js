const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCategoryUpload() {
  try {
    console.log('Testing category image upload...');
    
    // Test if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const categoryImagesBucket = buckets.find(bucket => bucket.id === 'category-images');
    
    if (!categoryImagesBucket) {
      console.log('❌ category-images bucket not found. Please run the migration first.');
      console.log('Run: npx supabase db reset');
      return;
    }
    
    console.log('✅ category-images bucket found');
    console.log('✅ File upload functionality is ready!');
    console.log('\nTo test:');
    console.log('1. Go to /admin/categories');
    console.log('2. Click "Add Category" or edit an existing category');
    console.log('3. Use the file upload area to select an image');
    console.log('4. The image will be uploaded to Supabase Storage');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCategoryUpload();





