import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const publicOnly = searchParams.get('public') === 'true';

    let query = supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('setting_key', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (publicOnly) {
      query = query.eq('is_public', true);
    }

    const { data: settings, error } = await query;

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/settings - Create or update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Settings array is required' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const setting of settings) {
      const { setting_key, setting_value, setting_type = 'text', category = 'general', description, is_public = false } = setting;

      if (!setting_key) {
        errors.push({ setting_key: 'missing', error: 'Setting key is required' });
        continue;
      }

      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key,
          setting_value,
          setting_type,
          category,
          description,
          is_public
        }, {
          onConflict: 'setting_key'
        })
        .select()
        .single();

      if (error) {
        console.error(`Error updating setting ${setting_key}:`, error);
        errors.push({ setting_key, error: error.message });
      } else {
        results.push(data);
      }
    }

    return NextResponse.json({ 
      success: errors.length === 0,
      updated: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in POST /api/admin/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/settings - Update a single setting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { setting_key, setting_value, setting_type, category, description, is_public } = body;

    if (!setting_key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const updateData: any = { setting_value };
    if (setting_type) updateData.setting_type = setting_type;
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (is_public !== undefined) updateData.is_public = is_public;

    const { data, error } = await supabase
      .from('system_settings')
      .update(updateData)
      .eq('setting_key', setting_key)
      .select()
      .single();

    if (error) {
      console.error('Error updating setting:', error);
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }

    return NextResponse.json({ setting: data });
  } catch (error) {
    console.error('Error in PUT /api/admin/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/settings - Delete a setting
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setting_key = searchParams.get('key');

    if (!setting_key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('setting_key', setting_key);

    if (error) {
      console.error('Error deleting setting:', error);
      return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
