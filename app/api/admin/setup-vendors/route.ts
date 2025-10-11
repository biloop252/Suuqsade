import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // First, check if there are any vendors in vendor_profiles
    const { data: existingVendors, error: fetchError } = await supabase
      .from('vendor_profiles')
      .select('id')
      .limit(1);

    if (fetchError) {
      console.error('Error fetching vendors:', fetchError);
      return NextResponse.json({ 
        error: fetchError.message,
        hint: 'Error checking existing vendors' 
      }, { status: 500 });
    }

    // If no vendors exist, create some sample vendors
    if (existingVendors && existingVendors.length === 0) {
      // First create profiles with vendor role
      const sampleProfiles = [
        {
          id: '550e8400-e29b-41d4-a716-446655440020',
          email: 'john@techgear.com',
          first_name: 'John',
          last_name: 'Smith',
          phone: '+1-555-0101',
          role: 'vendor',
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440021',
          email: 'sarah@fashionforward.com',
          first_name: 'Sarah',
          last_name: 'Johnson',
          phone: '+1-555-0102',
          role: 'vendor',
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440022',
          email: 'mike@homegarden.com',
          first_name: 'Mike',
          last_name: 'Wilson',
          phone: '+1-555-0103',
          role: 'vendor',
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440023',
          email: 'lisa@sportscentral.com',
          first_name: 'Lisa',
          last_name: 'Brown',
          phone: '+1-555-0104',
          role: 'vendor',
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440024',
          email: 'david@beautyessentials.com',
          first_name: 'David',
          last_name: 'Davis',
          phone: '+1-555-0105',
          role: 'vendor',
          is_active: true
        }
      ];

      // Insert profiles first
      const { error: profileError } = await supabase
        .from('profiles')
        .insert(sampleProfiles);

      if (profileError) {
        console.error('Error creating profiles:', profileError);
        return NextResponse.json({ 
          error: profileError.message,
          hint: 'Could not create sample profiles' 
        }, { status: 500 });
      }

      // Then create vendor_profiles
      const sampleVendorProfiles = [
        {
          id: '550e8400-e29b-41d4-a716-446655440020',
          business_name: 'TechGear Solutions',
          business_description: 'Leading technology solutions provider specializing in cutting-edge gadgets and electronics.',
          address: '123 Tech Street',
          city: 'San Francisco',
          district: 'Downtown',
          neighborhood: 'Financial District',
          country: 'USA',
          tax_id: 'TAX-123456789',
          commission_rate: 12.00,
          status: 'active'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440021',
          business_name: 'Fashion Forward',
          business_description: 'Trendy fashion retailer offering the latest styles and designer collections.',
          address: '456 Fashion Ave',
          city: 'New York',
          district: 'Manhattan',
          neighborhood: 'SoHo',
          country: 'USA',
          tax_id: 'TAX-987654321',
          commission_rate: 15.00,
          status: 'active'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440022',
          business_name: 'Home & Garden Co',
          business_description: 'Complete home and garden solutions for modern living.',
          address: '789 Garden Lane',
          city: 'Austin',
          district: 'Central',
          neighborhood: 'East Austin',
          country: 'USA',
          tax_id: 'TAX-456789123',
          commission_rate: 10.00,
          status: 'active'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440023',
          business_name: 'Sports Central',
          business_description: 'Premium sports equipment and athletic gear for all sports enthusiasts.',
          address: '321 Sports Blvd',
          city: 'Denver',
          district: 'Downtown',
          neighborhood: 'LoDo',
          country: 'USA',
          tax_id: 'TAX-789123456',
          commission_rate: 18.00,
          status: 'active'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440024',
          business_name: 'Beauty Essentials',
          business_description: 'Professional beauty and skincare products for all your cosmetic needs.',
          address: '654 Beauty Plaza',
          city: 'Los Angeles',
          district: 'Hollywood',
          neighborhood: 'West Hollywood',
          country: 'USA',
          tax_id: 'TAX-321654987',
          commission_rate: 20.00,
          status: 'active'
        }
      ];

      const { data, error } = await supabase
        .from('vendor_profiles')
        .insert(sampleVendorProfiles)
        .select();

      if (error) {
        console.error('Error creating sample vendor profiles:', error);
        return NextResponse.json({ 
          error: error.message,
          hint: 'Could not create sample vendor profiles' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Created ${data.length} sample vendors successfully` 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Found ${existingVendors.length} existing vendors` 
    });
  } catch (error: any) {
    console.error('Error managing vendors:', error);
    return NextResponse.json({ 
      error: error.message,
      hint: 'Error managing vendors' 
    }, { status: 500 });
  }
}
