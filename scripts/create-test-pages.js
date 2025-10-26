// Script to create multiple test pages for frontend display
// Run this with: node scripts/create-test-pages.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestPages() {
  try {
    console.log('Creating test pages...')
    
    const testPages = [
      {
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
      },
      {
        slug: 'contact',
        title: 'Contact Us',
        content: `
          <h2>Get in Touch</h2>
          <p>We'd love to hear from you! Whether you have a question, need support, or want to provide feedback, we're here to help.</p>
          
          <h3>Customer Support</h3>
          <p>Our customer support team is available 24/7 to assist you with any questions or concerns.</p>
          
          <div style="background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin: 1rem 0;">
            <h4>📧 Email Support</h4>
            <p><strong>General Inquiries:</strong> info@suuqsade.com</p>
            <p><strong>Technical Support:</strong> support@suuqsade.com</p>
            <p><strong>Business Partnerships:</strong> partnerships@suuqsade.com</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin: 1rem 0;">
            <h4>📞 Phone Support</h4>
            <p><strong>Customer Service:</strong> +1 (555) 123-4567</p>
            <p><strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST</p>
          </div>
          
          <h3>Response Times</h3>
          <ul>
            <li><strong>Email:</strong> Within 24 hours</li>
            <li><strong>Phone:</strong> Immediate during business hours</li>
            <li><strong>Live Chat:</strong> Available on our website</li>
          </ul>
          
          <h3>Office Address</h3>
          <p>Suuqsade Marketplace<br>
          123 Commerce Street<br>
          Business District<br>
          New York, NY 10001</p>
        `,
        meta_title: 'Contact Us - Suuqsade Marketplace',
        meta_description: 'Contact Suuqsade Marketplace for customer support, general inquiries, or business partnerships. We\'re here to help 24/7.',
        meta_keywords: 'contact us, customer support, help, inquiry, phone, email',
        page_type: 'static',
        status: 'published',
        is_featured: false,
        sort_order: 2
      },
      {
        slug: 'shipping-policy',
        title: 'Shipping Policy',
        content: `
          <h2>Shipping Information</h2>
          <p>We want to make sure your orders arrive safely and on time. Here's everything you need to know about our shipping policies.</p>
          
          <h3>Shipping Methods</h3>
          <div style="background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin: 1rem 0;">
            <h4>🚚 Standard Shipping</h4>
            <p><strong>Delivery Time:</strong> 5-7 business days</p>
            <p><strong>Cost:</strong> $5.99</p>
            <p><strong>Free on orders over $50</strong></p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin: 1rem 0;">
            <h4>⚡ Express Shipping</h4>
            <p><strong>Delivery Time:</strong> 2-3 business days</p>
            <p><strong>Cost:</strong> $12.99</p>
            <p><strong>Free on orders over $100</strong></p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin: 1rem 0;">
            <h4>🏃 Same-Day Delivery</h4>
            <p><strong>Delivery Time:</strong> Same day (select areas)</p>
            <p><strong>Cost:</strong> $19.99</p>
            <p><strong>Available in major metropolitan areas</strong></p>
          </div>
          
          <h3>Processing Time</h3>
          <p>All orders are processed within 1-2 business days. Orders placed on weekends or holidays will be processed on the next business day.</p>
          
          <h3>Tracking Your Order</h3>
          <p>Once your order ships, you'll receive a tracking number via email. You can track your package in real-time using our tracking system.</p>
          
          <h3>International Shipping</h3>
          <p>We ship to most countries worldwide. International shipping times vary by destination:</p>
          <ul>
            <li><strong>Canada:</strong> 7-10 business days</li>
            <li><strong>Europe:</strong> 10-14 business days</li>
            <li><strong>Asia:</strong> 14-21 business days</li>
            <li><strong>Other regions:</strong> 15-25 business days</li>
          </ul>
          
          <h3>Shipping Restrictions</h3>
          <p>Some items may have shipping restrictions due to size, weight, or content. We'll notify you if any restrictions apply to your order.</p>
        `,
        meta_title: 'Shipping Policy - Suuqsade Marketplace',
        meta_description: 'Learn about Suuqsade Marketplace shipping options, delivery times, costs, and international shipping policies.',
        meta_keywords: 'shipping, delivery, policy, tracking, international shipping, express shipping',
        page_type: 'policy',
        status: 'published',
        is_featured: false,
        sort_order: 3
      }
    ]

    for (const page of testPages) {
      const { data, error } = await supabase
        .from('pages')
        .insert(page)
        .select()

      if (error) {
        console.error(`Error creating page "${page.title}":`, error)
        continue
      }

      console.log(`✅ Created page: ${page.title}`)
      console.log(`   Slug: ${page.slug}`)
      console.log(`   URL: http://localhost:3001/${page.slug}`)
      console.log('')
    }

    console.log('🎉 All test pages created successfully!')
    console.log('')
    console.log('You can now view these pages at:')
    console.log('- http://localhost:3001/about-us')
    console.log('- http://localhost:3001/contact')
    console.log('- http://localhost:3001/shipping-policy')

  } catch (error) {
    console.error('Error:', error)
  }
}

createTestPages()



