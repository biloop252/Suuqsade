// Script to create a simple test page with published status
// Run this with: node scripts/create-simple-test-page.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSimpleTestPage() {
  try {
    console.log('Creating simple test page...')
    
    const testPage = {
      slug: 'test-page',
      title: 'Test Page',
      content: `
        <h2>Welcome to Our Test Page</h2>
        <p>This is a simple test page to verify that the frontend page display system is working correctly.</p>
        
        <h3>What This Page Tests</h3>
        <ul>
          <li>Page creation in the database</li>
          <li>API endpoint functionality</li>
          <li>Frontend page rendering</li>
          <li>SEO meta tags</li>
        </ul>
        
        <p>If you can see this page, then the pages management system is working properly!</p>
      `,
      meta_title: 'Test Page - Suuqsade Marketplace',
      meta_description: 'A simple test page to verify the pages management system is working correctly.',
      meta_keywords: 'test, page, verification',
      page_type: 'static',
      status: 'published', // Make sure it's published
      is_featured: false,
      sort_order: 1
    }

    const { data, error } = await supabase
      .from('pages')
      .insert(testPage)
      .select()

    if (error) {
      console.error('Error creating test page:', error)
      return
    }

    console.log('✅ Simple test page created successfully!')
    console.log('Page ID:', data[0].id)
    console.log('Slug:', data[0].slug)
    console.log('Title:', data[0].title)
    console.log('Status:', data[0].status)
    console.log('')
    console.log('You can now view this page at: http://localhost:3001/test-page')

  } catch (error) {
    console.error('Error:', error)
  }
}

createSimpleTestPage()



