import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey
  });
}

// Use service role key for admin operations, fallback to anon key
const supabase = createClient(
  supabaseUrl!,
  supabaseServiceKey || supabaseAnonKey!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const image_type = searchParams.get('type');
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabase
      .from('system_images')
      .select('*')
      .order('image_type', { ascending: true })
      .order('created_at', { ascending: false });

    if (image_type) {
      query = query.eq('image_type', image_type);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: images, error } = await query;

    if (error) {
      console.error('Error fetching system images:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error in GET /api/admin/settings/images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST request received at /api/admin/settings/images');
    
    // Check environment variables first
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials',
        details: {
          supabaseUrl: !!supabaseUrl,
          supabaseAnonKey: !!supabaseAnonKey
        }
      }, { status: 500 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const image_type = formData.get('image_type') as string;
    const alt_text = formData.get('alt_text') as string;
    const is_active = formData.get('is_active') === 'true';
    
    console.log('Form data received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      imageType: image_type,
      altText: alt_text,
      isActive: is_active
    });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!image_type) {
      return NextResponse.json({ error: 'No image type provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type: ${file.type}`,
        allowedTypes: allowedTypes
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File size too large: ${Math.round(file.size / 1024)}KB`,
        maxSize: `${Math.round(maxSize / 1024)}KB`
      }, { status: 400 });
    }

    // Check if bucket exists
    console.log('Checking storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return NextResponse.json({ 
        error: 'Failed to access storage',
        details: bucketsError.message
      }, { status: 500 });
    }

    console.log('Available buckets:', buckets.map(b => ({ id: b.id, name: b.name, public: b.public })));

    const systemImagesBucket = buckets.find(b => b.name === 'system-images');
    if (!systemImagesBucket) {
      console.error('system-images bucket not found, attempting to create it...');
      
      // Try to create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('system-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return NextResponse.json({ 
          error: 'Storage bucket not found and could not be created',
          availableBuckets: buckets.map(b => b.name),
          createError: createError.message,
          details: 'The system-images bucket was not found and could not be created. Please check your Supabase permissions.'
        }, { status: 500 });
      }
      
      console.log('Bucket created successfully:', newBucket);
    } else {
      console.log('Bucket found:', systemImagesBucket);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${image_type}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `system/${fileName}`;

    console.log('Uploading file to path:', filePath);

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('system-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ 
        error: `Failed to upload file: ${uploadError.message}` 
      }, { status: 500 });
    }

    console.log('File uploaded successfully:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('system-images')
      .getPublicUrl(filePath);

    console.log('Public URL generated:', publicUrl);

    // Create image record in database
    const { data: imageData, error: insertError } = await supabase
      .from('system_images')
      .insert([{
        image_type,
        image_url: publicUrl,
        alt_text: alt_text || file.name,
        width: null,
        height: null,
        file_size: file.size,
        mime_type: file.type,
        is_active
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('system-images').remove([filePath]);
      return NextResponse.json({ 
        error: `Failed to create image record: ${insertError.message}` 
      }, { status: 500 });
    }

    console.log('Image record created successfully:', imageData);

    return NextResponse.json({ 
      message: 'Image uploaded and saved successfully',
      image: imageData,
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in POST /api/admin/settings/images:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, image_type, alt_text, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (image_type) updateData.image_type = image_type;
    if (alt_text !== undefined) updateData.alt_text = alt_text;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('system_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating image:', error);
      return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
    }

    return NextResponse.json({ image: data });
  } catch (error) {
    console.error('Error in PUT /api/admin/settings/images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Get image data first to get file path
    const { data: imageData, error: fetchError } = await supabase
      .from('system_images')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching image:', fetchError);
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Extract file path from URL
    const url = new URL(imageData.image_url);
    const filePath = url.pathname.split('/').slice(-2).join('/');

    // Delete from database
    const { error: deleteError } = await supabase
      .from('system_images')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting image record:', deleteError);
      return NextResponse.json({ error: 'Failed to delete image record' }, { status: 500 });
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('system-images')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/settings/images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}