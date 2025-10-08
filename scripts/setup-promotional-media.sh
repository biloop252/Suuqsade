#!/bin/bash

# Promotional Media System Setup Script
echo "🚀 Setting up Promotional Media System..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    echo "   Please run this script from your project root"
    exit 1
fi

echo "📋 Running database migrations..."

# Run migration 051 (main promotional media tables)
echo "1. Running migration 051 (promotional media tables)..."
supabase db push --include-all

if [ $? -eq 0 ]; then
    echo "✅ Migration 051 completed successfully"
else
    echo "❌ Migration 051 failed"
    echo "   Check the error messages above"
    exit 1
fi

# Try migration 052 (storage bucket) - optional
echo "2. Running migration 052 (storage bucket)..."
supabase db push --include-all

if [ $? -eq 0 ]; then
    echo "✅ Migration 052 completed successfully"
else
    echo "⚠️  Migration 052 failed (this is optional)"
    echo "   Storage functionality will be limited"
    echo "   You can set up storage policies manually later"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start your development server: npm run dev"
echo "2. Navigate to: http://localhost:3000/admin/promotional-media"
echo "3. Create your first promotional media item"
echo ""
echo "If you encounter errors:"
echo "1. Check the browser console for specific error messages"
echo "2. Run: node scripts/check-promotional-media-db.js"
echo "3. Verify your Supabase connection in .env.local"



