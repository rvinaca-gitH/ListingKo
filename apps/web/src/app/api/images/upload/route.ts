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

const DEV_USER_ID = 'a1111111-1111-1111-1111-111111111111';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    if (!file || !productId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Missing file or productId' },
        },
        { status: 400 }
      );
    }

    // Verify product exists
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Product not found' },
        },
        { status: 404 }
      );
    }

    // Upload to Supabase Storage
    const fileName = `${productId}/${Date.now()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, new Uint8Array(fileBuffer), {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(fileName);

    // Store image metadata in database
    const { data: imageData, error: insertError } = await supabaseAdmin
      .from('images')
      .insert([
        {
          product_id: productId,
          user_id: DEV_USER_ID,
          url_original: data.publicUrl,
          url_medium: data.publicUrl,
          url_large: data.publicUrl,
          type: 'USER_UPLOAD',
          original_filename: file.name,
          size_bytes: file.size,
          mime_type: file.type,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      data: imageData,
    });
  } catch (error) {
    console.error('POST /api/images/upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}
