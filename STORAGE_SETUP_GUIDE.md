# Promotional Media Storage Setup Guide

## Step 1: Run the Simplified Migration

Replace the current `052_promotional_media_storage.sql` with the simplified version:

```sql
-- Create storage bucket for promotional media (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
  'promotional-media',
  'promotional-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'promotional-media'
);
```

## Step 2: Create Storage Policies via Supabase Dashboard

### Go to Supabase Dashboard → Storage → Policies

### Policy 1: Public View Access
- **Policy Name**: `Public can view promotional media files`
- **Operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**:
```sql
bucket_id = 'promotional-media'
```

### Policy 2: Admin Upload Access
- **Policy Name**: `Admins can upload promotional media files`
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**:
```sql
bucket_id = 'promotional-media' AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'super_admin')
)
```

### Policy 3: Admin Update Access
- **Policy Name**: `Admins can update promotional media files`
- **Operation**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'promotional-media' AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'super_admin')
)
```

### Policy 4: Admin Delete Access
- **Policy Name**: `Admins can delete promotional media files`
- **Operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'promotional-media' AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'super_admin')
)
```

## Step 3: Verify Setup

Run this query to verify everything is working:

```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'promotional-media';

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%promotional%';
```

## Alternative: Skip Storage for Now

If you want to get the promotional media system working immediately without file uploads:

1. **Skip the storage migration entirely**
2. **The system will work without file uploads** - you can still:
   - Create promotional media items
   - Use external image URLs
   - Manage all other functionality
3. **Add storage later** when you have proper permissions

## Testing the System

Once the database tables are created (from migration 051), you can test the promotional media system:

1. Navigate to `/admin/promotional-media`
2. Create a promotional media item with external image URLs
3. Test all CRUD operations
4. Add file upload functionality later when storage is properly configured


