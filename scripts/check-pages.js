// Script to check existing pages in database
// Run this with: node scripts/check-pages.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPages() {
  try {
    console.log('🔍 Checking all pages in database...')
    
    // Get all pages regardless of status
    const { data: allPages, error: allError } = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Error fetching all pages:', allError)
      return
    }

    console.log(`✅ Found ${allPages?.length || 0} total pages in database:`)
    console.log('')

    if (allPages && allPages.length > 0) {
      allPages.forEach((page, index) => {
        console.log(`${index + 1}. ${page.title}`)
        console.log(`   Slug: ${page.slug}`)
        console.log(`   Status: ${page.status}`)
        console.log(`   Type: ${page.page_type}`)
        console.log(`   Featured: ${page.is_featured}`)
        console.log(`   Created: ${page.created_at}`)
        console.log(`   Updated: ${page.updated_at}`)
        console.log('')
      })
    } else {
      console.log('❌ No pages found in database')
    }

    // Check published pages specifically
    console.log('🔍 Checking published pages only...')
    const { data: publishedPages, error: publishedError } = await supabase
      .from('pages')
      .select('*')
      .eq('status', 'published')

    if (publishedError) {
      console.error('❌ Error fetching published pages:', publishedError)
    } else {
      console.log(`✅ Found ${publishedPages?.length || 0} published pages`)
      if (publishedPages && publishedPages.length > 0) {
        publishedPages.forEach((page, index) => {
          console.log(`${index + 1}. ${page.title} (${page.slug})`)
        })
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

checkPages()



