// Simple script to create admin user
// Run this with: node scripts/create-admin-user-simple.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
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







