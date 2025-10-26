import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    console.log('🔍 Fetching all published pages');

    // Fetch all published pages
    const { data: pages, error } = await supabase
      .from('pages')
      .select('*')
      .eq('status', 'published') // Only fetch published pages
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching pages:', error);
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    console.log('✅ Found', pages?.length || 0, 'published pages');

    return NextResponse.json({ pages: pages || [] });

  } catch (error) {
    console.error('💥 Unexpected error in pages GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



