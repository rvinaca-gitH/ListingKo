import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const DEV_USER_ID = 'a1111111-1111-1111-1111-111111111111';

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

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    // Get the product first
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) throw productError;
    if (!product) throw new Error('Product not found');

    // For development, create a mock product master analysis
    // In production, this would call Claude AI or another AI service
    const masterData = {
      product_id: productId,
      user_id: DEV_USER_ID,
      name: product.title,
      description: product.description || `${product.title} - Premium quality product`,
      category: product.category || 'General',
      sku: (
        (product.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3) || 'SKU') +
        Date.now().toString().slice(-4)
      ).toUpperCase(),
      strengths: [
        'High quality materials',
        'Competitive pricing',
        'Durable construction',
        'Great customer reviews',
      ],
      target_customer: `Customers looking for quality ${product.category || 'products'} with excellent value`,
      use_cases: [
        `Perfect for everyday use`,
        `Ideal for professionals`,
        `Great for gift giving`,
      ],
      keywords: [
        product.title.toLowerCase(),
        `${product.category || 'product'} online`,
        `best ${product.category || 'product'}`,
        `${product.title.toLowerCase()} price`,
        `buy ${product.title.toLowerCase()}`,
      ],
      seo_score: 85,
      specifications: {
        condition: 'New',
        warranty: '1 Year Manufacturer Warranty',
        shipping: 'Free shipping available',
      },
      unsupported_claims: [],
      confidence_score: 0.92,
    };

    // Use RPC function to create/update product master
    const { data: masterResult, error: rpcError } = await supabaseAdmin.rpc(
      'create_product_master_dev',
      {
        p_product_id: productId,
        p_user_id: DEV_USER_ID,
        p_name: masterData.name,
        p_description: masterData.description,
        p_category: masterData.category,
        p_sku: masterData.sku,
        p_strengths: masterData.strengths,
        p_target_customer: masterData.target_customer,
        p_use_cases: masterData.use_cases,
        p_keywords: masterData.keywords,
        p_seo_score: masterData.seo_score,
        p_specifications: masterData.specifications,
        p_unsupported_claims: masterData.unsupported_claims,
        p_confidence_score: masterData.confidence_score,
      }
    );

    if (rpcError) throw rpcError;

    const result = masterResult || {};

    // Update product status to READY
    await supabaseAdmin
      .from('products')
      .update({ status: 'READY' })
      .eq('id', productId);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`POST /api/products/${params.id}/analyze error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}
