import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // First, try to fetch existing coupons to see if table exists
    const { data: existingCoupons, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('Error fetching coupons:', fetchError);
      return NextResponse.json({ 
        error: fetchError.message,
        hint: 'The coupons table may not exist. Please run the migration first.' 
      }, { status: 500 });
    }

    // If table exists but is empty, create some sample data
    if (existingCoupons && existingCoupons.length === 0) {
      const sampleCoupons = [
        {
          name: 'New Customer Welcome',
          description: '15% off your first order',
          code: 'WELCOME15',
          type: 'percentage',
          value: 15,
          minimum_order_amount: 25,
          usage_limit: 500,
          usage_limit_per_user: 1,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
          is_active: true,
          is_global: true
        },
        {
          name: 'Holiday Special',
          description: '$25 off orders over $150',
          code: 'HOLIDAY25',
          type: 'fixed_amount',
          value: 25,
          minimum_order_amount: 150,
          usage_limit: 100,
          usage_limit_per_user: 1,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
          is_active: true,
          is_global: true
        },
        {
          name: 'Student Discount',
          description: '20% off for students',
          code: 'STUDENT20',
          type: 'percentage',
          value: 20,
          minimum_order_amount: 30,
          usage_limit: 200,
          usage_limit_per_user: 3,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days from now
          is_active: true,
          is_global: true
        },
        {
          name: 'Flash Sale',
          description: '30% off everything - limited time',
          code: 'FLASH30',
          type: 'percentage',
          value: 30,
          minimum_order_amount: 50,
          usage_limit: 50,
          usage_limit_per_user: 1,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          is_active: true,
          is_global: true
        }
      ];

      const { data, error } = await supabase
        .from('coupons')
        .insert(sampleCoupons)
        .select();

      if (error) {
        console.error('Error creating sample coupons:', error);
        return NextResponse.json({ 
          error: error.message,
          hint: 'Could not create sample coupons' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Created ${data.length} sample coupons successfully` 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Coupons table exists and contains data' 
    });
  } catch (error: any) {
    console.error('Error testing coupons table:', error);
    return NextResponse.json({ 
      error: error.message,
      hint: 'The coupons table may not exist. Please run the migration first.' 
    }, { status: 500 });
  }
}

