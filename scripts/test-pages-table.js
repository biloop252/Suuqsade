// Test script to check pages table and data
const { createClient } = require('@supabase/supabase-js');

async function testPagesTable() {
  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Supabase connection error:', testError);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test pages table existence
    console.log('Testing pages table...');
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .limit(5);
    
    if (pagesError) {
      console.error('❌ Pages table error:', pagesError);
      console.log('This means the migration was not applied or there is an issue with the table structure.');
      return;
    }
    
    console.log('✅ Pages table exists and is accessible');
    console.log('📄 Found pages:', pages?.length || 0);
    
    if (pages && pages.length > 0) {
      console.log('Sample page:', {
        id: pages[0].id,
        title: pages[0].title,
        slug: pages[0].slug,
        status: pages[0].status
      });
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

testPagesTable();

