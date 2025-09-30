const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCategoryImages() {
  try {
    console.log('Adding image_url column to categories table...');
    
    // Add the image_url column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;'
    });

    if (alterError) {
      console.error('Error adding column:', alterError);
      return;
    }

    console.log('Column added successfully!');

    // Add sample images to existing categories
    const sampleImages = {
      'Electronics': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      'Clothing': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      'Home & Garden': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      'Sports': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      'Books': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      'Beauty': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      'Toys': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      'Automotive': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'
    };

    console.log('Adding sample images to categories...');
    
    for (const [categoryName, imageUrl] of Object.entries(sampleImages)) {
      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: imageUrl })
        .eq('name', categoryName);

      if (updateError) {
        console.error(`Error updating ${categoryName}:`, updateError);
      } else {
        console.log(`Updated ${categoryName} with image`);
      }
    }

    console.log('Category images added successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addCategoryImages();





