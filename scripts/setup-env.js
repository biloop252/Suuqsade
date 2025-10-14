// Script to help set up environment variables
const fs = require('fs');
const path = require('path');

console.log('🔧 Supabase Environment Setup');
console.log('=============================\n');

console.log('To fix the "supabaseKey is required" error, you need to create a .env.local file with your Supabase credentials.\n');

console.log('1. Create a file named .env.local in your project root');
console.log('2. Add the following content:\n');

const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service Role Key (for admin operations)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`;

console.log(envContent);
console.log('\n3. Replace the placeholder values with your actual Supabase project values');
console.log('4. You can find these values in your Supabase Dashboard > Settings > API');
console.log('\n5. Restart your development server after creating the .env.local file');

// Check if .env.local already exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('\n✅ .env.local file already exists!');
  console.log('If you\'re still getting the error, check that the values are correct.');
} else {
  console.log('\n❌ .env.local file not found.');
  console.log('Please create it with the content shown above.');
}

console.log('\n📝 Note: The .env.local file should be in your .gitignore to keep your keys secure.');
