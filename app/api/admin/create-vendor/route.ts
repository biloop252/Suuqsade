import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      business_name,
      business_description,
      address,
      city,
      district,
      neighborhood,
      country,
      tax_id,
      commission_rate,
      logo_url,
      business_license_url,
      national_id_url,
      status
    } = body;

    // Validate required fields
    if (!email || !password || !business_name || !business_description || !phone || !address || !city || !district || !neighborhood || !country || !tax_id) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          role: 'vendor'
        }
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { error: 'Failed to create auth user: ' + authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error('No user returned from signup');
      return NextResponse.json(
        { error: 'Failed to create user - no user returned' },
        { status: 400 }
      );
    }

    console.log('User created successfully:', authData.user.id);

    // Update the profile with additional vendor information
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        role: 'vendor'
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile: ' + profileError.message },
        { status: 400 }
      );
    }

    // Now create the vendor profile using the database function
    const { data: functionResult, error: functionError } = await supabase
      .rpc('create_vendor_profile', {
        p_user_id: authData.user.id,
        p_business_name: business_name,
        p_business_description: business_description,
        p_address: address,
        p_city: city,
        p_district: district,
        p_neighborhood: neighborhood,
        p_country: country,
        p_tax_id: tax_id,
        p_commission_rate: parseFloat(commission_rate.toString()),
        p_logo_url: logo_url || null,
        p_business_license_url: business_license_url || null,
        p_national_id_url: national_id_url || null,
        p_status: status
      });

    if (functionError) {
      console.error('Database function error:', functionError);
      return NextResponse.json(
        { error: 'Failed to create vendor profile: ' + functionError.message },
        { status: 400 }
      );
    }

    if (!functionResult || !functionResult.success) {
      console.error('Function returned error:', functionResult);
      return NextResponse.json(
        { error: functionResult?.error || 'Failed to create vendor profile' },
        { status: 400 }
      );
    }

    console.log('Vendor profile created successfully:', functionResult);

    return NextResponse.json({ 
      success: true, 
      userId: functionResult.user_id,
      message: 'Vendor created successfully' 
    });

  } catch (error) {
    console.error('Create vendor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
