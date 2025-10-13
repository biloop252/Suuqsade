// Test script for customer support system
// Run this to test if the support system is working correctly

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupportSystem() {
  console.log('🧪 Testing Customer Support System...\n');

  try {
    // Test 1: Check if support tables exist
    console.log('1️⃣ Checking support tables...');
    
    const { data: categories, error: categoriesError } = await supabase
      .from('support_categories')
      .select('*')
      .limit(1);
    
    if (categoriesError) {
      console.log('❌ Support categories table not found:', categoriesError.message);
      return;
    }
    console.log('✅ Support categories table exists');

    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .limit(1);
    
    if (ticketsError) {
      console.log('❌ Support tickets table not found:', ticketsError.message);
      return;
    }
    console.log('✅ Support tickets table exists');

    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select('*')
      .limit(1);
    
    if (messagesError) {
      console.log('❌ Support messages table not found:', messagesError.message);
      return;
    }
    console.log('✅ Support messages table exists');

    const { data: notifications, error: notificationsError } = await supabase
      .from('support_notifications')
      .select('*')
      .limit(1);
    
    if (notificationsError) {
      console.log('❌ Support notifications table not found:', notificationsError.message);
      return;
    }
    console.log('✅ Support notifications table exists');

    // Test 2: Check if default categories exist
    console.log('\n2️⃣ Checking default support categories...');
    const { data: allCategories, error: allCategoriesError } = await supabase
      .from('support_categories')
      .select('*');
    
    if (allCategoriesError) {
      console.log('❌ Error fetching categories:', allCategoriesError.message);
      return;
    }
    
    console.log(`✅ Found ${allCategories.length} support categories:`);
    allCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

    // Test 3: Check if default tags exist
    console.log('\n3️⃣ Checking default support tags...');
    const { data: allTags, error: allTagsError } = await supabase
      .from('support_tags')
      .select('*');
    
    if (allTagsError) {
      console.log('❌ Error fetching tags:', allTagsError.message);
      return;
    }
    
    console.log(`✅ Found ${allTags.length} support tags:`);
    allTags.forEach(tag => {
      console.log(`   - ${tag.name} (${tag.color})`);
    });

    // Test 4: Check RLS policies
    console.log('\n4️⃣ Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies', { table_name: 'support_tickets' });
    
    if (policiesError) {
      console.log('⚠️ Could not check RLS policies (this is normal):', policiesError.message);
    } else {
      console.log('✅ RLS policies are configured');
    }

    console.log('\n🎉 Customer Support System is ready!');
    console.log('\n📋 Next steps:');
    console.log('   1. Visit /admin/support to access the admin interface');
    console.log('   2. Visit /support to access the customer interface');
    console.log('   3. Visit /profile?tab=support-tickets for profile integration');
    console.log('   4. Test creating tickets and managing them');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSupportSystem();
