// Database check script for promotional media system
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseTables() {
  console.log('Checking promotional media database tables...\n');

  try {
    // Check if promotional_media table exists
    console.log('1. Checking promotional_media table...');
    const { data: mediaData, error: mediaError } = await supabase
      .from('promotional_media')
      .select('*')
      .limit(1);

    if (mediaError) {
      if (mediaError.message.includes('relation "promotional_media" does not exist')) {
        console.log('❌ promotional_media table does not exist');
        console.log('   → Run migration 051: supabase db push');
      } else {
        console.error('❌ promotional_media table error:', mediaError.message);
      }
    } else {
      console.log('✅ promotional_media table exists');
      console.log(`   → Found ${mediaData?.length || 0} records`);
    }

    // Check if promotional_media_categories table exists
    console.log('\n2. Checking promotional_media_categories table...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('promotional_media_categories')
      .select('*')
      .limit(1);

    if (categoriesError) {
      if (categoriesError.message.includes('relation "promotional_media_categories" does not exist')) {
        console.log('❌ promotional_media_categories table does not exist');
        console.log('   → Run migration 051: supabase db push');
      } else {
        console.error('❌ promotional_media_categories table error:', categoriesError.message);
      }
    } else {
      console.log('✅ promotional_media_categories table exists');
      console.log(`   → Found ${categoriesData?.length || 0} records`);
    }

    // Check if categories table exists (for the form)
    console.log('\n3. Checking categories table...');
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (catError) {
      console.error('❌ categories table error:', catError.message);
    } else {
      console.log('✅ categories table exists');
      console.log(`   → Found ${catData?.length || 0} records`);
    }

    // Check database functions
    console.log('\n4. Checking database functions...');
    const { data: functionData, error: functionError } = await supabase
      .rpc('get_active_promotional_media', {
        position_param: 'homepage_top',
        language_param: 'en'
      });

    if (functionError) {
      if (functionError.message.includes('function get_active_promotional_media')) {
        console.log('❌ Database functions not found');
        console.log('   → Run migration 051: supabase db push');
      } else {
        console.error('❌ Database function error:', functionError.message);
      }
    } else {
      console.log('✅ Database functions work correctly');
    }

    console.log('\n📋 Summary:');
    if (mediaError || categoriesError) {
      console.log('❌ Database tables missing - Run migrations first');
      console.log('   Command: supabase db push');
    } else {
      console.log('✅ Database tables exist - System ready to use');
      console.log('   Navigate to: /admin/promotional-media');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabaseTables();









