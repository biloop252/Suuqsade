import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    
    const supabase = createClient();
    
    // Test basic connection with profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: profilesError.message 
      }, { status: 500 });
    }
    
    
    // Test pages table
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .limit(5);
    
    if (pagesError) {
      return NextResponse.json({ 
        error: 'Pages table not found or not accessible',
        details: pagesError.message,
        suggestion: 'Run the migration: npx supabase db push'
      }, { status: 500 });
    }
    
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      pagesCount: pages?.length || 0,
      samplePages: pages?.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status
      })) || []
    });
    
  } catch (error: unknown) {
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

