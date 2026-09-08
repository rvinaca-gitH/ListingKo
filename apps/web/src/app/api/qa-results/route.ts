import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Missing productId parameter' },
        },
        { status: 400 }
      );
    }

    // Get all listings for this product
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('product_id', productId);

    if (listingsError) throw listingsError;

    if (!listings || listings.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const listingIds = listings.map(l => l.id);

    // Get QA results for all listings
    const { data: qaResults, error: qaError } = await supabaseAdmin
      .from('qa_results')
      .select('*')
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });

    if (qaError) throw qaError;

    return NextResponse.json({
      success: true,
      data: qaResults || [],
    });
  } catch (error) {
    console.error('GET /api/qa-results error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}
