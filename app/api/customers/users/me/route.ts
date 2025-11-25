import { NextRequest, NextResponse } from 'next/server';
import { createRequestClient, getAuthenticatedUserId } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRequestClient(request);
    const userId = await getAuthenticatedUserId(request);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRequestClient(request);
    const userId = await getAuthenticatedUserId(request);
    const body = await request.json();

    const updateData: Record<string, any> = {};
    if (typeof body.first_name === 'string') updateData.first_name = body.first_name;
    if (typeof body.last_name === 'string') updateData.last_name = body.last_name;
    if (typeof body.phone === 'string') updateData.phone = body.phone;
    if (typeof body.avatar_url === 'string') updateData.avatar_url = body.avatar_url;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


























