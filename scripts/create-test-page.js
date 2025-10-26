// Script to create a test page for frontend display
// Run this with: node scripts/create-test-page.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestPage() {
  try {
    console.log('Creating test page...')
    
    const testPage = {
      slug: 'about-us',
      title: 'About Us',
      content: `
        <h2>Welcome to Suuqsade Marketplace</h2>
        <p>We are a leading online marketplace dedicated to providing high-quality products and exceptional customer service.</p>
        
        <h3>Our Mission</h3>
        <p>Our mission is to connect customers with the best products from trusted vendors around the world. We believe in quality, reliability, and customer satisfaction.</p>
        
        <h3>What We Offer</h3>
        <ul>
          <li>Wide selection of products across multiple categories</li>
          <li>Secure payment processing</li>
          <li>Fast and reliable shipping</li>
          <li>24/7 customer support</li>
          <li>Easy returns and exchanges</li>
        </ul>
        
        <h3>Our Values</h3>
        <p>We are committed to:</p>
        <ul>
          <li><strong>Quality:</strong> Only the best products make it to our marketplace</li>
          <li><strong>Trust:</strong> Transparent and honest business practices</li>
          <li><strong>Innovation:</strong> Continuously improving our platform and services</li>
          <li><strong>Customer Focus:</strong> Putting our customers at the center of everything we do</li>
        </ul>
        
        <p>Thank you for choosing Suuqsade Marketplace. We look forward to serving you!</p>
      `,
      meta_title: 'About Us - Suuqsade Marketplace',
      meta_description: 'Learn about Suuqsade Marketplace, our mission, values, and commitment to providing quality products and exceptional customer service.',
      meta_keywords: 'about us, marketplace, quality products, customer service, online shopping',
      page_type: 'static',
      status: 'published',
      is_featured: true,
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

    console.log('✅ Test page created successfully!')
    console.log('Page ID:', data[0].id)
    console.log('Slug:', data[0].slug)
    console.log('Title:', data[0].title)
    console.log('Status:', data[0].status)
    console.log('')
    console.log('You can now view this page at: http://localhost:3001/about-us')

  } catch (error) {
    console.error('Error:', error)
  }
}

createTestPage()



