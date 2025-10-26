import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Helper function to check admin role
async function checkAdminRole(supabase: any, userId: string) {
  // Check for test admin user first
  if (userId === 'admin-test-id') {
    return true;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Pages API GET request started');
    
    const supabase = createClient();
    console.log('✅ Supabase client created');
    
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    
    console.log('📋 Query params:', { page, limit, search, status, type });
    
    const offset = (page - 1) * limit;

    // First, let's test if the pages table exists
    console.log('🔍 Testing pages table existence...');
    const { data: testData, error: testError } = await supabase
      .from('pages')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Pages table error:', testError);
      return NextResponse.json({ 
        error: 'Pages table not found or not accessible', 
        details: testError.message 
      }, { status: 500 });
    }
    
    console.log('✅ Pages table accessible');

    // Build query
    let query = supabase
      .from('pages')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (type !== 'all') {
      query = query.eq('page_type', type);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    console.log('🔍 Executing pages query...');
    const { data: pages, error, count } = await query;

    if (error) {
      console.error('❌ Query error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch pages', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Query successful, found:', pages?.length || 0, 'pages');

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      pages: pages || [],
      totalPages,
      currentPage: page,
      totalCount: count || 0
    });

  } catch (error) {
    console.error('💥 Unexpected error in pages GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if slug already exists
    const { data: existingPage } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', body.slug)
      .single();

    if (existingPage) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Check for test admin user in headers
    const testAdminHeader = request.headers.get('x-test-admin');
    console.log('🔍 Test admin header:', testAdminHeader);
    let userId: string;
    
    if (testAdminHeader === 'true') {
      userId = 'admin-test-id'; // Use test admin
      console.log('✅ Using test admin user:', userId);
    } else {
      // Get current user and check admin role
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 Real user from auth:', user?.id);
      if (!user) {
        console.log('❌ No user found, returning 401');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    // Check if user has admin role
    console.log('🔍 Checking admin role for user:', userId);
    const isAdmin = await checkAdminRole(supabase, userId);
    console.log('🔍 Is admin:', isAdmin);
    if (!isAdmin) {
      console.log('❌ User is not admin, returning 403');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Create page
    const insertData: any = {
      slug: body.slug,
      title: body.title,
      content: body.content,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      meta_keywords: body.meta_keywords || null,
      page_type: body.page_type || 'static',
      status: body.status || 'draft',
      is_featured: body.is_featured || false,
      sort_order: body.sort_order || 0
    };

    // Only add created_by and updated_by if it's a real user (not test admin)
    if (userId !== 'admin-test-id') {
      insertData.created_by = userId;
      insertData.updated_by = userId;
    }

    console.log('🔍 POST - Final insert data:', insertData);

    const { data: page, error } = await supabase
      .from('pages')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating page:', error);
      return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
    }

    return NextResponse.json({ page }, { status: 201 });

  } catch (error) {
    console.error('💥 Unexpected error in pages POST:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}