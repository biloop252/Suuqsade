import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // First, try to fetch existing discounts to see if table exists
    const { data: existingDiscounts, error: fetchError } = await supabase
      .from('discounts')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('Error fetching discounts:', fetchError);
      return NextResponse.json({ 
        error: fetchError.message,
        hint: 'The discounts table may not exist. Please run the migration first.' 
      }, { status: 500 });
    }

    // If table exists but is empty, create some sample data
    if (existingDiscounts && existingDiscounts.length === 0) {
      const sampleDiscounts = [
        {
          name: 'Welcome Discount',
          description: '10% off for new customers',
          code: 'WELCOME10',
          type: 'percentage',
          value: 10,
          minimum_order_amount: 50,
          usage_limit: 1000,
          usage_limit_per_user: 1,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          is_active: true,
          is_global: true
        },
        {
          name: 'Free Shipping',
          description: 'Free shipping on orders over $75',
          code: 'FREESHIP75',
          type: 'free_shipping',
          value: 0,
          minimum_order_amount: 75,
          usage_limit: 500,
          usage_limit_per_user: 1,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
          is_active: true,
          is_global: true
        },
        {
          name: 'Summer Sale',
          description: '$20 off orders over $100',
          code: 'SUMMER20',
          type: 'fixed_amount',
          value: 20,
          minimum_order_amount: 100,
          usage_limit: 200,
          usage_limit_per_user: 2,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
          is_active: true,
          is_global: true
        }
      ];

      const { data, error } = await supabase
        .from('discounts')
        .insert(sampleDiscounts)
        .select();

      if (error) {
        console.error('Error creating sample discounts:', error);
        return NextResponse.json({ 
          error: error.message,
          hint: 'Could not create sample discounts' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Created ${data.length} sample discounts successfully` 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Discounts table exists and contains data' 
    });
  } catch (error: any) {
    console.error('Error testing discounts table:', error);
    return NextResponse.json({ 
      error: error.message,
      hint: 'The discounts table may not exist. Please run the migration first.' 
    }, { status: 500 });
  }
}
