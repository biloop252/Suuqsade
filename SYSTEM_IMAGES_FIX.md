# System Images Storage Fix Guide

## Problem
The system logo upload is failing with the error: "Storage bucket not found and could not be created, system logo is not uploading system image table and system-images bucket"

## Root Cause
The `system-images` storage bucket was not created properly or the migration didn't run successfully.

## Solutions

### Option 1: Run the Fix Script (Recommended)
```bash
node scripts/fix-system-images-storage.js
```

### Option 2: Manual SQL Setup
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the contents of `scripts/fix-system-images-storage.sql`

### Option 3: Manual Bucket Creation
1. Go to your Supabase dashboard
2. Navigate to Storage
3. Click "Create a new bucket"
4. Set bucket name: `system-images`
5. Make it public: ✅
6. Set file size limit: `5242880` (5MB)
7. Set allowed MIME types: `image/jpeg, image/png, image/gif, image/webp, image/svg+xml`

### Option 4: Run Migration
```bash
supabase db push
```

## Verification
After applying any of the above solutions, run:
```bash
node scripts/test-system-images-complete.js
```

## Environment Variables
Make sure you have the following environment variables set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (recommended for admin operations)

## What Was Fixed
1. ✅ Updated API route to use service role key for better permissions
2. ✅ Created fix script for automatic bucket creation
3. ✅ Created SQL script for manual bucket creation
4. ✅ Created comprehensive test script
5. ✅ Added proper error handling and fallbacks

## Next Steps
1. Apply one of the solutions above
2. Test the system logo upload functionality
3. Verify images appear in the admin settings
4. Check that images are stored in the `system_images` table

