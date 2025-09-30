// Direct admin user creation script
// This creates an admin user directly in the database

const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL' // Replace with your Supabase URL
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY' // Replace with your service role key

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY') {
  console.log('Please update the script with your Supabase credentials:')
  console.log('1. Get your Supabase URL from your project dashboard')
  console.log('2. Get your service role key from Settings > API')
  console.log('3. Replace the values in this script')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    
    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@suuqsade.com',
      password: 'Admin123!',
      email_confirm: true,
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Then create the profile with the same ID
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@suuqsade.com',
        role: 'super_admin',
        is_active: true,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return
    }

    console.log('✅ Profile created successfully!')
    console.log('Admin user created with:')
    console.log('Email: admin@suuqsade.com')
    console.log('Password: Admin123!')
    console.log('Role: super_admin')
    console.log('User ID:', authData.user.id)
    console.log('You can now login at /admin/login')

  } catch (error) {
    console.error('Error:', error)
  }
}

createAdminUser()







