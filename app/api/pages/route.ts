import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    console.log('🔍 Fetching page with slug:', slug);

    // First try to find the page regardless of status
    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('❌ Error fetching page:', error);
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('❌ No page found with slug:', slug);
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
    }

    if (!page) {
      console.log('❌ Page not found for slug:', slug);
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check if page is published
    if (page.status !== 'published') {
      console.log('❌ Page found but not published. Status:', page.status);
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    console.log('✅ Page found:', page.title, 'Status:', page.status);

    return NextResponse.json({ page });

  } catch (error) {
    console.error('💥 Unexpected error in pages GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}