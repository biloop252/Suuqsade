// Script to update all draft pages to published status
// Run this with: node scripts/publish-all-pages.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function publishAllPages() {
  try {
    console.log('🔍 Checking all pages in database...')
    
    // Get all pages
    const { data: allPages, error: fetchError } = await supabase
      .from('pages')
      .select('*')

    if (fetchError) {
      console.error('❌ Error fetching pages:', fetchError)
      return
    }

    console.log(`✅ Found ${allPages?.length || 0} total pages`)

    if (!allPages || allPages.length === 0) {
      console.log('❌ No pages found in database')
      return
    }

    // Show current status
    console.log('\n📋 Current page statuses:')
    allPages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.title} - Status: ${page.status}`)
    })

    // Update all pages to published status
    console.log('\n🔄 Updating all pages to published status...')
    
    const { data: updatedPages, error: updateError } = await supabase
      .from('pages')
      .update({ status: 'published' })
      .select()

    if (updateError) {
      console.error('❌ Error updating pages:', updateError)
      return
    }

    console.log(`✅ Successfully updated ${updatedPages?.length || 0} pages to published status`)
    
    console.log('\n📋 Updated pages:')
    updatedPages?.forEach((page, index) => {
      console.log(`${index + 1}. ${page.title} (${page.slug}) - Status: ${page.status}`)
    })

    console.log('\n🎉 All pages are now published!')
    console.log('You can now view them on the frontend:')
    updatedPages?.forEach(page => {
      console.log(`- http://localhost:3001/${page.slug}`)
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

publishAllPages()



