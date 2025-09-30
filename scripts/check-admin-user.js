// Script to check if admin user exists
// Run this with: node scripts/check-admin-user.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAdminUser() {
  try {
    console.log('Checking for admin user...')
    
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@suuqsade.com')

    if (profilesError) {
      console.error('Error checking profiles:', profilesError)
      return
    }

    console.log('Profiles found:', profiles.length)
    if (profiles.length > 0) {
      console.log('Admin profile:', profiles[0])
    }

    // Check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error checking auth users:', authError)
      return
    }

    console.log('Auth users found:', authUsers.users.length)
    const adminAuthUser = authUsers.users.find(user => user.email === 'admin@suuqsade.com')
    
    if (adminAuthUser) {
      console.log('Admin auth user found:', {
        id: adminAuthUser.id,
        email: adminAuthUser.email,
        created_at: adminAuthUser.created_at
      })
    } else {
      console.log('No admin auth user found')
    }

    // Check if profile and auth user IDs match
    if (profiles.length > 0 && adminAuthUser) {
      if (profiles[0].id === adminAuthUser.id) {
        console.log('✅ Profile and auth user IDs match!')
      } else {
        console.log('❌ Profile and auth user IDs do not match!')
        console.log('Profile ID:', profiles[0].id)
        console.log('Auth User ID:', adminAuthUser.id)
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

checkAdminUser()







